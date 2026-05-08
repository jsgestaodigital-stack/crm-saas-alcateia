import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { mapRowToClient, mapClientToRow, createClientInsertRow, ClientRow } from "@/lib/clientMapper";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorHandler";

export function useClientsRealtime(
  setClients: (clients: Client[]) => void,
  setDeletedClients: (clients: Client[]) => void,
  setLoading: (loading: boolean) => void
) {
  // Fetch all clients from database
  const fetchClients = useCallback(async () => {
    try {
      // Fetch active clients
      const { data: activeData, error: activeError } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("last_update", { ascending: false });

      if (activeError) throw activeError;

      // Fetch deleted clients (trash)
      const { data: deletedData, error: deletedError } = await supabase
        .from("clients")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (deletedError) throw deletedError;

      const activeClients = (activeData || []).map((row) => mapRowToClient(row as unknown as ClientRow));
      const deletedClients = (deletedData || []).map((row) => mapRowToClient(row as unknown as ClientRow));

      setClients(activeClients);
      setDeletedClients(deletedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [setClients, setDeletedClients, setLoading]);

  // Initial fetch: if the session isn't ready yet (common on the published domain),
  // don't "lock in" an empty list — refetch as soon as auth is available.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        fetchClients();
      } else {
        setClients([]);
        setDeletedClients([]);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchClients, setClients, setDeletedClients, setLoading]);

  // Refetch whenever auth state changes (SIGNED_IN / INITIAL_SESSION)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchClients();
      } else {
        setClients([]);
        setDeletedClients([]);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchClients, setClients, setDeletedClients]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("clients-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          // Refetch on any change
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClients]);

  return { refetch: fetchClients };
}

// Client CRUD operations
export async function createClient(client: Omit<Client, 'id'>): Promise<Client | null> {
  try {
    const insertData = createClientInsertRow(client);

    // Attempt 1: insert with checklist
    let { data, error } = await supabase
      .from("clients")
      .insert(insertData as any)
      .select()
      .single();

    // Retry path: if first insert failed, try without checklist then patch it
    if (error) {
      console.warn("createClient: attempt 1 failed, retrying without checklist:", error.message);
      const { checklist, ...withoutChecklist } = insertData as any;
      const fallback = await supabase
        .from("clients")
        .insert({ ...withoutChecklist, checklist: [] } as any)
        .select()
        .single();

      if (fallback.error) throw fallback.error;
      data = fallback.data;

      const patch = await supabase
        .from("clients")
        .update({ checklist } as any)
        .eq("id", (data as any).id);

      if (patch.error) {
        console.error("createClient: checklist patch (attempt 2) failed:", patch.error.message);
        const { data: userRes } = await supabase.auth.getUser();
        const u = userRes?.user;
        const { data: prof } = u
          ? await supabase.from("profiles").select("full_name, current_agency_id").eq("id", u.id).single()
          : { data: null as any };
        if (prof?.current_agency_id && u) {
          await supabase.from("audit_log").insert({
            user_id: u.id,
            user_name: prof.full_name || u.email || "Sistema",
            action_type: "seed_checklist_failed",
            entity_type: "client",
            entity_id: (data as any).id,
            entity_name: (data as any).company_name,
            agency_id: prof.current_agency_id,
            metadata: { error: patch.error.message, attempts: 2, source: "createClient" },
          } as any);
        }
        toast.warning("Cliente criado, mas o checklist não foi gerado. Use o botão 'Gerar checklist' no painel do cliente.");
      }
    }

    toast.success(`Cliente "${client.companyName}" criado com sucesso`);
    return mapRowToClient(data as unknown as ClientRow);
  } catch (error) {
    console.error("Error creating client:", error);
    toast.error(getErrorMessage(error));
    return null;
  }
}

// Manually seed/regenerate the checklist for a client (used by ClientDetailPanel banner)
export async function seedClientChecklist(clientId: string, checklist: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("clients")
      .update({ checklist } as any)
      .eq("id", clientId);
    if (error) throw error;
    toast.success("Checklist gerado com sucesso");
    return true;
  } catch (error) {
    console.error("seedClientChecklist error:", error);
    toast.error(getErrorMessage(error));
    return false;
  }
}

export async function updateClientInDb(clientId: string, updates: Partial<Client>): Promise<boolean> {
  const updateData = mapClientToRow(updates);
  try {
    const { error } = await supabase
      .from("clients")
      .update(updateData as any)
      .eq("id", clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    // If the failure is a connectivity issue, queue the mutation for retry
    // when the browser comes back online. Optimistic UI state remains intact
    // — no toast, no data loss. The OfflineBanner already informs the user.
    const { isOfflineError, enqueueMutation } = await import("@/lib/offlineQueue");
    if (isOfflineError(error)) {
      enqueueMutation({
        table: "clients",
        rowId: clientId,
        payload: updateData as Record<string, unknown>,
      });
      return true;
    }
    console.error("Error updating client:", error);
    toast.error(getErrorMessage(error));
    return false;
  }
}

export async function softDeleteClient(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("clients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", clientId);

    if (error) throw error;
    
    toast.success("Cliente movido para a lixeira");
    return true;
  } catch (error) {
    console.error("Error deleting client:", error);
    toast.error(getErrorMessage(error));
    return false;
  }
}

export async function restoreClientFromDb(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("clients")
      .update({ deleted_at: null, last_update: new Date().toISOString() })
      .eq("id", clientId);

    if (error) throw error;
    
    toast.success("Cliente restaurado com sucesso");
    return true;
  } catch (error) {
    console.error("Error restoring client:", error);
    toast.error(getErrorMessage(error));
    return false;
  }
}

export async function permanentlyDeleteClientFromDb(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) throw error;
    
    toast.success("Cliente excluído permanentemente");
    return true;
  } catch (error) {
    console.error("Error permanently deleting client:", error);
    toast.error(getErrorMessage(error));
    return false;
  }
}
