-- =============================================
-- ETAPA 6.1 – ESTRUTURA PARA COPILOTO DE IA
-- =============================================

-- 1. Criar tabela para registrar interações com IA
CREATE TABLE IF NOT EXISTS public.lead_ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  interaction_type TEXT NOT NULL, -- 'summary' | 'suggestion' | 'chat' | 'analysis'
  prompt TEXT,
  ai_response TEXT,
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.lead_ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_ai_interactions FORCE ROW LEVEL SECURITY;

-- 3. Políticas de acesso
CREATE POLICY "Members can view own agency interactions"
  ON public.lead_ai_interactions FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Members can insert interactions"
  ON public.lead_ai_interactions FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

-- 4. Trigger para preencher agency_id e user_name
CREATE OR REPLACE FUNCTION public.lead_ai_interactions_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_agency UUID;
BEGIN
  -- Set agency from lead
  IF NEW.lead_id IS NOT NULL THEN
    SELECT agency_id INTO v_agency
    FROM public.leads
    WHERE id = NEW.lead_id
    LIMIT 1;
    
    IF v_agency IS NOT NULL THEN
      NEW.agency_id := v_agency;
    END IF;
  END IF;
  
  -- Fallback to current agency
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found for AI interaction';
  END IF;

  -- Set user_name
  IF NEW.user_id IS NOT NULL AND NEW.user_name IS NULL THEN
    SELECT full_name INTO v_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    NEW.user_name := COALESCE(v_name, 'Sistema');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_ai_interactions_set_defaults_trigger
  BEFORE INSERT ON public.lead_ai_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_ai_interactions_set_defaults();

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_ai_interactions_lead ON public.lead_ai_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_agency ON public.lead_ai_interactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON public.lead_ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON public.lead_ai_interactions(interaction_type);