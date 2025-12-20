import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { mapRowToClient, mapClientToRow, createClientInsertRow, ClientRow } from "@/lib/clientMapper";
import { toast } from "sonner";

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
      toast.error("Erro ao carregar clientes");
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
    
    const { data, error } = await supabase
      .from("clients")
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;

    toast.success(`Cliente "${client.companyName}" criado com sucesso`);
    return mapRowToClient(data as unknown as ClientRow);
  } catch (error) {
    console.error("Error creating client:", error);
    toast.error("Erro ao criar cliente");
    return null;
  }
}

export async function updateClientInDb(clientId: string, updates: Partial<Client>): Promise<boolean> {
  try {
    const updateData = mapClientToRow(updates);
    
    const { error } = await supabase
      .from("clients")
      .update(updateData as any)
      .eq("id", clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating client:", error);
    toast.error("Erro ao atualizar cliente");
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
    toast.error("Erro ao excluir cliente");
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
    toast.error("Erro ao restaurar cliente");
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
    toast.error("Erro ao excluir cliente permanentemente");
    return false;
  }
}
