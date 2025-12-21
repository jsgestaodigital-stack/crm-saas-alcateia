// Constantes compartilhadas entre frontend e backend
// Para manter consistência de regras de negócio

import { Database } from '@/integrations/supabase/types';

// Roles do sistema - derivados do enum do banco
export type AppRole = Database['public']['Enums']['app_role'];

// Labels amigáveis para exibição
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  operador: 'Operador',
  owner: 'Proprietário',
  sales_rep: 'Vendedor',
  super_admin: 'Super Admin',
  support: 'Suporte',
  visualizador: 'Visualizador',
};

// Descrições dos roles
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acesso total ao sistema, pode gerenciar equipe e configurações',
  manager: 'Gerencia equipe e operações',
  operador: 'Pode gerenciar clientes, leads e operações do dia a dia',
  owner: 'Proprietário da agência com acesso total',
  sales_rep: 'Foco em vendas e prospecção',
  super_admin: 'Acesso administrativo global do sistema',
  support: 'Acesso para suporte técnico',
  visualizador: 'Apenas visualização, sem permissão para editar dados',
};

// Roles disponíveis para criação de usuários (subset)
export const ASSIGNABLE_ROLES: AppRole[] = ['admin', 'operador', 'visualizador'];

// Status de leads
export type LeadStatus = Database['public']['Enums']['lead_status'];
export type LeadTemperature = Database['public']['Enums']['lead_temperature'];
export type LeadPipelineStage = Database['public']['Enums']['lead_pipeline_stage'];

// Função helper para validar role
export function isValidRole(role: string): role is AppRole {
  return Object.keys(ROLE_LABELS).includes(role);
}

// Função para validar role atribuível
export function isAssignableRole(role: string): boolean {
  return ASSIGNABLE_ROLES.includes(role as AppRole);
}
