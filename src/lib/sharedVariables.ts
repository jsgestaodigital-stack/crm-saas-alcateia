/**
 * Sistema de variáveis compartilhadas entre Propostas e Contratos
 * Garante consistência e reduz redundância
 */

export interface SharedVariable {
  key: string;
  label: string;
  placeholder: string;
  category: 'client' | 'service' | 'payment' | 'dates' | 'company';
}

// Variáveis compartilhadas entre propostas e contratos
export const SHARED_VARIABLES: SharedVariable[] = [
  // Dados do Cliente
  { key: 'nome_empresa', label: 'Nome da Empresa', placeholder: 'Ex: Clínica Exemplo', category: 'client' },
  { key: 'nome_cliente', label: 'Nome do Cliente', placeholder: 'Ex: João Silva', category: 'client' },
  { key: 'cnpj', label: 'CNPJ', placeholder: 'Ex: 00.000.000/0001-00', category: 'client' },
  { key: 'cpf', label: 'CPF', placeholder: 'Ex: 000.000.000-00', category: 'client' },
  { key: 'email', label: 'Email', placeholder: 'Ex: cliente@email.com', category: 'client' },
  { key: 'telefone', label: 'Telefone', placeholder: 'Ex: (11) 99999-9999', category: 'client' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'Ex: (11) 99999-9999', category: 'client' },
  { key: 'endereco', label: 'Endereço Completo', placeholder: 'Ex: Rua Exemplo, 123 - Centro', category: 'client' },
  { key: 'cidade', label: 'Cidade', placeholder: 'Ex: São Paulo', category: 'client' },
  { key: 'estado', label: 'Estado', placeholder: 'Ex: SP', category: 'client' },
  { key: 'cep', label: 'CEP', placeholder: 'Ex: 00000-000', category: 'client' },
  { key: 'responsavel', label: 'Responsável Legal', placeholder: 'Ex: João Silva', category: 'client' },
  
  // Dados do Serviço
  { key: 'palavras_chave', label: 'Palavras-Chave', placeholder: 'Ex: dentista, clínica odontológica', category: 'service' },
  { key: 'segmento', label: 'Segmento de Atuação', placeholder: 'Ex: Saúde', category: 'service' },
  { key: 'servicos_contratados', label: 'Serviços Contratados', placeholder: 'Ex: Otimização GMB + SEO Local', category: 'service' },
  { key: 'escopo_detalhado', label: 'Escopo Detalhado', placeholder: 'Descrição completa do escopo', category: 'service' },
  { key: 'link_google', label: 'Link do Google Meu Negócio', placeholder: 'https://g.co/...', category: 'service' },
  
  // Dados Financeiros
  { key: 'valor_total', label: 'Valor Total', placeholder: 'Ex: R$ 5.000,00', category: 'payment' },
  { key: 'valor_mensal', label: 'Valor Mensal', placeholder: 'Ex: R$ 500,00', category: 'payment' },
  { key: 'parcelas', label: 'Número de Parcelas', placeholder: 'Ex: 12', category: 'payment' },
  { key: 'valor_parcela', label: 'Valor da Parcela', placeholder: 'Ex: R$ 416,67', category: 'payment' },
  { key: 'forma_pagamento', label: 'Forma de Pagamento', placeholder: 'Ex: Cartão de Crédito', category: 'payment' },
  { key: 'desconto', label: 'Desconto Aplicado', placeholder: 'Ex: 10%', category: 'payment' },
  { key: 'motivo_desconto', label: 'Motivo do Desconto', placeholder: 'Ex: Pagamento à vista', category: 'payment' },
  
  // Datas
  { key: 'data_hoje', label: 'Data de Hoje', placeholder: 'Automático', category: 'dates' },
  { key: 'data_inicio', label: 'Data de Início', placeholder: 'Ex: 01/01/2025', category: 'dates' },
  { key: 'data_fim', label: 'Data de Término', placeholder: 'Ex: 31/12/2025', category: 'dates' },
  { key: 'prazo_execucao', label: 'Prazo de Execução', placeholder: 'Ex: 60 dias', category: 'dates' },
  { key: 'validade_proposta', label: 'Validade da Proposta', placeholder: 'Ex: 7 dias', category: 'dates' },
  
  // Dados da Empresa (Contratada)
  { key: 'contratada_nome', label: 'Nome da Contratada', placeholder: 'Ex: Alcateia Marketing', category: 'company' },
  { key: 'contratada_cnpj', label: 'CNPJ da Contratada', placeholder: 'Ex: 00.000.000/0001-00', category: 'company' },
  { key: 'contratada_endereco', label: 'Endereço da Contratada', placeholder: 'Rua da Empresa, 456', category: 'company' },
  { key: 'contratada_email', label: 'Email da Contratada', placeholder: 'contato@empresa.com', category: 'company' },
  { key: 'contratada_telefone', label: 'Telefone da Contratada', placeholder: '(11) 3333-3333', category: 'company' },
  { key: 'contratada_responsavel', label: 'Responsável da Contratada', placeholder: 'Nome do responsável', category: 'company' },
];

// Categorias para exibição
export const VARIABLE_CATEGORIES = {
  client: { label: 'Dados do Cliente', icon: 'User' },
  service: { label: 'Dados do Serviço', icon: 'Briefcase' },
  payment: { label: 'Dados Financeiros', icon: 'DollarSign' },
  dates: { label: 'Datas', icon: 'Calendar' },
  company: { label: 'Dados da Contratada', icon: 'Building' },
} as const;

/**
 * Substitui variáveis no texto usando o formato {{variavel}}
 */
export function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  
  // First, replace defined variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || `{{${key}}}`);
  });
  
  // Replace data_hoje with current date if not set
  if (!variables['data_hoje']) {
    const today = new Date().toLocaleDateString('pt-BR');
    result = result.replace(/{{[\s]*data_hoje[\s]*}}/gi, today);
  }
  
  return result;
}

/**
 * Extrai todas as variáveis usadas em um texto
 */
export function extractVariables(content: string): string[] {
  const regex = /{{[\s]*([a-zA-Z_]+)[\s]*}}/g;
  const matches = content.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1].toLowerCase());
  }
  
  return Array.from(variables);
}

/**
 * Valida se todas as variáveis obrigatórias foram preenchidas
 */
export function validateRequiredVariables(
  content: string, 
  variables: Record<string, string>,
  requiredKeys: string[] = []
): { valid: boolean; missing: string[] } {
  const usedVariables = extractVariables(content);
  const missing: string[] = [];
  
  for (const key of requiredKeys) {
    if (usedVariables.includes(key) && !variables[key]?.trim()) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gera variáveis iniciais a partir de dados de Lead/Proposta
 */
export function generateVariablesFromData(data: {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  whatsapp?: string;
  estimatedValue?: number;
  mainCategory?: string;
}): Record<string, string> {
  const variables: Record<string, string> = {};
  
  if (data.companyName) variables['nome_empresa'] = data.companyName;
  if (data.contactName) variables['nome_cliente'] = data.contactName;
  if (data.email) variables['email'] = data.email;
  if (data.phone) variables['telefone'] = data.phone;
  if (data.city) variables['cidade'] = data.city;
  if (data.whatsapp) variables['whatsapp'] = data.whatsapp;
  if (data.mainCategory) variables['segmento'] = data.mainCategory;
  if (data.estimatedValue) {
    variables['valor_total'] = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.estimatedValue);
  }
  
  // Add current date
  variables['data_hoje'] = new Date().toLocaleDateString('pt-BR');
  
  return variables;
}

/**
 * Mescla variáveis de uma proposta com dados adicionais para um contrato
 */
export function mergeProposalToContractVariables(
  proposalVariables: Record<string, string>,
  proposalData: {
    fullPrice?: number | null;
    discountedPrice?: number | null;
    installments?: number | null;
    installmentValue?: number | null;
    paymentMethod?: string | null;
    discountReason?: string | null;
    clientName?: string;
    companyName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    city?: string | null;
  }
): Record<string, string> {
  const variables = { ...proposalVariables };
  
  // Override with proposal specific data
  if (proposalData.clientName) variables['nome_cliente'] = proposalData.clientName;
  if (proposalData.companyName) variables['nome_empresa'] = proposalData.companyName;
  if (proposalData.contactEmail) variables['email'] = proposalData.contactEmail;
  if (proposalData.contactPhone) variables['telefone'] = proposalData.contactPhone;
  if (proposalData.city) variables['cidade'] = proposalData.city;
  
  // Financial data
  if (proposalData.fullPrice) {
    variables['valor_total'] = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(proposalData.discountedPrice || proposalData.fullPrice);
  }
  if (proposalData.installments) {
    variables['parcelas'] = proposalData.installments.toString();
  }
  if (proposalData.installmentValue) {
    variables['valor_parcela'] = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(proposalData.installmentValue);
  }
  if (proposalData.paymentMethod) {
    variables['forma_pagamento'] = proposalData.paymentMethod;
  }
  if (proposalData.discountReason) {
    variables['motivo_desconto'] = proposalData.discountReason;
  }
  
  // Reset date
  variables['data_hoje'] = new Date().toLocaleDateString('pt-BR');
  
  return variables;
}
