-- Tabela para registrar logs de unificação de leads
CREATE TABLE IF NOT EXISTS public.lead_unification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  original_lead_id UUID NOT NULL,
  merged_lead_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('merged', 'removed', 'ignored', 'detected')),
  match_type TEXT NOT NULL CHECK (match_type IN ('email', 'phone', 'cnpj', 'name_city', 'exact', 'similar')),
  similarity_score NUMERIC(3,2),
  details JSONB,
  executed_by UUID,
  executed_by_name TEXT,
  is_automatic BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_unification_logs_agency ON public.lead_unification_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_unification_logs_created ON public.lead_unification_logs(created_at DESC);

-- RLS
ALTER TABLE public.lead_unification_logs ENABLE ROW LEVEL SECURITY;

-- Política: membros da agência podem ver logs
CREATE POLICY "Agency members can view unification logs"
ON public.lead_unification_logs
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
  )
);

-- Política: admins podem inserir logs
CREATE POLICY "Agency admins can insert unification logs"
ON public.lead_unification_logs
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT agency_id FROM public.agency_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  )
);

-- Adicionar coluna is_duplicate nos leads para marcar duplicatas detectadas
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.leads(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS merged_from UUID[];

-- Índice para buscar duplicatas
CREATE INDEX IF NOT EXISTS idx_leads_is_duplicate ON public.leads(is_duplicate) WHERE is_duplicate = true;