export type ClientStatus = "on_track" | "delayed" | "pending_client";
export type ColumnId = "pipeline" | "onboarding" | "optimization" | "ready_to_deliver" | "delivered" | "suspended" | "finalized";
export type PhotoMode = "with_photos" | "without_photos" | "pending";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  responsible: "João" | "Amanda";
  completedAt?: string;
  attachmentUrl?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comparison {
  id: string;
  title: string;
  beforeImage?: string;
  afterImage?: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export type CoverType = "none" | "solid" | "image";

export interface CoverConfig {
  type: CoverType;
  color?: string;
  imageUrl?: string;
}

export interface ClientLabel {
  id: string;
  name: string;
  color: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  clientId?: string;
  completed: boolean;
}

export interface Client {
  id: string;
  companyName: string;
  googleProfileUrl?: string;
  driveUrl?: string;
  whatsappGroupUrl?: string;
  whatsappLink?: string;
  whatsappLinkShort?: string;
  planType: "unique" | "recurring";
  isOwner: boolean;
  mainCategory?: string;
  keywords?: string[];
  notes?: string;
  briefing?: string;
  responsible: string;
  startDate: string;
  lastUpdate: string;
  status: ClientStatus;
  columnId: ColumnId;
  checklist: ChecklistSection[];
  comparisons: Comparison[];
  history: HistoryEntry[];
  attachmentsCount?: number;
  profileImage?: string;
  coverConfig?: CoverConfig;
  labels?: ClientLabel[];
  attachments?: string[];
  city?: string;
  photoMode?: PhotoMode;
  yahooEmail?: string;
  suspendedAt?: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  emoji: string;
  color: string;
}

export const COLUMNS: Column[] = [
  { id: "suspended", title: "Suspensos Resolver", emoji: "⏸️", color: "column-suspended" },
  { id: "pipeline", title: "Verificação / Para entrar", emoji: "🔍", color: "column-pipeline" },
  { id: "onboarding", title: "Iniciar", emoji: "▶️", color: "column-onboarding" },
  { id: "optimization", title: "Fazendo Otimização", emoji: "🚀", color: "column-optimization" },
  { id: "ready_to_deliver", title: "Feitos - Com Pendência", emoji: "⚠️", color: "column-ready" },
  { id: "finalized", title: "Feitos 100% - Entregar", emoji: "✅", color: "column-finalized" },
  { id: "delivered", title: "Entregues", emoji: "📦", color: "column-delivered" },
];

// Standard WhatsApp group photo URL (replace with actual uploaded image)
export const WHATSAPP_GROUP_PHOTO = "/rankeia-whatsapp-group.png";

// Checklist RANKEIA - Método de Execução Linear (5 etapas, 58 itens)
// Prazo: 30 dias do início até entrega
export const DEFAULT_CHECKLIST: ChecklistSection[] = [
  {
    id: "etapa1",
    title: "1. Onboarding",
    items: [
      { id: "1-1", title: "Fechar venda e criar grupo WhatsApp (Amanda + cliente)", completed: false, responsible: "João" },
      { id: "1-2", title: "Alterar foto do grupo para foto padrão RANKEIA", completed: false, responsible: "João" },
      { id: "1-3", title: "Dar boas vindas no grupo e se deixar à disposição", completed: false, responsible: "Amanda" },
      { id: "1-4", title: "Agendar reunião de briefing no Meet (até 48h)", completed: false, responsible: "Amanda" },
    ],
  },
  {
    id: "etapa2",
    title: "2. Preparação",
    items: [
      { id: "2-1", title: "Comprar conta Gmail na GG Max", completed: false, responsible: "Amanda" },
      { id: "2-2", title: "Criar pasta do cliente no Google Drive (pasta 'Fazendo')", completed: false, responsible: "Amanda" },
      { id: "2-3", title: "Criar conversa exclusiva no ChatGPT (Agente Alcateia)", completed: false, responsible: "Amanda" },
      { id: "2-4", title: "Print do GBP Score ANTES da execução", completed: false, responsible: "Amanda" },
      { id: "2-5", title: "Print do Localo ANTES da execução", completed: false, responsible: "Amanda" },
      { id: "2-6", title: "Print do Google Ads (volume de buscas)", completed: false, responsible: "Amanda" },
      { id: "2-7", title: "Realizar briefing + pegar propriedade do Perfil (criar ficha se não existir) + logo", completed: false, responsible: "Amanda" },
      { id: "2-8", title: "Criar documento de briefing/notas no card do cliente", completed: false, responsible: "Amanda" },
      { id: "2-9", title: "Criar slogans para postagens e validar com cliente", completed: false, responsible: "Amanda" },
      { id: "2-10", title: "Criar link WhatsApp longo e curto e adicionar no card", completed: false, responsible: "Amanda" },
      { id: "2-11", title: "Inserir link WhatsApp no perfil e ativar chat no Google", completed: false, responsible: "Amanda" },
      { id: "2-12", title: "Definir: tirar fotos ou solicitar ao cliente", completed: false, responsible: "João" },
      { id: "2-13", title: "Tirar fotos da empresa (se João for tirar)", completed: false, responsible: "João" },
      { id: "2-14", title: "Solicitar fotos ao cliente (se cliente vai enviar)", completed: false, responsible: "Amanda" },
    ],
  },
  {
    id: "etapa3",
    title: "3. Produção",
    items: [
      { id: "3-1", title: "Editar fotos da empresa no Lightroom", completed: false, responsible: "João" },
      { id: "3-2", title: "Salvar fotos editadas na pasta do cliente no Drive", completed: false, responsible: "João" },
      { id: "3-3", title: "Criar modelo de GeoSetter (com apoio do Agente Alcateia)", completed: false, responsible: "Amanda" },
      { id: "3-4", title: "Criar designs de produtos (1200x1200) com IA GLIBATREE", completed: false, responsible: "Amanda" },
      { id: "3-5", title: "Criar designs de postagens (1200x900) com IA GLIBATREE", completed: false, responsible: "Amanda" },
      { id: "3-6", title: "Criar arte de QR Codes e adicionar na pasta do Drive", completed: false, responsible: "Amanda" },
      { id: "3-7", title: "Buscar vídeos no Instagram do cliente ou criar no Canva (mínimo 3)", completed: false, responsible: "Amanda" },
    ],
  },
  {
    id: "etapa4",
    title: "4. Otimização",
    items: [
      { id: "4-1", title: "Atualizar informações principais do cliente no Perfil", completed: false, responsible: "Amanda" },
      { id: "4-2", title: "Responder todas as avaliações usando palavras-chave", completed: false, responsible: "Amanda" },
      { id: "4-3", title: "Pesquisar, definir e ajustar categorias (principal e adicionais)", completed: false, responsible: "Amanda" },
      { id: "4-4", title: "Subir fotos no GeoSetter com palavras-chave e geolocalização", completed: false, responsible: "Amanda" },
      { id: "4-5", title: "Subir fotos editadas e vídeos no Perfil do Google", completed: false, responsible: "Amanda" },
      { id: "4-6", title: "Criar e incluir serviços com palavras-chave (nome + descrição)", completed: false, responsible: "Amanda" },
      { id: "4-7", title: "Criar copy dos serviços do Perfil (Agente Alcateia)", completed: false, responsible: "Amanda" },
      { id: "4-8", title: "Subir produtos no Perfil do Google", completed: false, responsible: "Amanda" },
      { id: "4-9", title: "Criar copy dos produtos do Perfil (Agente Alcateia)", completed: false, responsible: "Amanda" },
      { id: "4-10", title: "Criar e subir postagens no Perfil do Google", completed: false, responsible: "Amanda" },
      { id: "4-11", title: "Criar copy das postagens (Agente Alcateia)", completed: false, responsible: "Amanda" },
      { id: "4-12", title: "Alterar nome da empresa com palavras-chave (validar com João)", completed: false, responsible: "Amanda" },
      { id: "4-13", title: "Responder perguntas e respostas do Google Maps", completed: false, responsible: "Amanda" },
      { id: "4-14", title: "Criar de 10 a 20 FAQs no perfil do Google", completed: false, responsible: "Amanda" },
      { id: "4-15", title: "Cadastrar empresa em diretórios com nome otimizado SEO local", completed: false, responsible: "Amanda" },
      { id: "4-16", title: "Criar perfil no YouTube com o nome otimizado", completed: false, responsible: "Amanda" },
      { id: "4-17", title: "Criar perfil no LinkedIn com o nome otimizado", completed: false, responsible: "Amanda" },
      { id: "4-18", title: "Criar perfil no TikTok com o nome otimizado", completed: false, responsible: "Amanda" },
      { id: "4-19", title: "Criar perfil no Pinterest com o nome otimizado", completed: false, responsible: "Amanda" },
      { id: "4-20", title: "Criar perfil no X (Twitter) com o nome otimizado", completed: false, responsible: "Amanda" },
      { id: "4-21", title: "Repetir nome + palavras-chave em todos os perfis", completed: false, responsible: "Amanda" },
    ],
  },
  {
    id: "etapa5",
    title: "5. Entrega",
    items: [
      { id: "5-1", title: "Conferir QR Codes, artes e produtos organizados no Drive", completed: false, responsible: "Amanda" },
      { id: "5-2", title: "Print do GBP Score DEPOIS da execução", completed: false, responsible: "Amanda" },
      { id: "5-3", title: "Print do Localo DEPOIS da execução", completed: false, responsible: "Amanda" },
      { id: "5-4", title: "Print do perfil otimizado (Fireshot)", completed: false, responsible: "Amanda" },
      { id: "5-5", title: "Criar relatório de entrega comparando ANTES x DEPOIS", completed: false, responsible: "Amanda" },
      { id: "5-6", title: "Incluir score e posicionamento na palavra-chave principal", completed: false, responsible: "Amanda" },
      { id: "5-7", title: "Verificar se cliente está como proprietário principal do perfil", completed: false, responsible: "João" },
      { id: "5-8", title: "Manter acesso como administrador do Perfil do Google", completed: false, responsible: "João" },
      { id: "5-9", title: "Entregar perfil com link do Drive e apresentação do resultado", completed: false, responsible: "Amanda" },
      { id: "5-10", title: "Apresentar diferença visual e estratégica (antes x depois)", completed: false, responsible: "Amanda" },
      { id: "5-11", title: "Solicitar indicação de 3 novos clientes ao final da reunião", completed: false, responsible: "João" },
      { id: "5-12", title: "Oferecer plano de recorrência se cliente for estratégico", completed: false, responsible: "João" },
      { id: "5-13", title: "💰 Pagar comissão da equipe (Amanda - R$400)", completed: false, responsible: "João" },
    ],
  },
];
