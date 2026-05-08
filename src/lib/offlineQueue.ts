/**
 * Offline mutation retry queue.
 * Stores failed mutations in localStorage and replays them when the network
 * comes back online. Designed for low-stakes UPDATE operations (checklist
 * toggles, simple field edits) where eventual consistency is acceptable.
 */
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "gbrank.offline-queue.v1";

export interface PendingMutation {
  id: string;
  table: string;
  rowId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

function readQueue(): PendingMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingMutation[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingMutation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — silently drop oldest
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-50)));
    } catch {
      /* give up */
    }
  }
}

export function enqueueMutation(m: Omit<PendingMutation, "id" | "timestamp">) {
  const queue = readQueue();
  queue.push({ ...m, id: crypto.randomUUID(), timestamp: Date.now() });
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent("offline-queue:changed"));
}

export function getPendingCount(): number {
  return readQueue().length;
}

export function isOfflineError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Network request failed") ||
    !navigator.onLine
  );
}

/**
 * Wrap a Supabase update so failures caused by offline state are queued for
 * retry instead of bubbling up. Returns true if the call succeeded or was
 * queued; false if it failed for a reason other than connectivity.
 */
export async function safeUpdate(
  table: string,
  rowId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; queued: boolean; error?: unknown }> {
  try {
    // @ts-expect-error — dynamic table name; caller is responsible for validity
    const { error } = await supabase.from(table).update(payload).eq("id", rowId);
    if (error) {
      if (isOfflineError(error)) {
        enqueueMutation({ table, rowId, payload });
        return { ok: true, queued: true };
      }
      return { ok: false, queued: false, error };
    }
    return { ok: true, queued: false };
  } catch (err) {
    if (isOfflineError(err)) {
      enqueueMutation({ table, rowId, payload });
      return { ok: true, queued: true };
    }
    return { ok: false, queued: false, error: err };
  }
}

let isSyncing = false;

export async function retrySyncPending(): Promise<{ synced: number; failed: number }> {
  if (isSyncing || !navigator.onLine) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;
  try {
    let queue = readQueue();
    const remaining: PendingMutation[] = [];

    for (const m of queue) {
      try {
        // @ts-expect-error — dynamic table name
        const { error } = await supabase.from(m.table).update(m.payload).eq("id", m.rowId);
        if (error) {
          if (isOfflineError(error)) {
            remaining.push(m);
          } else {
            // Permanent failure (RLS, validation, etc.) — drop it
            failed++;
          }
        } else {
          synced++;
        }
      } catch (err) {
        if (isOfflineError(err)) {
          remaining.push(m);
        } else {
          failed++;
        }
      }
    }

    writeQueue(remaining);
    window.dispatchEvent(new CustomEvent("offline-queue:changed"));
  } finally {
    isSyncing = false;
  }
  return { synced, failed };
}
