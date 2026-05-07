export type ClientStatus = "on_track" | "delayed" | "pending_client";
export type ColumnId = "pipeline" | "onboarding" | "optimization" | "ready_to_deliver" | "delivered" | "suspended" | "finalized";
export type PhotoMode = "with_photos" | "without_photos" | "pending";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  responsible: string; // Nome dinâmico do responsável - pode ser qualquer membro da equipe
  completedAt?: string;
  attachmentUrl?: string;
  optional?: boolean;
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

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
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
  usefulLinks?: UsefulLink[];
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

// Checklist Padrão - Template personalizável por agência
// TOTAL_CHECKLIST = itens obrigatórios (optional: false) usados no cálculo de progresso
export const TOTAL_CHECKLIST = 32;

export const DEFAULT_CHECKLIST: ChecklistSection[] = [
  {
    id: "etapa1",
    title: "1. Estrutura Inicial",
    items: [
      { id: "1-1", title: "Solicitar acesso ao Perfil Google do cliente (ou criar caso não exista)", completed: false, responsible: "Operador", optional: false },
      { id: "1-2", title: "Solicitar fotos da empresa (interior, exterior, equipe, produtos)", completed: false, responsible: "Operador", optional: false },
      { id: "1-3", title: "Solicitar logo da empresa", completed: false, responsible: "Operador", optional: false },
      { id: "1-4", title: "Criar grupo no WhatsApp com o cliente", completed: false, responsible: "Admin", optional: false },
      { id: "1-5", title: "Criar pasta do cliente no Google Drive", completed: false, responsible: "Operador", optional: false },
      { id: "1-6", title: "Criar email para o cliente (para cadastro em diretórios)", completed: false, responsible: "Operador", optional: false },
    ],
  },
  {
    id: "etapa2",
    title: "2. Preparação",
    items: [
      { id: "2-1", title: "Fazer briefing completo do cliente (Google Docs)", completed: false, responsible: "Operador", optional: false },
      { id: "2-2", title: "Definir palavras-chave principais com o cliente", completed: false, responsible: "Operador", optional: false },
      { id: "2-3", title: "Analisar perfis dos concorrentes no Google Maps", completed: false, responsible: "Operador", optional: false },
      { id: "2-4", title: "Criar link WhatsApp longo e curto", completed: false, responsible: "Operador", optional: false },
      { id: "2-5", title: "Salvar print do GBP Score ANTES (anexar no sistema)", completed: false, responsible: "Operador", optional: false },
      { id: "2-6", title: "Salvar print do Localo ANTES (anexar no sistema)", completed: false, responsible: "Operador", optional: false },
      { id: "2-7", title: "Criar artes visuais: produtos (900x900), postagens (1200x900) e QR Code", completed: false, responsible: "Designer", optional: false },
    ],
  },
  {
    id: "etapa3",
    title: "3. Otimização do Perfil",
    items: [
      { id: "3-1", title: "Atualizar nome da empresa com palavras-chave", completed: false, responsible: "Operador", optional: false },
      { id: "3-2", title: "Atualizar descrição do perfil com SEO", completed: false, responsible: "Operador", optional: false },
      { id: "3-3", title: "Corrigir endereço, horário de funcionamento e telefone", completed: false, responsible: "Operador", optional: false },
      { id: "3-4", title: "Definir e ajustar categoria principal e categorias adicionais", completed: false, responsible: "Operador", optional: false },
      { id: "3-5", title: "Adicionar link WhatsApp e ativar chat no perfil", completed: false, responsible: "Operador", optional: false },
      { id: "3-6", title: "Adicionar atributos relevantes ao perfil", completed: false, responsible: "Operador", optional: false },
      { id: "3-7", title: "Responder todas as avaliações com palavras-chave", completed: false, responsible: "Operador", optional: false },
      { id: "3-8", title: "Editar fotos e aplicar geolocalização (GeoSetter)", completed: false, responsible: "Designer", optional: false },
      { id: "3-9", title: "Subir fotos editadas no perfil (interior, exterior, equipe)", completed: false, responsible: "Operador", optional: false },
      { id: "3-10", title: "Subir vídeos no perfil (mínimo 3 vídeos)", completed: false, responsible: "Operador", optional: false },
      { id: "3-11", title: "Inserir serviços com palavras-chave + fazer copy dos serviços", completed: false, responsible: "Operador", optional: false },
      { id: "3-12", title: "Inserir produtos otimizados + fazer copy dos produtos", completed: false, responsible: "Operador", optional: false },
      { id: "3-13", title: "Publicar postagens com palavras-chave + fazer copy das postagens", completed: false, responsible: "Operador", optional: false },
      { id: "3-14", title: "Cadastrar em diretórios online com nome otimizado", completed: false, responsible: "Operador", optional: true },
      { id: "3-15", title: "Criar / otimizar perfis nas redes sociais (YouTube, LinkedIn, TikTok, Pinterest, X)", completed: false, responsible: "Operador", optional: true },
    ],
  },
  {
    id: "etapa4",
    title: "4. Entrega",
    items: [
      { id: "4-1", title: "Conferir perfil completo (todas as seções preenchidas)", completed: false, responsible: "Operador", optional: false },
      { id: "4-2", title: "Confirmar propriedade do cliente + agência permanece como admin", completed: false, responsible: "Admin", optional: false },
      { id: "4-3", title: "Montar drive de entrega com todos os materiais (fotos, artes, QR Code)", completed: false, responsible: "Operador", optional: false },
      { id: "4-4", title: "Criar relatório antes e depois (print do score + posição na palavra-chave principal)", completed: false, responsible: "Operador", optional: false },
      { id: "4-5", title: "Reunião de entrega: apresentar evolução e mostrar antes vs depois", completed: false, responsible: "Admin", optional: false },
      { id: "4-6", title: "Solicitar 3 indicações ao final da reunião", completed: false, responsible: "Admin", optional: false },
    ],
  },
];
