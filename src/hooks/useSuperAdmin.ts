import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgencyWithStats {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  members_count: number;
  clients_count: number;
  leads_count: number;
}

interface AuditLog {
  id: string;
  super_admin_user_id: string;
  super_admin_name: string;
  agency_id: string | null;
  agency_name: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useSuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all agencies with stats
  const {
    data: agencies,
    isLoading: isLoadingAgencies,
    refetch: refetchAgencies,
  } = useQuery({
    queryKey: ["super-admin-agencies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_agencies_with_stats");
      if (error) throw error;
      return data as AgencyWithStats[];
    },
  });

  // Fetch audit logs
  const {
    data: auditLogs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["super-admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_super_admin_logs", { _limit: 100 });
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Approve agency mutation
  const approveAgency = useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase.rpc("approve_agency", { _agency_id: agencyId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Agência aprovada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-logs"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao aprovar agência", description: error.message, variant: "destructive" });
    },
  });

  // Suspend agency mutation
  const suspendAgency = useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase.rpc("suspend_agency", { _agency_id: agencyId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Agência suspensa com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-logs"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao suspender agência", description: error.message, variant: "destructive" });
    },
  });

  // Reactivate agency mutation
  const reactivateAgency = useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase.rpc("reactivate_agency", { _agency_id: agencyId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Agência reativada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-logs"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao reativar agência", description: error.message, variant: "destructive" });
    },
  });

  // Impersonate agency mutation
  const impersonateAgency = useMutation({
    mutationFn: async (agencyId: string) => {
      const { error } = await supabase.rpc("impersonate_agency", { _agency_id: agencyId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Modo impersonate ativado" });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-logs"] });
      // Reload the page to apply new agency context
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({ title: "Erro ao entrar como agência", description: error.message, variant: "destructive" });
    },
  });

  // Exit impersonate mutation
  const exitImpersonate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("exit_impersonate");
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Modo impersonate desativado" });
      // Reload the page to apply new context
      window.location.href = "/super-admin";
    },
    onError: (error) => {
      toast({ title: "Erro ao sair do modo impersonate", description: error.message, variant: "destructive" });
    },
  });

  // Computed stats
  const stats = {
    total: agencies?.length || 0,
    pending: agencies?.filter((a) => a.status === "pending").length || 0,
    active: agencies?.filter((a) => a.status === "active").length || 0,
    suspended: agencies?.filter((a) => a.status === "suspended").length || 0,
    totalClients: agencies?.reduce((sum, a) => sum + a.clients_count, 0) || 0,
    totalLeads: agencies?.reduce((sum, a) => sum + a.leads_count, 0) || 0,
    totalMembers: agencies?.reduce((sum, a) => sum + a.members_count, 0) || 0,
  };

  return {
    agencies,
    auditLogs,
    stats,
    isLoadingAgencies,
    isLoadingLogs,
    refetchAgencies,
    refetchLogs,
    approveAgency,
    suspendAgency,
    reactivateAgency,
    impersonateAgency,
    exitImpersonate,
  };
}
