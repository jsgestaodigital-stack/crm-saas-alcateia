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

interface AgencySubscription {
  agency_id: string;
  agency_name: string;
  agency_status: string;
  plan_name: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  members_count: number;
  clients_count: number;
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

  // Fetch subscriptions with agency info
  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ["super-admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          agency_id,
          status,
          trial_ends_at,
          current_period_end,
          plan_id,
          plans!inner(name),
          agencies!inner(id, name, status)
        `)
        .order("current_period_end", { ascending: true });
      
      if (error) throw error;
      
      // Get agency stats
      const { data: agenciesData } = await supabase.rpc("get_all_agencies_with_stats");
      const statsMap = new Map(agenciesData?.map((a: AgencyWithStats) => [a.id, a]) || []);
      
      return (data || []).map((sub: any) => ({
        agency_id: sub.agency_id,
        agency_name: sub.agencies?.name || "—",
        agency_status: sub.agencies?.status || "unknown",
        plan_name: sub.plans?.name || null,
        subscription_status: sub.status,
        trial_ends_at: sub.trial_ends_at,
        current_period_end: sub.current_period_end,
        members_count: (statsMap.get(sub.agency_id) as AgencyWithStats)?.members_count || 0,
        clients_count: (statsMap.get(sub.agency_id) as AgencyWithStats)?.clients_count || 0,
      })) as AgencySubscription[];
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

  // Financial stats from subscriptions
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const financialStats = {
    overdue: subscriptions?.filter((s) => {
      if (!s.current_period_end) return false;
      return new Date(s.current_period_end) < now && s.subscription_status !== "cancelled";
    }).length || 0,
    trialExpiringSoon: subscriptions?.filter((s) => {
      if (s.subscription_status !== "trial" || !s.trial_ends_at) return false;
      const trialEnd = new Date(s.trial_ends_at);
      return trialEnd > now && trialEnd <= sevenDaysFromNow;
    }).length || 0,
    activeSubscriptions: subscriptions?.filter((s) => s.subscription_status === "active").length || 0,
    trialSubscriptions: subscriptions?.filter((s) => s.subscription_status === "trial").length || 0,
  };

  return {
    agencies,
    auditLogs,
    subscriptions,
    stats,
    financialStats,
    isLoadingAgencies,
    isLoadingLogs,
    isLoadingSubscriptions,
    refetchAgencies,
    refetchLogs,
    refetchSubscriptions,
    approveAgency,
    suspendAgency,
    reactivateAgency,
    impersonateAgency,
    exitImpersonate,
  };
}
