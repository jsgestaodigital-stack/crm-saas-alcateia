// Contract clause types
export type ContractClauseType = 
  | 'parties'           // Partes (Contratada/Contratante)
  | 'lgpd'              // Proteção de dados
  | 'object'            // Objeto do contrato
  | 'scope'             // Escopo do projeto
  | 'execution_term'    // Prazo de execução
  | 'investment'        // Valor e forma de pagamento
  | 'obligations_contractor' // Responsabilidades da contratada
  | 'obligations_contracted' // Responsabilidades do contratante
  | 'liability_limits'  // Limites de responsabilidade
  | 'rescission'        // Rescisão
  | 'confidentiality'   // Confidencialidade
  | 'intellectual_property' // Propriedade intelectual
  | 'forum'             // Foro
  | 'signatures'        // Assinaturas
  | 'recurring_terms'   // Termos de recorrência
  | 'custom';           // Cláusula personalizada

export interface ContractClause {
  id: string;
  type: ContractClauseType;
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  isHidden: boolean;
  isEditable: boolean;
}

export type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'cancelled';
export type ContractType = 'single_optimization' | 'recurring' | 'custom';

export interface Contract {
  id: string;
  agency_id: string;
  proposal_id?: string;
  client_id?: string;
  lead_id?: string;
  
  // Metadata
  title: string;
  contract_type: ContractType;
  status: ContractStatus;
  
  // Party information - Contractor (Contratada - Agency)
  contractor_name?: string;
  contractor_cnpj?: string;
  contractor_cpf?: string;
  contractor_address?: string;
  contractor_email?: string;
  contractor_phone?: string;
  contractor_responsible?: string;
  
  // Party information - Contracted (Contratante - Client)
  contracted_name?: string;
  contracted_cnpj?: string;
  contracted_cpf?: string;
  contracted_address?: string;
  contracted_email?: string;
  contracted_phone?: string;
  contracted_responsible?: string;
  
  // Content
  clauses: ContractClause[];
  variables?: Record<string, string>;
  
  // Pricing
  full_price?: number;
  discounted_price?: number;
  installments?: number;
  installment_value?: number;
  payment_method?: string;
  
  // Execution
  execution_term_days?: number;
  start_date?: string;
  end_date?: string;
  
  // Recurring
  is_recurring?: boolean;
  billing_cycle?: string;
  auto_renewal?: boolean;
  
  // Tracking
  public_token?: string;
  public_url?: string;
  sent_at?: string;
  first_viewed_at?: string;
  last_viewed_at?: string;
  signed_at?: string;
  view_count?: number;
  
  // Signature
  client_signature_name?: string;
  client_signature_cpf?: string;
  client_signed_at?: string;
  client_ip_address?: string;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  contract_type: ContractType;
  clauses: ContractClause[];
  variables?: Record<string, string>;
  is_default?: boolean;
  is_system?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Contract variables for substitution
export const CONTRACT_VARIABLES = [
  { key: '{{nome_empresa}}', label: 'Nome da Empresa', source: 'contracted_name' },
  { key: '{{cnpj}}', label: 'CNPJ', source: 'contracted_cnpj' },
  { key: '{{cpf}}', label: 'CPF do Responsável', source: 'contracted_cpf' },
  { key: '{{email}}', label: 'E-mail', source: 'contracted_email' },
  { key: '{{endereco}}', label: 'Endereço', source: 'contracted_address' },
  { key: '{{responsavel}}', label: 'Nome do Responsável', source: 'contracted_responsible' },
  { key: '{{telefone}}', label: 'Telefone', source: 'contracted_phone' },
  { key: '{{data}}', label: 'Data Atual', source: 'current_date' },
  { key: '{{valor}}', label: 'Valor do Projeto', source: 'full_price' },
  { key: '{{valor_desconto}}', label: 'Valor com Desconto', source: 'discounted_price' },
  { key: '{{parcelas}}', label: 'Número de Parcelas', source: 'installments' },
  { key: '{{valor_parcela}}', label: 'Valor da Parcela', source: 'installment_value' },
  { key: '{{prazo_execucao}}', label: 'Prazo de Execução (dias)', source: 'execution_term_days' },
  { key: '{{cidade}}', label: 'Cidade', source: 'city' },
  { key: '{{agencia_nome}}', label: 'Nome da Agência', source: 'contractor_name' },
  { key: '{{agencia_cnpj}}', label: 'CNPJ da Agência', source: 'contractor_cnpj' },
  { key: '{{agencia_endereco}}', label: 'Endereço da Agência', source: 'contractor_address' },
  { key: '{{agencia_responsavel}}', label: 'Responsável da Agência', source: 'contractor_responsible' },
];

// Default clauses for single optimization contract
export const DEFAULT_SINGLE_OPTIMIZATION_CLAUSES: ContractClause[] = [
  {
    id: 'parties',
    type: 'parties',
    title: 'IDENTIFICAÇÃO DAS PARTES',
    content: `**CONTRATADA:**
{{agencia_nome}}
CNPJ: {{agencia_cnpj}}
Endereço: {{agencia_endereco}}
Responsável: {{agencia_responsavel}}

**CONTRATANTE:**
{{nome_empresa}}
CNPJ: {{cnpj}}
CPF do Responsável: {{cpf}}
Endereço: {{endereco}}
E-mail: {{email}}
Telefone: {{telefone}}`,
    order: 1,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'lgpd',
    type: 'lgpd',
    title: 'PROTEÇÃO DE DADOS PESSOAIS (LGPD)',
    content: `Ambas as partes declaram estar cientes e em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Comprometem-se a:

• Utilizar os dados apenas para fins deste contrato;
• Não compartilhar informações com terceiros sem autorização;
• Garantir a segurança e sigilo das informações trocadas;
• Eliminar os dados após o cumprimento das finalidades;
• Tratar dados com base no consentimento e boa-fé.`,
    order: 2,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'object',
    type: 'object',
    title: 'OBJETO DO CONTRATO',
    content: `Este contrato tem como objetivo a prestação de serviço de otimização única do perfil empresarial da CONTRATANTE no Google (Google Meu Negócio), visando maior visibilidade e ranqueamento nas buscas locais, com prazo total de execução de até {{prazo_execucao}} dias corridos após a sessão de fotos.`,
    order: 3,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'scope',
    type: 'scope',
    title: 'ESCOPO DO PROJETO',
    content: `Durante o prazo estabelecido neste contrato, a CONTRATADA realizará um trabalho completo de otimização estratégica do Perfil do Google, com foco total em aumentar a visibilidade da empresa, melhorar sua reputação online, atrair novos clientes e transformar o Google em um dos principais canais de vendas da marca.

As entregas incluem:
• Análise inicial do perfil atual da empresa, diagnóstico de performance e presença no Google;
• Atualização completa de todas as informações comerciais da empresa;
• Ativação e integração do chat do WhatsApp e do Google;
• Ajuste da localização no Google Maps, Waze, Apple Maps e WhatsApp Maps;
• Criação de catálogo profissional de serviços e produtos;
• Criação de postagens com textos otimizados e imagens atrativas;
• Sessão de fotos profissionais da empresa e da equipe;
• Criação de fotos 360° e Tour Virtual no Google Maps;
• Inserção de coordenadas geográficas e palavras-chave nas imagens;
• Pesquisa estratégica de palavras-chave locais;
• Cadastro em diretórios e guias locais (NAPW);
• Otimizações SEO on-page e off-page;
• Resposta otimizada às avaliações recebidas;
• Criação de link de WhatsApp personalizado e QR Code;
• Relatório final de entrega com comparativos.`,
    order: 4,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'execution_term',
    type: 'execution_term',
    title: 'PRAZO DE EXECUÇÃO',
    content: `O prazo máximo para a entrega de todas as etapas é de {{prazo_execucao}} dias corridos após a sessão de fotos.
A CONTRATADA compromete-se a entregar o serviço com agilidade, respeitando a ordem de atendimento da fila de clientes ativos.`,
    order: 5,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'investment',
    type: 'investment',
    title: 'INVESTIMENTO E FORMA DE PAGAMENTO',
    content: `Valor do Projeto: R$ {{valor}}
Condições: À vista ou em até {{parcelas}}x de R$ {{valor_parcela}}.

O início do projeto e a criação do grupo de WhatsApp estão condicionados à confirmação do pagamento.`,
    order: 6,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'obligations_contractor',
    type: 'obligations_contractor',
    title: 'RESPONSABILIDADES DA CONTRATADA',
    content: `A CONTRATADA compromete-se a:
• Executar os serviços conforme descrito com qualidade e transparência;
• Manter a CONTRATANTE atualizada por meio de grupo exclusivo de WhatsApp;
• Manter sigilo e confidencialidade sobre todas as informações recebidas.`,
    order: 7,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'obligations_contracted',
    type: 'obligations_contracted',
    title: 'RESPONSABILIDADES DA CONTRATANTE',
    content: `A CONTRATANTE compromete-se a:
• Realizar os pagamentos acordados nos prazos;
• Fornecer informações e acessos em até 72 horas após assinatura;
• Participar das etapas solicitadas (como sessão de fotos).`,
    order: 8,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'liability_limits',
    type: 'liability_limits',
    title: 'LIMITES DE RESPONSABILIDADE',
    content: `A CONTRATADA se compromete a monitorar e acompanhar todas as etapas de otimização do Perfil no Google.
No entanto, eventuais atrasos, suspensões ou bugs causados pela própria plataforma do Google não são de responsabilidade da CONTRATADA e não isentam o cumprimento dos pagamentos contratados.`,
    order: 9,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'rescission',
    type: 'rescission',
    title: 'RESCISÃO DO CONTRATO',
    content: `Após o início do projeto (entendido como qualquer ação operacional: envio de briefing, agendamento de fotos, etc.), não será possível solicitar reembolso dos valores pagos.`,
    order: 10,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'forum',
    type: 'forum',
    title: 'FORO E VALIDADE',
    content: `Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito o foro da comarca de {{cidade}}, com renúncia de qualquer outro, por mais privilegiado que seja.
Este contrato tem validade jurídica plena, assinado digitalmente pelas partes.

{{cidade}}, {{data}}`,
    order: 11,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'signatures',
    type: 'signatures',
    title: 'ASSINATURAS',
    content: `**CONTRATANTE:**
Nome: {{responsavel}}
CPF: {{cpf}}
Empresa: {{nome_empresa}}
CNPJ: {{cnpj}}
Assinatura: ___________________________

**CONTRATADA:**
Nome: {{agencia_responsavel}}
Empresa: {{agencia_nome}}
CNPJ: {{agencia_cnpj}}
Assinatura: ___________________________`,
    order: 12,
    isRequired: true,
    isHidden: false,
    isEditable: true
  }
];

// Default clauses for recurring contract
export const DEFAULT_RECURRING_CLAUSES: ContractClause[] = [
  ...DEFAULT_SINGLE_OPTIMIZATION_CLAUSES.slice(0, 3),
  {
    id: 'scope_recurring',
    type: 'scope',
    title: 'ESCOPO DOS SERVIÇOS MENSAIS',
    content: `Este contrato tem como objeto a prestação mensal e contínua de serviços de marketing digital, incluindo:

**Gestão e Otimização do Perfil Empresarial no Google:**
• Criação, ativação e verificação do perfil (se necessário);
• Correção dos pontos críticos para melhor ranqueamento;
• Atualização de informações comerciais e estratégicas;
• Cadastro em Google Maps, Waze, Apple Maps e WhatsApp Maps;
• Ativação do chat do Google;
• Estudo de palavras-chave e concorrência local;
• Estratégia de SEO para as principais palavras-chave;
• Otimização on-page e off-page;
• Cadastro em diretórios locais (NAPW);
• Criação de catálogos com descrição e link para WhatsApp;
• Criação de postagens otimizadas no Google;
• Sessão de fotos profissionais;
• Inserção de palavras-chave e coordenadas nas fotos;
• Sessão de fotos 360º com tratamento;
• Criação de Tour Virtual no Google Maps;
• Estratégia de captação de avaliações;
• Respostas individualizadas a avaliações recebidas;
• Relatório mensal com desempenho, insights e sugestões.`,
    order: 4,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'recurring_terms',
    type: 'recurring_terms',
    title: 'PRAZO E VIGÊNCIA',
    content: `Este contrato tem vigência de 6 (seis) meses, contados a partir da data da assinatura.

Após esse período, o contrato poderá ser renovado mediante acordo entre as partes.

A continuidade dos serviços é garantida sem interrupções, proporcionando previsibilidade e consistência nos resultados.`,
    order: 5,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  {
    id: 'investment_recurring',
    type: 'investment',
    title: 'INVESTIMENTO MENSAL',
    content: `O valor mensal pelos serviços contratados é de R$ {{valor}}.

Os pagamentos deverão ser efetuados via boleto bancário ou Pix, com vencimento no dia 10 de cada mês.

Em caso de atraso superior a 10 dias, os serviços poderão ser temporariamente suspensos até a regularização do pagamento.`,
    order: 6,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  ...DEFAULT_SINGLE_OPTIMIZATION_CLAUSES.slice(6, 9),
  {
    id: 'rescission_recurring',
    type: 'rescission',
    title: 'RESCISÃO DO CONTRATO',
    content: `O contrato pode ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.

Não haverá penalidade em caso de rescisão antecipada, desde que o aviso prévio seja cumprido e não haja débitos pendentes entre as partes.`,
    order: 10,
    isRequired: true,
    isHidden: false,
    isEditable: true
  },
  ...DEFAULT_SINGLE_OPTIMIZATION_CLAUSES.slice(10)
];

// Contract status config
export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; emoji: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', emoji: '📝' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', emoji: '📤' },
  viewed: { label: 'Visualizado', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', emoji: '👁️' },
  signed: { label: 'Assinado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', emoji: '✅' },
  expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', emoji: '⏰' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', emoji: '❌' }
};

// Contract type config
export const CONTRACT_TYPE_CONFIG: Record<ContractType, { label: string; emoji: string }> = {
  single_optimization: { label: 'Otimização Única', emoji: '📍' },
  recurring: { label: 'Recorrência', emoji: '🔁' },
  custom: { label: 'Personalizado', emoji: '✍️' }
};

// Clause type config
export const CLAUSE_TYPE_CONFIG: Record<ContractClauseType, { label: string; emoji: string }> = {
  parties: { label: 'Identificação das Partes', emoji: '👥' },
  lgpd: { label: 'LGPD', emoji: '🔒' },
  object: { label: 'Objeto do Contrato', emoji: '🎯' },
  scope: { label: 'Escopo do Projeto', emoji: '📋' },
  execution_term: { label: 'Prazo de Execução', emoji: '📅' },
  investment: { label: 'Investimento', emoji: '💰' },
  obligations_contractor: { label: 'Responsabilidades da Contratada', emoji: '🏢' },
  obligations_contracted: { label: 'Responsabilidades da Contratante', emoji: '🤝' },
  liability_limits: { label: 'Limites de Responsabilidade', emoji: '⚠️' },
  rescission: { label: 'Rescisão', emoji: '📄' },
  confidentiality: { label: 'Confidencialidade', emoji: '🤐' },
  intellectual_property: { label: 'Propriedade Intelectual', emoji: '©️' },
  forum: { label: 'Foro e Validade', emoji: '⚖️' },
  signatures: { label: 'Assinaturas', emoji: '✍️' },
  recurring_terms: { label: 'Termos de Recorrência', emoji: '🔄' },
  custom: { label: 'Cláusula Personalizada', emoji: '📝' }
};
