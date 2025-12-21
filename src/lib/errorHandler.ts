// Sistema de tratamento de erros diferenciado
// Classifica erros por tipo e retorna mensagens apropriadas para o usuário

export enum ErrorType {
  Network = 'NETWORK',
  Permission = 'PERMISSION',
  NotFound = 'NOT_FOUND',
  Validation = 'VALIDATION',
  RateLimit = 'RATE_LIMIT',
  Authentication = 'AUTHENTICATION',
  Server = 'SERVER',
  Unknown = 'UNKNOWN',
}

export interface ClassifiedError {
  type: ErrorType;
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
  statusCode?: number;
}

/**
 * Classifica um erro e retorna informações estruturadas
 */
export function classifyError(error: unknown): ClassifiedError {
  // Erro de rede (offline, timeout)
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return {
      type: ErrorType.Network,
      userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      technicalMessage: 'Network request failed',
      retryable: true,
    };
  }

  // Erro do Supabase ou resposta HTTP
  if (isSupabaseError(error)) {
    const supaError = error as SupabaseError;
    const code = supaError.code || supaError.status;
    const message = supaError.message || supaError.error_description || '';

    // Rate limit
    if (code === 429 || message.includes('rate limit') || message.includes('too many')) {
      return {
        type: ErrorType.RateLimit,
        userMessage: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
        technicalMessage: message,
        retryable: true,
        statusCode: 429,
      };
    }

    // Autenticação
    if (code === 401 || message.includes('JWT') || message.includes('token')) {
      return {
        type: ErrorType.Authentication,
        userMessage: 'Sessão expirada. Faça login novamente.',
        technicalMessage: message,
        retryable: false,
        statusCode: 401,
      };
    }

    // Permissão (RLS)
    if (code === 403 || code === '42501' || message.includes('permission denied') || 
        message.includes('policy') || message.includes('RLS')) {
      return {
        type: ErrorType.Permission,
        userMessage: 'Você não tem permissão para realizar esta ação.',
        technicalMessage: message,
        retryable: false,
        statusCode: 403,
      };
    }

    // Não encontrado
    if (code === 404 || message.includes('not found')) {
      return {
        type: ErrorType.NotFound,
        userMessage: 'Recurso não encontrado.',
        technicalMessage: message,
        retryable: false,
        statusCode: 404,
      };
    }

    // Validação (constraint violation)
    if (code === 400 || code === '23505' || code === '23503' || 
        message.includes('duplicate') || message.includes('constraint') ||
        message.includes('invalid')) {
      return {
        type: ErrorType.Validation,
        userMessage: 'Dados inválidos. Verifique as informações e tente novamente.',
        technicalMessage: message,
        retryable: false,
        statusCode: 400,
      };
    }

    // Erro de servidor
    if (code === 500 || code === 502 || code === 503) {
      return {
        type: ErrorType.Server,
        userMessage: 'Erro no servidor. Nossa equipe foi notificada. Tente novamente em alguns minutos.',
        technicalMessage: message,
        retryable: true,
        statusCode: typeof code === 'number' ? code : 500,
      };
    }
  }

  // Erro genérico com mensagem
  if (error instanceof Error) {
    // Verifica padrões comuns
    if (error.message.includes('network') || error.message.includes('offline')) {
      return {
        type: ErrorType.Network,
        userMessage: 'Erro de conexão. Verifique sua internet.',
        technicalMessage: error.message,
        retryable: true,
      };
    }

    return {
      type: ErrorType.Unknown,
      userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
      technicalMessage: error.message,
      retryable: true,
    };
  }

  // Fallback para erro desconhecido
  return {
    type: ErrorType.Unknown,
    userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
    technicalMessage: String(error),
    retryable: true,
  };
}

// Tipo para erros do Supabase
interface SupabaseError {
  code?: string | number;
  status?: number;
  message?: string;
  error_description?: string;
  details?: string;
  hint?: string;
}

function isSupabaseError(error: unknown): error is SupabaseError {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error || 'message' in error || 'status' in error;
}

/**
 * Formata erro para contexto específico (mais amigável)
 */
export function formatErrorForContext(
  error: unknown, 
  context: 'leads' | 'clients' | 'auth' | 'general' = 'general'
): string {
  const classified = classifyError(error);
  
  // Mensagens específicas por contexto
  const contextMessages: Record<typeof context, Partial<Record<ErrorType, string>>> = {
    leads: {
      [ErrorType.Permission]: 'Você não tem permissão para acessar estes leads.',
      [ErrorType.NotFound]: 'Lead não encontrado ou foi removido.',
    },
    clients: {
      [ErrorType.Permission]: 'Você não tem permissão para acessar estes clientes.',
      [ErrorType.NotFound]: 'Cliente não encontrado ou foi removido.',
    },
    auth: {
      [ErrorType.Authentication]: 'Credenciais inválidas ou sessão expirada.',
      [ErrorType.RateLimit]: 'Muitas tentativas de login. Aguarde antes de tentar novamente.',
    },
    general: {},
  };

  return contextMessages[context][classified.type] || classified.userMessage;
}

/**
 * Log de erro para debugging (não expõe ao usuário)
 */
export function logError(error: unknown, context?: string): void {
  const classified = classifyError(error);
  
  // Em desenvolvimento, log completo
  if (import.meta.env.DEV) {
    console.error(`[${classified.type}]${context ? ` [${context}]` : ''}:`, {
      userMessage: classified.userMessage,
      technicalMessage: classified.technicalMessage,
      statusCode: classified.statusCode,
      retryable: classified.retryable,
      originalError: error,
    });
  } else {
    // Em produção, log mínimo (para Sentry/LogRocket quando integrado)
    console.error(`[${classified.type}]${context ? ` [${context}]` : ''}: ${classified.technicalMessage}`);
  }
}
