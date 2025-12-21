import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Invite {
  id: string;
  agency_id: string;
  email: string;
  role: AppRole;
  token: string;
  invited_by: string;
  invited_by_name: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InviteInfo {
  id: string;
  agency_id: string;
  agency_name: string;
  email: string;
  role: AppRole;
  invited_by_name: string;
  status: string;
  expires_at: string;
  is_expired: boolean;
}

export function useInvites() {
  const { user, currentAgencyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending invites for current agency
  const {
    data: invites,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agency-invites", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];

      const { data, error } = await supabase
        .from("agency_invites")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Invite[];
    },
    enabled: !!user && !!currentAgencyId,
  });

  // Create invite mutation
  const createInvite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const { data, error } = await supabase.rpc("create_invite", {
        _email: email.toLowerCase(),
        _role: role,
      });
      if (error) throw error;
      
      // Get the created invite to return the token
      const { data: invite, error: fetchError } = await supabase
        .from("agency_invites")
        .select("*")
        .eq("id", data)
        .single();
        
      if (fetchError) throw fetchError;
      return invite as Invite;
    },
    onSuccess: () => {
      toast({ title: "Convite criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["agency-invites"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invite mutation
  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("agency_invites")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Convite cancelado" });
      queryClient.invalidateQueries({ queryKey: ["agency-invites"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingInvites = invites?.filter((i) => i.status === "pending") || [];

  return {
    invites,
    pendingInvites,
    isLoading,
    createInvite,
    cancelInvite,
    refetch,
  };
}

// Hook for invite acceptance (used on /convite/:token page)
export function useInviteAcceptance(token: string | undefined) {
  const { toast } = useToast();

  // Get invite info
  const {
    data: invite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invite-info", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc("get_invite_by_token", {
        _token: token,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as InviteInfo;
    },
    enabled: !!token,
  });

  // Accept invite mutation
  const acceptInvite = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Token inválido");

      const { data, error } = await supabase.rpc("accept_invite", {
        _token: token,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; agency_id?: string; role?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Erro ao aceitar convite");
      }

      return result;
    },
    onSuccess: () => {
      toast({ title: "Convite aceito com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    invite,
    isLoading,
    error,
    acceptInvite,
  };
}
