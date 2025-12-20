-- =============================================
-- BLOCO 8: Módulo de Atividades e Tarefas (CRM)
-- =============================================

-- 8.1 - Extend lead_activities with ai_insight (table already exists)
ALTER TABLE public.lead_activities 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS ai_insight TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create trigger for updated_at on lead_activities
CREATE OR REPLACE FUNCTION public.update_lead_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_lead_activities_updated_at ON public.lead_activities;
CREATE TRIGGER trigger_lead_activities_updated_at
  BEFORE UPDATE ON public.lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_activities_updated_at();

-- =============================================
-- 8.2 - Tabela scheduled_tasks
-- =============================================

-- Create enums for task status and priority
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL DEFAULT (public.current_agency_id()),
  user_id UUID DEFAULT auth.uid(),
  user_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'pending',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  completed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT scheduled_tasks_has_reference CHECK (lead_id IS NOT NULL OR client_id IS NOT NULL)
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_agency_id ON public.scheduled_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_lead_id ON public.scheduled_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_client_id ON public.scheduled_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON public.scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON public.scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_due_date ON public.scheduled_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_priority ON public.scheduled_tasks(priority);

-- Trigger for set_agency_id
CREATE OR REPLACE FUNCTION public.set_scheduled_tasks_agency_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_scheduled_tasks_agency_id ON public.scheduled_tasks;
CREATE TRIGGER trigger_set_scheduled_tasks_agency_id
  BEFORE INSERT ON public.scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_scheduled_tasks_agency_id();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_scheduled_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_scheduled_tasks_updated_at ON public.scheduled_tasks;
CREATE TRIGGER trigger_scheduled_tasks_updated_at
  BEFORE UPDATE ON public.scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scheduled_tasks_updated_at();

-- Enable RLS
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "scheduled_tasks_select" ON public.scheduled_tasks;
CREATE POLICY "scheduled_tasks_select" ON public.scheduled_tasks
  FOR SELECT USING (agency_id = public.current_agency_id());

DROP POLICY IF EXISTS "scheduled_tasks_insert" ON public.scheduled_tasks;
CREATE POLICY "scheduled_tasks_insert" ON public.scheduled_tasks
  FOR INSERT WITH CHECK (agency_id = public.current_agency_id());

DROP POLICY IF EXISTS "scheduled_tasks_update" ON public.scheduled_tasks;
CREATE POLICY "scheduled_tasks_update" ON public.scheduled_tasks
  FOR UPDATE USING (agency_id = public.current_agency_id());

DROP POLICY IF EXISTS "scheduled_tasks_delete" ON public.scheduled_tasks;
CREATE POLICY "scheduled_tasks_delete" ON public.scheduled_tasks
  FOR DELETE USING (agency_id = public.current_agency_id());

-- =============================================
-- 8.3 - Funções auxiliares
-- =============================================

-- Function to log lead activity
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  p_lead_id UUID,
  p_type public.lead_activity_type,
  p_content TEXT,
  p_notes TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_activity_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = v_user_id;
  
  INSERT INTO public.lead_activities (
    lead_id, type, content, notes, link, created_by, created_by_name
  ) VALUES (
    p_lead_id, p_type, p_content, p_notes, p_link, v_user_id, COALESCE(v_user_name, 'Sistema')
  )
  RETURNING id INTO v_activity_id;
  
  -- Update lead's last_activity_at
  UPDATE public.leads
  SET last_activity_at = now(), updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to complete a task
CREATE OR REPLACE FUNCTION public.complete_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = v_user_id;
  
  UPDATE public.scheduled_tasks
  SET 
    status = 'completed',
    completed_at = now(),
    completed_by = v_user_id,
    completed_by_name = COALESCE(v_user_name, 'Usuário')
  WHERE id = p_task_id
    AND agency_id = public.current_agency_id();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mark overdue tasks automatically
CREATE OR REPLACE FUNCTION public.auto_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.scheduled_tasks
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now()
    AND agency_id = public.current_agency_id();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- 8.4 - IA e produtividade
-- =============================================

-- Function to suggest next task based on lead history
CREATE OR REPLACE FUNCTION public.suggest_next_task(p_lead_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lead RECORD;
  v_last_activity RECORD;
  v_pending_tasks INTEGER;
  v_suggestion JSONB;
BEGIN
  -- Get lead info
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id AND agency_id = public.current_agency_id();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lead não encontrado');
  END IF;
  
  -- Get last activity
  SELECT * INTO v_last_activity
  FROM public.lead_activities
  WHERE lead_id = p_lead_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Count pending tasks
  SELECT COUNT(*) INTO v_pending_tasks
  FROM public.scheduled_tasks
  WHERE lead_id = p_lead_id AND status = 'pending';
  
  -- Build suggestion based on pipeline stage and history
  v_suggestion := jsonb_build_object(
    'lead_id', p_lead_id,
    'lead_name', v_lead.company_name,
    'pipeline_stage', v_lead.pipeline_stage,
    'temperature', v_lead.temperature,
    'days_since_last_activity', COALESCE(EXTRACT(DAY FROM now() - v_last_activity.created_at)::INTEGER, 999),
    'pending_tasks', v_pending_tasks,
    'last_activity_type', v_last_activity.type,
    'suggestions', CASE
      -- No activity for a while
      WHEN v_last_activity IS NULL OR EXTRACT(DAY FROM now() - v_last_activity.created_at) > 7 THEN
        jsonb_build_array(
          jsonb_build_object('action', 'call', 'reason', 'Lead sem atividade há mais de 7 dias', 'priority', 'high'),
          jsonb_build_object('action', 'email', 'reason', 'Enviar follow-up para reengajar', 'priority', 'medium')
        )
      -- Hot lead without meeting
      WHEN v_lead.temperature = 'hot' AND v_lead.pipeline_stage IN ('prospecting', 'qualification') THEN
        jsonb_build_array(
          jsonb_build_object('action', 'meeting', 'reason', 'Lead quente - agendar reunião de qualificação', 'priority', 'urgent'),
          jsonb_build_object('action', 'call', 'reason', 'Ligar para confirmar interesse', 'priority', 'high')
        )
      -- Proposal stage
      WHEN v_lead.pipeline_stage = 'proposal' THEN
        jsonb_build_array(
          jsonb_build_object('action', 'call', 'reason', 'Follow-up da proposta enviada', 'priority', 'high'),
          jsonb_build_object('action', 'email', 'reason', 'Enviar detalhes adicionais se necessário', 'priority', 'medium')
        )
      -- Negotiation stage
      WHEN v_lead.pipeline_stage = 'negotiation' THEN
        jsonb_build_array(
          jsonb_build_object('action', 'meeting', 'reason', 'Reunião de fechamento', 'priority', 'urgent'),
          jsonb_build_object('action', 'task', 'reason', 'Preparar contrato', 'priority', 'high')
        )
      -- Default
      ELSE
        jsonb_build_array(
          jsonb_build_object('action', 'note', 'reason', 'Registrar próximos passos', 'priority', 'low'),
          jsonb_build_object('action', 'email', 'reason', 'Manter contato regular', 'priority', 'low')
        )
    END
  );
  
  RETURN v_suggestion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;