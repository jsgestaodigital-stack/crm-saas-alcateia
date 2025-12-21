import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

// Features JSONB unificado com o banco de dados
export interface PlanFeaturesDB {
  funil_tarefas?: boolean;
  funil_avancado?: boolean;
  automacoes?: boolean;
  relatorios_agencia?: boolean;
  relatorios_cliente?: boolean;
  dashboard_principal?: boolean;
  dashboard_financeiro?: boolean;
  cobranca_stripe?: boolean;
  comissoes?: boolean;
  logs_auditoria?: boolean;
  exportacao?: boolean;
  integracao_alfaleads?: boolean;
  suporte_email?: boolean;
  suporte_prioritario?: boolean;
  suporte_whatsapp?: boolean;
  acesso_antecipado?: boolean;
  limite_tarefas_mes?: number;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_users: number;
  max_leads: number;
  max_clients: number;
  max_recurring_clients: number;
  storage_mb: number;
  features: PlanFeaturesDB;
  trial_days: number;
  active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  agency_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'past_due';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  plan?: Plan;
}

export interface AgencyFeatures {
  has_subscription: boolean;
  status: string;
  plan_name?: string;
  plan_id?: string;
  trial_ends_at?: string;
  current_period_end?: string;
  features: Record<string, boolean>;
  limits: {
    max_users: number;
    max_leads: number;
    max_clients: number;
    max_recurring_clients?: number;
    storage_mb?: number;
  };
  message?: string;
}

export function useSubscription() {
  const { user, currentAgencyId } = useAuth();
  const queryClient = useQueryClient();

  // Buscar assinatura da agência atual
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plan:plans(*)
        `)
        .eq("agency_id", currentAgencyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          plan: data.plan as unknown as Plan,
          features: (data.plan as any)?.features || {},
        } as Subscription & { plan: Plan };
      }
      return null;
    },
    enabled: !!user && !!currentAgencyId,
  });

  // Buscar features via RPC
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ["agency-features", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return null;

      const { data, error } = await supabase.rpc("get_agency_features", {
        _agency_id: currentAgencyId,
      });

      if (error) throw error;
      return data as unknown as AgencyFeatures;
    },
    enabled: !!user && !!currentAgencyId,
  });

  // Buscar todos os planos ativos
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        features: p.features as Plan['features']
      })) as Plan[];
    },
    enabled: !!user,
  });

  // Verificar dias restantes do trial
  const getTrialDaysRemaining = (): number | null => {
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_ends_at) {
      return null;
    }
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Verificar se está em trial
  const isInTrial = subscription?.status === 'trial';

  // Verificar se trial expirou
  const isTrialExpired = (): boolean => {
    if (!isInTrial || !subscription?.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) < new Date();
  };

  // Verificar se assinatura está ativa
  const isActive = subscription?.status === 'active' || (isInTrial && !isTrialExpired());

  // Verificar se tem feature específica
  const hasFeature = (feature: string): boolean => {
    if (!features) return false;
    return features.features?.[feature] === true;
  };

  return {
    subscription,
    features,
    plans,
    isLoading: subscriptionLoading || featuresLoading || plansLoading,
    getTrialDaysRemaining,
    isInTrial,
    isTrialExpired,
    isActive,
    hasFeature,
  };
}

// Hook para Super Admin gerenciar planos
export function usePlansAdmin() {
  const queryClient = useQueryClient();

  // Buscar todos os planos (incluindo inativos)
  const { data: allPlans, isLoading } = useQuery({
    queryKey: ["plans-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        features: p.features as Plan['features']
      })) as Plan[];
    },
  });

  // Criar plano
  const createPlan = useMutation({
    mutationFn: async (plan: Omit<Plan, 'id'>) => {
      const { data, error } = await supabase
        .from("plans")
        .insert({
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          max_users: plan.max_users,
          max_leads: plan.max_leads,
          max_clients: plan.max_clients,
          max_recurring_clients: plan.max_recurring_clients,
          storage_mb: plan.storage_mb,
          features: plan.features as unknown as Json,
          trial_days: plan.trial_days,
          active: plan.active,
          sort_order: plan.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-admin"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  // Atualizar plano
  const updatePlan = useMutation({
    mutationFn: async ({ id, ...plan }: Partial<Plan> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (plan.name !== undefined) updateData.name = plan.name;
      if (plan.slug !== undefined) updateData.slug = plan.slug;
      if (plan.description !== undefined) updateData.description = plan.description;
      if (plan.price_monthly !== undefined) updateData.price_monthly = plan.price_monthly;
      if (plan.price_yearly !== undefined) updateData.price_yearly = plan.price_yearly;
      if (plan.max_users !== undefined) updateData.max_users = plan.max_users;
      if (plan.max_leads !== undefined) updateData.max_leads = plan.max_leads;
      if (plan.max_clients !== undefined) updateData.max_clients = plan.max_clients;
      if (plan.max_recurring_clients !== undefined) updateData.max_recurring_clients = plan.max_recurring_clients;
      if (plan.storage_mb !== undefined) updateData.storage_mb = plan.storage_mb;
      if (plan.features !== undefined) updateData.features = plan.features as unknown as Json;
      if (plan.trial_days !== undefined) updateData.trial_days = plan.trial_days;
      if (plan.active !== undefined) updateData.active = plan.active;
      if (plan.sort_order !== undefined) updateData.sort_order = plan.sort_order;

      const { data, error } = await supabase
        .from("plans")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-admin"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  // Mudar plano de agência
  const changeAgencyPlan = useMutation({
    mutationFn: async ({ agencyId, planId, status, reason }: { 
      agencyId: string; 
      planId: string; 
      status?: string;
      reason?: string;
    }) => {
      const { error } = await supabase.rpc("change_agency_plan", {
        _agency_id: agencyId,
        _new_plan_id: planId,
        _new_status: status || null,
        _reason: reason || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["agency-features"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-agencies"] });
    },
  });

  return {
    allPlans,
    isLoading,
    createPlan,
    updatePlan,
    changeAgencyPlan,
  };
}
