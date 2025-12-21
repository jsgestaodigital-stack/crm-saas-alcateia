/**
 * Validador central de limites do plano
 * 
 * Use esta função antes de criar novos recursos (clientes, leads, membros, etc.)
 * para garantir que a agência não exceda os limites do seu plano.
 * 
 * IMPORTANTE: Todos os valores vêm diretamente do banco de dados.
 * - Limites numéricos: max_users, max_clients, max_leads, max_recurring_clients, storage_mb
 * - Features (JSONB): funil_tarefas, automacoes, comissoes, etc.
 * - limite_tarefas_mes está dentro do JSONB features
 */

// Limites numéricos (colunas diretas da tabela plans)
export interface PlanLimits {
  max_users: number;
  max_clients: number;
  max_leads: number;
  max_recurring_clients: number;
  storage_mb: number;
}

// Features booleanas e limite_tarefas_mes (JSONB da tabela plans)
export interface PlanFeatures {
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
  limite_tarefas_mes?: number; // Número de tarefas mensais permitidas
}

// Estrutura do plano como vem do banco
export interface AgencyPlan {
  name: string;
  slug: string;
  max_users: number;
  max_clients: number;
  max_leads: number;
  max_recurring_clients: number;
  storage_mb: number;
  features: PlanFeatures;
}

// Agência com plano
export interface Agency {
  id: string;
  name: string;
  plan?: AgencyPlan | null;
}

// Resultado da validação de limite
export interface LimitCheckResult {
  valid: boolean;
  message?: string;
  limitType?: keyof PlanLimits | 'limite_tarefas_mes';
  currentValue?: number;
  maxValue?: number;
}

export interface UsageToCheck {
  max_clients?: number;
  max_users?: number;
  max_leads?: number;
  max_recurring_clients?: number;
  storage_mb?: number;
  limite_tarefas_mes?: number;
}

const limitMessages: Record<keyof UsageToCheck, string> = {
  max_clients: "Limite de clientes ativos atingido. Faça upgrade de plano.",
  max_users: "Limite de membros da equipe atingido. Faça upgrade de plano.",
  max_leads: "Limite de leads atingido. Faça upgrade de plano.",
  max_recurring_clients: "Limite de clientes recorrentes atingido. Faça upgrade de plano.",
  storage_mb: "Limite de armazenamento atingido. Faça upgrade de plano.",
  limite_tarefas_mes: "Você atingiu o limite de tarefas mensais do seu plano.",
};

/**
 * Verifica se o uso está dentro dos limites do plano
 * 
 * @param agency - Objeto da agência com informações do plano
 * @param usage - Valores de uso a serem verificados (geralmente current + 1)
 * @returns Resultado da verificação com valid, message e detalhes
 * 
 * @example
 * // Antes de criar um novo cliente:
 * const { valid, message } = checkPlanLimit(agency, { max_clients: totalClientes + 1 });
 * if (!valid) {
 *   toast.error(message);
 *   return;
 * }
 * 
 * @example
 * // Verificar múltiplos limites de uma vez:
 * const result = checkPlanLimit(agency, { 
 *   max_clients: clientCount + 1,
 *   max_leads: leadCount + 5 
 * });
 */
export function checkPlanLimit(
  agency: Agency | null | undefined,
  usage: UsageToCheck
): LimitCheckResult {
  // Se não há agência ou plano, permitir (fallback seguro)
  if (!agency?.plan) {
    return { valid: true };
  }

  const plan = agency.plan;

  // Verificar limite de clientes
  if (usage.max_clients !== undefined && usage.max_clients > plan.max_clients) {
    return {
      valid: false,
      message: limitMessages.max_clients,
      limitType: 'max_clients',
      currentValue: usage.max_clients,
      maxValue: plan.max_clients,
    };
  }

  // Verificar limite de usuários/membros
  if (usage.max_users !== undefined && usage.max_users > plan.max_users) {
    return {
      valid: false,
      message: limitMessages.max_users,
      limitType: 'max_users',
      currentValue: usage.max_users,
      maxValue: plan.max_users,
    };
  }

  // Verificar limite de leads
  if (usage.max_leads !== undefined && usage.max_leads > plan.max_leads) {
    return {
      valid: false,
      message: limitMessages.max_leads,
      limitType: 'max_leads',
      currentValue: usage.max_leads,
      maxValue: plan.max_leads,
    };
  }

  // Verificar limite de clientes recorrentes
  if (usage.max_recurring_clients !== undefined && usage.max_recurring_clients > plan.max_recurring_clients) {
    return {
      valid: false,
      message: limitMessages.max_recurring_clients,
      limitType: 'max_recurring_clients',
      currentValue: usage.max_recurring_clients,
      maxValue: plan.max_recurring_clients,
    };
  }

  // Verificar limite de storage
  if (usage.storage_mb !== undefined && usage.storage_mb > plan.storage_mb) {
    return {
      valid: false,
      message: limitMessages.storage_mb,
      limitType: 'storage_mb',
      currentValue: usage.storage_mb,
      maxValue: plan.storage_mb,
    };
  }

  // Verificar limite de tarefas mensais
  if (usage.limite_tarefas_mes !== undefined) {
    const maxTarefas = plan.features?.limite_tarefas_mes || 500;
    if (usage.limite_tarefas_mes > maxTarefas) {
      return {
        valid: false,
        message: limitMessages.limite_tarefas_mes,
        limitType: 'limite_tarefas_mes',
        currentValue: usage.limite_tarefas_mes,
        maxValue: maxTarefas,
      };
    }
  }

  return { valid: true };
}

/**
 * Verifica se a agência pode adicionar mais um recurso
 * 
 * @param agency - Objeto da agência
 * @param limitType - Tipo de limite a verificar
 * @param currentCount - Contagem atual
 * @returns true se pode adicionar, false se atingiu o limite
 * 
 * @example
 * if (!canAddMore(agency, 'max_clients', currentClientCount)) {
 *   toast.error("Limite de clientes atingido");
 *   return;
 * }
 */
export function canAddMore(
  agency: Agency | null | undefined,
  limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
  currentCount: number
): boolean {
  const result = checkPlanLimit(agency, { [limitType]: currentCount + 1 });
  return result.valid;
}

/**
 * Retorna a quantidade restante que pode ser adicionada
 * 
 * @example
 * const remaining = getRemainingQuota(agency, 'max_clients', 10);
 * console.log(`Você pode adicionar mais ${remaining} clientes`);
 */
export function getRemainingQuota(
  agency: Agency | null | undefined,
  limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
  currentCount: number
): number {
  if (!agency?.plan) return Infinity;

  const maxValue = agency.plan[limitType] || 0;
  return Math.max(0, maxValue - currentCount);
}

/**
 * Verifica se uma feature específica está disponível no plano
 * 
 * @example
 * if (!hasFeature(agency, 'automacoes')) {
 *   toast.error("Automações disponíveis apenas no plano Pro");
 *   return;
 * }
 */
export function hasFeature(
  agency: Agency | null | undefined,
  feature: keyof PlanFeatures
): boolean {
  if (!agency?.plan?.features) return false;
  return agency.plan.features[feature] === true;
}

/**
 * Retorna informações detalhadas sobre um limite específico
 * 
 * @example
 * const info = getLimitInfo(agency, 'max_clients', 12);
 * // { max: 15, current: 12, remaining: 3, percentage: 80, isNearLimit: true }
 */
export function getLimitInfo(
  agency: Agency | null | undefined,
  limitType: 'max_clients' | 'max_users' | 'max_leads' | 'max_recurring_clients',
  currentCount: number
): {
  max: number;
  current: number;
  remaining: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
} {
  const max = agency?.plan?.[limitType] || 0;
  const remaining = Math.max(0, max - currentCount);
  const percentage = max > 0 ? Math.min(100, (currentCount / max) * 100) : 0;

  return {
    max,
    current: currentCount,
    remaining,
    percentage,
    isNearLimit: percentage >= 80,
    isAtLimit: percentage >= 100,
  };
}
