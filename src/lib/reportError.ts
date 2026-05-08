/**
 * Lightweight production error reporter.
 * Writes to public.production_errors via direct REST (no supabase client),
 * so it works inside React Error Boundaries and offline catch blocks.
 */
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface ReportErrorPayload {
  error_type: string;
  error_message: string;
  component?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort error reporter. Never throws.
 */
export async function reportError(
  type: string,
  message: string,
  component?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    let userId: string | null = null;
    let agencyId: string | null = null;
    let token: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
      userId = data.session?.user?.id ?? null;
      // current_agency_id from profile cached in JWT app_metadata? fallback null
      agencyId =
        (data.session?.user?.user_metadata?.current_agency_id as string) ??
        null;
    } catch {
      /* ignore */
    }

    const body = {
      error_type: type.slice(0, 200),
      error_message: String(message ?? "").slice(0, 5000),
      component: component ? String(component).slice(0, 200) : null,
      user_id: userId,
      agency_id: agencyId,
      metadata: {
        url: typeof location !== "undefined" ? location.href : null,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        ...(metadata ?? {}),
      },
    };

    await fetch(`${SUPABASE_URL}/rest/v1/production_errors`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token ?? SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
  } catch {
    // swallow — reporting must never crash the app
  }
}
