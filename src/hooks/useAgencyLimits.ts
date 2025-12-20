import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgencyLimits {
  id: string;
  agency_id: string;
  max_users: number;
  max_leads: number;
  max_clients: number;
  max_recurring_clients: number;
  storage_mb: number;
  features: {
    ai_agents?: boolean;
    exports?: boolean;
    api_access?: boolean;
  };
  notes: string | null;
}

export interface AgencyUsage {
  id: string;
  agency_id: string;
  current_users: number;
  current_leads: number;
  current_clients: number;
  current_recurring_clients: number;
  storage_used_mb: number;
  last_calculated_at: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  remaining: number;
  percentage: number;
  message: string;
}

export type ResourceType = 'users' | 'leads' | 'clients' | 'recurring_clients';

export function useAgencyLimits() {
  const { user, currentAgencyId } = useAuth();
  const queryClient = useQueryClient();
  const agencyId = currentAgencyId;

  // Buscar limites da agência atual
  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ["agency-limits", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      
      const { data, error } = await supabase
        .from("agency_limits")
        .select("*")
        .eq("agency_id", agencyId)
        .maybeSingle();

      if (error) throw error;
      return data as AgencyLimits | null;
    },
    enabled: !!user && !!agencyId,
  });

  // Buscar uso atual da agência
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["agency-usage", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      const { data, error } = await supabase
        .from("agency_usage")
        .select("*")
        .eq("agency_id", agencyId)
        .maybeSingle();

      if (error) throw error;
      return data as AgencyUsage | null;
    },
    enabled: !!user && !!agencyId,
  });

  // Verificar limite específico
  const checkLimit = async (resource: ResourceType, increment: number = 1): Promise<LimitCheckResult> => {
    if (!agencyId) {
      return { allowed: true, current: 0, max: 0, remaining: 0, percentage: 0, message: "No agency" };
    }

    const { data, error } = await supabase.rpc("check_limit", {
      _agency_id: agencyId,
      _resource: resource,
      _increment: increment,
    });

    if (error) {
      console.error("Error checking limit:", error);
      return { allowed: true, current: 0, max: 0, remaining: 0, percentage: 0, message: error.message };
    }

    return data as unknown as LimitCheckResult;
  };

  // Recalcular uso
  const recalculateUsage = useMutation({
    mutationFn: async () => {
      if (!agencyId) throw new Error("No agency");

      const { data, error } = await supabase.rpc("calculate_agency_usage", {
        _agency_id: agencyId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-usage", agencyId] });
    },
  });

  // Calcular porcentagens de uso
  const getUsagePercentage = (resource: ResourceType): number => {
    if (!limits || !usage) return 0;

    const currentMap: Record<ResourceType, number> = {
      users: usage.current_users,
      leads: usage.current_leads,
      clients: usage.current_clients,
      recurring_clients: usage.current_recurring_clients,
    };

    const maxMap: Record<ResourceType, number> = {
      users: limits.max_users,
      leads: limits.max_leads,
      clients: limits.max_clients,
      recurring_clients: limits.max_recurring_clients,
    };

    const current = currentMap[resource];
    const max = maxMap[resource];

    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  // Verificar se está próximo do limite (>80%)
  const isNearLimit = (resource: ResourceType): boolean => {
    return getUsagePercentage(resource) >= 80;
  };

  // Verificar se atingiu o limite
  const isAtLimit = (resource: ResourceType): boolean => {
    return getUsagePercentage(resource) >= 100;
  };

  return {
    limits,
    usage,
    isLoading: limitsLoading || usageLoading,
    checkLimit,
    recalculateUsage,
    getUsagePercentage,
    isNearLimit,
    isAtLimit,
  };
}
