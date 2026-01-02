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
// Cada agência pode definir seus próprios checklists e responsáveis
// Os responsáveis são definidos dinamicamente pela equipe de cada agência
export const DEFAULT_CHECKLIST: ChecklistSection[] = [
  {
    id: "etapa1",
    title: "1. Onboarding",
    items: [
      { id: "1-1", title: "Fechar venda e criar grupo de comunicação com cliente", completed: false, responsible: "Admin" },
      { id: "1-2", title: "Alterar foto do grupo para foto padrão da agência", completed: false, responsible: "Admin" },
      { id: "1-3", title: "Dar boas vindas no grupo e se deixar à disposição", completed: false, responsible: "Operador" },
      { id: "1-4", title: "Agendar reunião de briefing (até 48h)", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa2",
    title: "2. Preparação",
    items: [
      { id: "2-1", title: "Criar ou obter conta de e-mail para o cliente", completed: false, responsible: "Operador" },
      { id: "2-2", title: "Criar pasta do cliente no armazenamento em nuvem", completed: false, responsible: "Operador" },
      { id: "2-3", title: "Configurar ferramentas de IA para o projeto", completed: false, responsible: "Operador" },
      { id: "2-4", title: "Registrar métricas ANTES da execução", completed: false, responsible: "Operador" },
      { id: "2-5", title: "Realizar briefing + pegar propriedade do Perfil", completed: false, responsible: "Operador" },
      { id: "2-6", title: "Criar documento de briefing/notas no card do cliente", completed: false, responsible: "Operador" },
      { id: "2-7", title: "Criar slogans para postagens e validar com cliente", completed: false, responsible: "Operador" },
      { id: "2-8", title: "Criar link de contato direto e adicionar no card", completed: false, responsible: "Operador" },
      { id: "2-9", title: "Inserir link de contato no perfil e ativar chat", completed: false, responsible: "Operador" },
      { id: "2-10", title: "Definir: tirar fotos ou solicitar ao cliente", completed: false, responsible: "Admin" },
      { id: "2-11", title: "Tirar fotos da empresa (se aplicável)", completed: false, responsible: "Admin" },
      { id: "2-12", title: "Solicitar fotos ao cliente (se cliente vai enviar)", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa3",
    title: "3. Produção",
    items: [
      { id: "3-1", title: "Editar fotos da empresa", completed: false, responsible: "Designer" },
      { id: "3-2", title: "Salvar fotos editadas na pasta do cliente", completed: false, responsible: "Designer" },
      { id: "3-3", title: "Criar modelo de geolocalização para imagens", completed: false, responsible: "Operador" },
      { id: "3-4", title: "Criar designs de produtos", completed: false, responsible: "Operador" },
      { id: "3-5", title: "Criar designs de postagens", completed: false, responsible: "Operador" },
      { id: "3-6", title: "Criar arte de QR Codes", completed: false, responsible: "Operador" },
      { id: "3-7", title: "Buscar ou criar vídeos do cliente (mínimo 3)", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa4",
    title: "4. Otimização",
    items: [
      { id: "4-1", title: "Atualizar informações principais do cliente no Perfil", completed: false, responsible: "Operador" },
      { id: "4-2", title: "Responder todas as avaliações usando palavras-chave", completed: false, responsible: "Operador" },
      { id: "4-3", title: "Pesquisar, definir e ajustar categorias", completed: false, responsible: "Operador" },
      { id: "4-4", title: "Subir fotos com palavras-chave e geolocalização", completed: false, responsible: "Operador" },
      { id: "4-5", title: "Subir fotos editadas e vídeos no Perfil", completed: false, responsible: "Operador" },
      { id: "4-6", title: "Criar e incluir serviços com palavras-chave", completed: false, responsible: "Operador" },
      { id: "4-7", title: "Subir produtos no Perfil", completed: false, responsible: "Operador" },
      { id: "4-8", title: "Criar e subir postagens no Perfil", completed: false, responsible: "Operador" },
      { id: "4-9", title: "Alterar nome com palavras-chave (validar com Admin)", completed: false, responsible: "Operador" },
      { id: "4-10", title: "Responder perguntas e respostas", completed: false, responsible: "Operador" },
      { id: "4-11", title: "Criar FAQs no perfil", completed: false, responsible: "Operador" },
      { id: "4-12", title: "Cadastrar empresa em diretórios", completed: false, responsible: "Operador" },
      { id: "4-13", title: "Criar perfis em redes sociais com nome otimizado", completed: false, responsible: "Operador" },
    ],
  },
  {
    id: "etapa5",
    title: "5. Entrega",
    items: [
      { id: "5-1", title: "Conferir materiais organizados na pasta do cliente", completed: false, responsible: "Operador" },
      { id: "5-2", title: "Registrar métricas DEPOIS da execução", completed: false, responsible: "Operador" },
      { id: "5-3", title: "Criar relatório de entrega comparando ANTES x DEPOIS", completed: false, responsible: "Operador" },
      { id: "5-4", title: "Verificar se cliente está como proprietário principal", completed: false, responsible: "Admin" },
      { id: "5-5", title: "Manter acesso como administrador do Perfil", completed: false, responsible: "Admin" },
      { id: "5-6", title: "Entregar com apresentação do resultado", completed: false, responsible: "Operador" },
      { id: "5-7", title: "Solicitar indicação de novos clientes", completed: false, responsible: "Admin" },
      { id: "5-8", title: "Oferecer plano de recorrência se cliente for estratégico", completed: false, responsible: "Admin" },
      { id: "5-9", title: "💰 Pagar comissão da equipe", completed: false, responsible: "Admin" },
    ],
  },
];
