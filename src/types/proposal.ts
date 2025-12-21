export type ProposalBlockType = 
  | 'diagnosis'
  | 'objective'
  | 'scope'
  | 'investment'
  | 'timeline'
  | 'guarantee'
  | 'custom';

export interface ProposalBlock {
  id: string;
  type: ProposalBlockType;
  title: string;
  content: string;
  checklist?: string[];
  order: number;
}

export type FullProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export interface Proposal {
  id: string;
  agency_id: string;
  lead_id?: string | null;
  client_id?: string | null;
  
  title: string;
  client_name: string;
  company_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  city?: string | null;
  
  blocks: ProposalBlock[];
  variables: Record<string, string>;
  
  full_price?: number | null;
  discounted_price?: number | null;
  installments?: number | null;
  installment_value?: number | null;
  payment_method?: string | null;
  discount_reason?: string | null;
  
  valid_until?: string | null;
  
  status: FullProposalStatus;
  
  public_token?: string | null;
  public_url?: string | null;
  
  sent_at?: string | null;
  first_viewed_at?: string | null;
  last_viewed_at?: string | null;
  view_count: number;
  accepted_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  
  ai_generated: boolean;
  ai_prompt?: string | null;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalTemplate {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  blocks: ProposalBlock[];
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalView {
  id: string;
  proposal_id: string;
  viewed_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  duration_seconds?: number | null;
}

// Default blocks for new proposals
export const DEFAULT_PROPOSAL_BLOCKS: ProposalBlock[] = [
  {
    id: 'diagnosis',
    type: 'diagnosis',
    title: '📌 Diagnóstico',
    content: 'Hoje, {{nome_empresa}} está aparecendo na 2ª página do Google e por isso está perdendo vendas para empresas menos qualificadas. Quando alguém busca por {{palavras_chave}} em {{cidade}}, vocês não aparecem no topo...',
    order: 1
  },
  {
    id: 'objective',
    type: 'objective',
    title: '🎯 Objetivo',
    content: 'Queremos colocar {{nome_empresa}} no topo do Google para atrair clientes novos que nunca ouviram falar de vocês. Quando alguém buscar por {{palavras_chave}} em {{cidade}}, vocês serão a primeira opção.',
    order: 2
  },
  {
    id: 'scope',
    type: 'scope',
    title: '🔧 Escopo Estratégico',
    content: '',
    checklist: [
      'Verificação/Criação do perfil no Google',
      'Otimização da ficha (informações, categorias, horário)',
      'Estudo de palavras-chave regionais',
      'Análise de concorrentes',
      'SEO local (on-page e off-page)',
      'Catálogo de serviços com copy estratégica',
      'Postagens otimizadas (imagem + texto + CTA)',
      'Sessão de fotos profissionais',
      'Fotos 360º + Tour Virtual',
      'Inserção de palavras-chave + geolocalização nas imagens',
      'Cadastro em diretórios (NAPW)',
      'Integração com Waze, Apple Maps, WhatsApp Maps',
      'Resposta estratégica às avaliações',
      'Estratégias de alavancagem de avaliações',
      'Geração de QR Codes inteligentes',
      'Relatório final de impacto',
      'Acompanhamento (Mês 2)',
      'Treinamento/consultoria final',
      'Entrega completa + pasta com todos os arquivos'
    ],
    order: 3
  },
  {
    id: 'investment',
    type: 'investment',
    title: '💰 Investimento',
    content: '',
    order: 4
  },
  {
    id: 'timeline',
    type: 'timeline',
    title: '📅 Cronograma',
    content: '**Mês 1:** Execução completa de todas as etapas estratégicas\n**Mês 2:** Acompanhamento, ajustes finos e monitoramento de resultados',
    order: 5
  },
  {
    id: 'guarantee',
    type: 'guarantee',
    title: '🛡️ Garantia',
    content: 'Oferecemos suporte completo durante todo o período de execução. Se você não ficar satisfeito com os resultados em 30 dias, devolvemos seu investimento.',
    order: 6
  }
];

export const PROPOSAL_STATUS_CONFIG: Record<FullProposalStatus, { label: string; color: string; emoji: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', emoji: '📝' },
  sent: { label: 'Enviada', color: 'bg-blue-500/20 text-blue-400', emoji: '📤' },
  viewed: { label: 'Visualizada', color: 'bg-purple-500/20 text-purple-400', emoji: '👁️' },
  accepted: { label: 'Aceita', color: 'bg-green-500/20 text-green-400', emoji: '✅' },
  rejected: { label: 'Rejeitada', color: 'bg-red-500/20 text-red-400', emoji: '❌' },
  expired: { label: 'Expirada', color: 'bg-orange-500/20 text-orange-400', emoji: '⏰' }
};

export const BLOCK_TYPE_CONFIG: Record<ProposalBlockType, { label: string; emoji: string }> = {
  diagnosis: { label: 'Diagnóstico', emoji: '📌' },
  objective: { label: 'Objetivo', emoji: '🎯' },
  scope: { label: 'Escopo', emoji: '🔧' },
  investment: { label: 'Investimento', emoji: '💰' },
  timeline: { label: 'Cronograma', emoji: '📅' },
  guarantee: { label: 'Garantia', emoji: '🛡️' },
  custom: { label: 'Personalizado', emoji: '✏️' }
};
