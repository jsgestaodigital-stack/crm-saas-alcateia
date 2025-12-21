import { useSubscription, AgencyFeatures, PlanFeaturesDB } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { PlanFeatures as CheckPlanFeatures, PlanLimits as CheckPlanLimits } from "@/lib/checkPlanLimits";

// Re-export types para uso externo
export type { CheckPlanFeatures as PlanFeaturesDB, CheckPlanLimits };

// Limites do plano (valores numéricos)
export interface PlanLimits {
  maxUsers: number;
  maxClients: number;
  maxLeads: number;
  maxRecurringClients: number;
  storageMb: number;
  limiteTarefasMes: number;
}

// Feature flags tipadas (camelCase para uso em componentes)
export interface PlanFeatureFlags {
  funilTarefas: boolean;
  funilAvancado: boolean;
  automacoes: boolean;
  relatoriosAgencia: boolean;
  relatoriosCliente: boolean;
  dashboardPrincipal: boolean;
  dashboardFinanceiro: boolean;
  cobrancaStripe: boolean;
  comissoes: boolean;
  logsAuditoria: boolean;
  exportacao: boolean;
  integracaoAlfaleads: boolean;
  suporteEmail: boolean;
  suportePrioritario: boolean;
  suporteWhatsapp: boolean;
  acessoAntecipado: boolean;
}

export interface UsePlanFeaturesReturn {
  // Plan info
  planName: string | null;
  planSlug: string | null;
  isLoading: boolean;
  
  // Feature checks (aceita tanto camelCase quanto snake_case)
  hasFeature: (feature: keyof PlanFeatureFlags | string) => boolean;
  hasAllFeatures: (features: (keyof PlanFeatureFlags | string)[]) => boolean;
  hasAnyFeature: (features: (keyof PlanFeatureFlags | string)[]) => boolean;
  
  // Limit checks
  limits: PlanLimits;
  isWithinLimit: (type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks', currentCount: number) => boolean;
  getRemainingQuota: (type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks', currentCount: number) => number;
  
  // Feature flags (typed camelCase)
  features: PlanFeatureFlags;
  
  // Raw DB features (snake_case)
  rawDbFeatures: PlanFeaturesDB;
  
  // Plan tier helpers
  isStarter: boolean;
  isPro: boolean;
  isMaster: boolean;
  isProOrHigher: boolean;
  isMasterOnly: boolean;
  
  // Subscription status
  isActive: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number | null;
  
  // Raw data
  rawFeatures: AgencyFeatures | null;
}

// Map from DB feature keys to typed keys
const featureKeyMap: Record<string, keyof PlanFeatureFlags> = {
  funil_tarefas: 'funilTarefas',
  funil_avancado: 'funilAvancado',
  automacoes: 'automacoes',
  relatorios_agencia: 'relatoriosAgencia',
  relatorios_cliente: 'relatoriosCliente',
  dashboard_principal: 'dashboardPrincipal',
  dashboard_financeiro: 'dashboardFinanceiro',
  cobranca_stripe: 'cobrancaStripe',
  comissoes: 'comissoes',
  logs_auditoria: 'logsAuditoria',
  exportacao: 'exportacao',
  integracao_alfaleads: 'integracaoAlfaleads',
  suporte_email: 'suporteEmail',
  suporte_prioritario: 'suportePrioritario',
  suporte_whatsapp: 'suporteWhatsapp',
  acesso_antecipado: 'acessoAntecipado',
};

// Reverse map for lookups
const reverseFeatureKeyMap: Record<string, string> = Object.entries(featureKeyMap)
  .reduce((acc, [dbKey, tsKey]) => ({ ...acc, [tsKey]: dbKey }), {});

export function usePlanFeatures(): UsePlanFeaturesReturn {
  const { permissions } = useAuth();
  const { subscription, features, isLoading, isActive, isInTrial, getTrialDaysRemaining } = useSubscription();
  
  const isSuperAdmin = permissions.isSuperAdmin;
  
  // Extract plan info
  const planName = subscription?.plan?.name || features?.plan_name || null;
  const planSlug = subscription?.plan?.slug || null;
  
  // Get raw features from DB
  const rawDbFeatures = (subscription?.plan as any)?.features || features?.features || {};
  
  // Parse limits
  const limits: PlanLimits = {
    maxUsers: features?.limits?.max_users || subscription?.plan?.max_users || 2,
    maxClients: features?.limits?.max_clients || subscription?.plan?.max_clients || 15,
    maxLeads: features?.limits?.max_leads || subscription?.plan?.max_leads || 100,
    maxRecurringClients: features?.limits?.max_recurring_clients || subscription?.plan?.max_recurring_clients || 0,
    storageMb: features?.limits?.storage_mb || subscription?.plan?.storage_mb || 500,
    limiteTarefasMes: rawDbFeatures?.limite_tarefas_mes || 500,
  };
  
  // Build typed feature flags
  const typedFeatures: PlanFeatureFlags = {
    funilTarefas: rawDbFeatures?.funil_tarefas ?? false,
    funilAvancado: rawDbFeatures?.funil_avancado ?? false,
    automacoes: rawDbFeatures?.automacoes ?? false,
    relatoriosAgencia: rawDbFeatures?.relatorios_agencia ?? false,
    relatoriosCliente: rawDbFeatures?.relatorios_cliente ?? false,
    dashboardPrincipal: rawDbFeatures?.dashboard_principal ?? false,
    dashboardFinanceiro: rawDbFeatures?.dashboard_financeiro ?? false,
    cobrancaStripe: rawDbFeatures?.cobranca_stripe ?? false,
    comissoes: rawDbFeatures?.comissoes ?? false,
    logsAuditoria: rawDbFeatures?.logs_auditoria ?? false,
    exportacao: rawDbFeatures?.exportacao ?? false,
    integracaoAlfaleads: rawDbFeatures?.integracao_alfaleads ?? false,
    suporteEmail: rawDbFeatures?.suporte_email ?? false,
    suportePrioritario: rawDbFeatures?.suporte_prioritario ?? false,
    suporteWhatsapp: rawDbFeatures?.suporte_whatsapp ?? false,
    acessoAntecipado: rawDbFeatures?.acesso_antecipado ?? false,
  };
  
  // Feature check function
  const hasFeature = (feature: keyof PlanFeatureFlags | string): boolean => {
    // SuperAdmin has all features
    if (isSuperAdmin) return true;
    
    // Check typed feature
    if (feature in typedFeatures) {
      return typedFeatures[feature as keyof PlanFeatureFlags];
    }
    
    // Check DB key directly
    const dbKey = reverseFeatureKeyMap[feature] || feature;
    return rawDbFeatures?.[dbKey] === true;
  };
  
  const hasAllFeatures = (featureList: (keyof PlanFeatureFlags | string)[]): boolean => {
    if (isSuperAdmin) return true;
    return featureList.every(f => hasFeature(f));
  };
  
  const hasAnyFeature = (featureList: (keyof PlanFeatureFlags | string)[]): boolean => {
    if (isSuperAdmin) return true;
    return featureList.some(f => hasFeature(f));
  };
  
  // Limit check functions
  const isWithinLimit = (type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks', currentCount: number): boolean => {
    if (isSuperAdmin) return true;
    
    switch (type) {
      case 'users':
        return currentCount < limits.maxUsers;
      case 'clients':
        return currentCount < limits.maxClients;
      case 'leads':
        return currentCount < limits.maxLeads;
      case 'recurring':
        return currentCount < limits.maxRecurringClients;
      case 'tasks':
        return currentCount < limits.limiteTarefasMes;
      default:
        return true;
    }
  };
  
  const getRemainingQuota = (type: 'users' | 'clients' | 'leads' | 'recurring' | 'tasks', currentCount: number): number => {
    if (isSuperAdmin) return Infinity;
    
    switch (type) {
      case 'users':
        return Math.max(0, limits.maxUsers - currentCount);
      case 'clients':
        return Math.max(0, limits.maxClients - currentCount);
      case 'leads':
        return Math.max(0, limits.maxLeads - currentCount);
      case 'recurring':
        return Math.max(0, limits.maxRecurringClients - currentCount);
      case 'tasks':
        return Math.max(0, limits.limiteTarefasMes - currentCount);
      default:
        return Infinity;
    }
  };
  
  // Plan tier helpers
  const normalizedPlanSlug = planSlug?.toLowerCase() || planName?.toLowerCase() || '';
  const isStarter = normalizedPlanSlug === 'starter';
  const isPro = normalizedPlanSlug === 'pro';
  const isMaster = normalizedPlanSlug === 'master';
  const isProOrHigher = isPro || isMaster || isSuperAdmin;
  const isMasterOnly = isMaster || isSuperAdmin;
  
  return {
    planName,
    planSlug,
    isLoading,
    hasFeature,
    hasAllFeatures,
    hasAnyFeature,
    limits,
    isWithinLimit,
    getRemainingQuota,
    features: typedFeatures,
    rawDbFeatures: rawDbFeatures as PlanFeaturesDB,
    isStarter,
    isPro,
    isMaster,
    isProOrHigher,
    isMasterOnly,
    isActive,
    isInTrial,
    trialDaysRemaining: getTrialDaysRemaining(),
    rawFeatures: features,
  };
}
