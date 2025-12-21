import { useCallback } from "react";
import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { 
  checkPlanLimit, 
  canAddMore, 
  getRemainingQuota,
  hasFeature,
  getLimitInfo,
  Agency,
  UsageToCheck,
  LimitCheckResult,
  PlanFeatures,
} from "@/lib/checkPlanLimits";
import { toast } from "sonner";

/**
 * Hook para validação de limites do plano integrado ao contexto da agência
 * 
 * @example
 * const { validateLimit, canAdd, showLimitError } = useCheckPlanLimits();
 * 
 * // Antes de criar um cliente:
 * if (!canAdd('max_clients', currentCount)) {
 *   showLimitError('max_clients');
 *   return;
 * }
 */
export function useCheckPlanLimits() {
  const { permissions } = useAuth();
  const { subscription, features } = useSubscription();
  
  const isSuperAdmin = permissions.isSuperAdmin;
  
  // Build agency object from subscription data
  const agency: Agency | null = subscription?.plan ? {
    id: subscription.agency_id,
    name: '',
    plan: {
      name: subscription.plan.name,
      slug: subscription.plan.slug,
      max_users: subscription.plan.max_users,
      max_clients: subscription.plan.max_clients,
      max_leads: subscription.plan.max_leads,
      max_recurring_clients: subscription.plan.max_recurring_clients,
      storage_mb: subscription.plan.storage_mb,
      features: (subscription.plan as any).features || {},
    },
  } : null;
  
  /**
   * Valida se o uso está dentro dos limites
   * SuperAdmin sempre passa
   */
  const validateLimit = useCallback((usage: UsageToCheck): LimitCheckResult => {
    if (isSuperAdmin) return { valid: true };
    return checkPlanLimit(agency, usage);
  }, [agency, isSuperAdmin]);
  
  /**
   * Verifica se pode adicionar mais um recurso
   * SuperAdmin sempre pode
   */
  const canAdd = useCallback((
    limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
    currentCount: number
  ): boolean => {
    if (isSuperAdmin) return true;
    return canAddMore(agency, limitType, currentCount);
  }, [agency, isSuperAdmin]);
  
  /**
   * Retorna quantidade restante
   * SuperAdmin recebe Infinity
   */
  const getRemaining = useCallback((
    limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
    currentCount: number
  ): number => {
    if (isSuperAdmin) return Infinity;
    return getRemainingQuota(agency, limitType, currentCount);
  }, [agency, isSuperAdmin]);
  
  /**
   * Verifica se uma feature está disponível
   * SuperAdmin tem todas
   */
  const checkFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    if (isSuperAdmin) return true;
    return hasFeature(agency, feature);
  }, [agency, isSuperAdmin]);
  
  /**
   * Retorna informações detalhadas do limite
   */
  const getInfo = useCallback((
    limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
    currentCount: number
  ) => {
    if (isSuperAdmin) {
      return {
        max: Infinity,
        current: currentCount,
        remaining: Infinity,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: false,
      };
    }
    return getLimitInfo(agency, limitType, currentCount);
  }, [agency, isSuperAdmin]);
  
  /**
   * Exibe toast de erro com mensagem apropriada
   */
  const showLimitError = useCallback((
    limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients' | 'limite_tarefas_mes'
  ) => {
    const messages: Record<string, string> = {
      max_clients: "Limite de clientes atingido. Faça upgrade do plano.",
      max_users: "Limite de membros da equipe atingido. Faça upgrade do plano.",
      max_leads: "Limite de leads atingido. Faça upgrade do plano.",
      max_recurring_clients: "Limite de clientes recorrentes atingido. Faça upgrade do plano.",
      limite_tarefas_mes: "Limite de tarefas mensais atingido. Faça upgrade do plano.",
    };
    
    toast.error(messages[limitType] || "Limite do plano atingido.", {
      action: {
        label: "Fazer Upgrade",
        onClick: () => window.location.href = "/admin/plan",
      },
    });
  }, []);
  
  /**
   * Valida e exibe erro automaticamente se limite atingido
   * Retorna true se válido, false se inválido (e já mostrou erro)
   */
  const validateAndNotify = useCallback((usage: UsageToCheck): boolean => {
    if (isSuperAdmin) return true;
    
    const result = checkPlanLimit(agency, usage);
    if (!result.valid && result.message) {
      toast.error(result.message, {
        action: {
          label: "Fazer Upgrade",
          onClick: () => window.location.href = "/admin/plan",
        },
      });
    }
    return result.valid;
  }, [agency, isSuperAdmin]);
  
  return {
    agency,
    validateLimit,
    canAdd,
    getRemaining,
    checkFeature,
    getInfo,
    showLimitError,
    validateAndNotify,
    isSuperAdmin,
  };
}
