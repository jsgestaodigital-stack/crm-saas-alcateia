// Lead Types for RANKEIA CRM

export type LeadStatus = 'open' | 'gained' | 'lost' | 'future';

export type LeadPipelineStage = 
  | 'cold' 
  | 'contacted' 
  | 'qualified' 
  | 'meeting_scheduled' 
  | 'meeting_done' 
  | 'proposal_sent' 
  | 'negotiating' 
  | 'future' 
  | 'gained' 
  | 'lost';

export type ProposalStatus = 'not_sent' | 'sent' | 'reviewing' | 'approved' | 'rejected';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type LeadActivityType = 'whatsapp' | 'call' | 'meeting' | 'note' | 'follow_up' | 'proposal' | 'email';

export interface LeadSource {
  id: string;
  label: string;
  active: boolean;
  created_at: string;
}

export interface LostReason {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  city: string | null;
  main_category: string | null;
  source_id: string | null;
  source_custom: string | null;
  pipeline_stage: LeadPipelineStage;
  temperature: LeadTemperature;
  probability: number;
  estimated_value: number | null;
  next_action: string | null;
  next_action_date: string | null;
  proposal_url: string | null;
  proposal_status: ProposalStatus;
  proposal_notes: string | null;
  status: LeadStatus;
  lost_reason_id: string | null;
  lost_notes: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  notes: string | null;
  responsible: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: LeadActivityType;
  content: string;
  link: string | null;
  notes: string | null;
  ai_insight: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string | null;
}

export interface RaioxAnalysis {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  call_link: string | null;
  transcription: string | null;
  summary: string | null;
  objections: string | null;
  closing_angle: string | null;
  next_step: string | null;
  suggested_script: string | null;
  what_to_avoid: string | null;
  created_by: string;
  created_at: string;
}

// Pipeline columns configuration
export const LEAD_COLUMNS: { id: LeadPipelineStage; title: string; emoji: string; color: string }[] = [
  { id: 'cold', title: 'Leads Frios', emoji: '🧊', color: 'bg-slate-500' },
  { id: 'contacted', title: 'Contatados', emoji: '📞', color: 'bg-blue-500' },
  { id: 'qualified', title: 'Qualificados', emoji: '✅', color: 'bg-cyan-500' },
  { id: 'meeting_scheduled', title: 'Reunião Marcada', emoji: '📅', color: 'bg-purple-500' },
  { id: 'meeting_done', title: 'Reunião Feita', emoji: '🤝', color: 'bg-indigo-500' },
  { id: 'proposal_sent', title: 'Proposta Enviada', emoji: '📄', color: 'bg-amber-500' },
  { id: 'negotiating', title: 'Negociação', emoji: '💬', color: 'bg-orange-500' },
  { id: 'future', title: 'Futuro', emoji: '⏳', color: 'bg-gray-500' },
  { id: 'gained', title: 'Ganho', emoji: '✅', color: 'bg-green-500' },
  { id: 'lost', title: 'Perdido', emoji: '❌', color: 'bg-red-500' },
];

export const TEMPERATURE_CONFIG: Record<LeadTemperature, { label: string; color: string; emoji: string }> = {
  cold: { label: 'Frio', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emoji: '🧊' },
  warm: { label: 'Morno', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', emoji: '🌤️' },
  hot: { label: 'Quente', color: 'bg-red-500/20 text-red-400 border-red-500/30', emoji: '🔥' },
};

export const ACTIVITY_TYPE_CONFIG: Record<LeadActivityType, { label: string; emoji: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', emoji: '💬', color: 'bg-green-500/20 text-green-400' },
  call: { label: 'Ligação', emoji: '📞', color: 'bg-blue-500/20 text-blue-400' },
  meeting: { label: 'Reunião', emoji: '🤝', color: 'bg-purple-500/20 text-purple-400' },
  note: { label: 'Nota', emoji: '📝', color: 'bg-gray-500/20 text-gray-400' },
  follow_up: { label: 'Retorno', emoji: '🔄', color: 'bg-amber-500/20 text-amber-400' },
  proposal: { label: 'Proposta', emoji: '📄', color: 'bg-cyan-500/20 text-cyan-400' },
  email: { label: 'E-mail', emoji: '📧', color: 'bg-indigo-500/20 text-indigo-400' },
};

export const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string }> = {
  not_sent: { label: 'Não enviada', color: 'bg-gray-500/20 text-gray-400' },
  sent: { label: 'Enviada', color: 'bg-blue-500/20 text-blue-400' },
  reviewing: { label: 'Revisando', color: 'bg-amber-500/20 text-amber-400' },
  approved: { label: 'Aprovada', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Recusada', color: 'bg-red-500/20 text-red-400' },
};
