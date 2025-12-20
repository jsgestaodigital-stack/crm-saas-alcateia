-- =============================================
-- BLOCO 10 – INFRAESTRUTURA DE NOTIFICAÇÕES
-- =============================================

-- 10.1 – Enum para tipos de notificação
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'task_due', 'task_overdue', 'lead_stale', 'lead_activity', 
    'ai_insight', 'team_mention', 'system', 'reminder'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para canais de notificação
DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'push', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para prioridade de notificação
DO $$ BEGIN
  CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10.1 – Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'system',
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  -- Referências opcionais
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.scheduled_tasks(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  -- Estados
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_agency ON public.notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (agency_id = public.current_agency_id() OR EXISTS (
  SELECT 1 FROM public.agency_members WHERE user_id = auth.uid() AND agency_id = public.notifications.agency_id
));

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- Habilitar Realtime para notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 10.2 – Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  -- Preferências por tipo
  task_due_enabled BOOLEAN DEFAULT true,
  task_overdue_enabled BOOLEAN DEFAULT true,
  lead_stale_enabled BOOLEAN DEFAULT true,
  lead_activity_enabled BOOLEAN DEFAULT true,
  ai_insight_enabled BOOLEAN DEFAULT true,
  team_mention_enabled BOOLEAN DEFAULT true,
  -- Preferências por canal
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  -- Horários de silêncio
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  -- Frequência de resumo por email
  email_digest_frequency TEXT DEFAULT 'daily', -- daily, weekly, none
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para preferências
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid());

-- Trigger para set agency_id
CREATE OR REPLACE FUNCTION public.notification_preferences_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notification_preferences_set_agency_id_trigger
BEFORE INSERT ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.notification_preferences_set_agency_id();

-- 10.2 – Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type public.notification_type,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_priority public.notification_priority DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}',
  p_lead_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_channel public.notification_channel DEFAULT 'in_app'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_agency_id UUID;
  v_prefs RECORD;
BEGIN
  -- Buscar agency do usuário
  SELECT current_agency_id INTO v_agency_id FROM public.profiles WHERE id = p_user_id;
  IF v_agency_id IS NULL THEN
    v_agency_id := public.current_agency_id();
  END IF;
  
  -- Verificar preferências do usuário
  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = p_user_id;
  
  -- Verificar se tipo está habilitado
  IF v_prefs IS NOT NULL THEN
    IF p_type = 'task_due' AND NOT v_prefs.task_due_enabled THEN RETURN NULL; END IF;
    IF p_type = 'task_overdue' AND NOT v_prefs.task_overdue_enabled THEN RETURN NULL; END IF;
    IF p_type = 'lead_stale' AND NOT v_prefs.lead_stale_enabled THEN RETURN NULL; END IF;
    IF p_type = 'lead_activity' AND NOT v_prefs.lead_activity_enabled THEN RETURN NULL; END IF;
    IF p_type = 'ai_insight' AND NOT v_prefs.ai_insight_enabled THEN RETURN NULL; END IF;
    IF p_type = 'team_mention' AND NOT v_prefs.team_mention_enabled THEN RETURN NULL; END IF;
  END IF;

  -- Criar notificação
  INSERT INTO public.notifications (
    agency_id, user_id, type, channel, priority,
    title, message, metadata, lead_id, task_id, client_id
  )
  VALUES (
    v_agency_id, p_user_id, p_type, p_channel, p_priority,
    p_title, p_message, p_metadata, p_lead_id, p_task_id, p_client_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 10.3 – Função de verificação e geração automática de notificações
CREATE OR REPLACE FUNCTION public.check_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_lead RECORD;
  v_overdue_count INT := 0;
  v_stale_count INT := 0;
  v_due_soon_count INT := 0;
BEGIN
  -- 1. Marcar tarefas atrasadas e criar notificações
  FOR v_task IN 
    SELECT t.id, t.title, t.user_id, t.agency_id, t.lead_id
    FROM public.scheduled_tasks t
    WHERE t.status = 'pending'
      AND t.due_date < now()
  LOOP
    -- Atualizar status
    UPDATE public.scheduled_tasks SET status = 'overdue' WHERE id = v_task.id;
    
    -- Criar notificação se não existir uma recente
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE task_id = v_task.id 
        AND type = 'task_overdue'
        AND created_at > now() - INTERVAL '24 hours'
    ) THEN
      PERFORM public.create_notification(
        v_task.user_id,
        'task_overdue',
        'Tarefa atrasada: ' || v_task.title,
        'Esta tarefa passou da data de vencimento.',
        'high',
        jsonb_build_object('task_id', v_task.id),
        v_task.lead_id,
        v_task.id,
        NULL
      );
      v_overdue_count := v_overdue_count + 1;
    END IF;
  END LOOP;

  -- 2. Tarefas que vencem em 24h
  FOR v_task IN 
    SELECT t.id, t.title, t.user_id, t.agency_id, t.lead_id, t.due_date
    FROM public.scheduled_tasks t
    WHERE t.status = 'pending'
      AND t.due_date BETWEEN now() AND now() + INTERVAL '24 hours'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE task_id = v_task.id 
        AND type = 'task_due'
        AND created_at > now() - INTERVAL '12 hours'
    ) THEN
      PERFORM public.create_notification(
        v_task.user_id,
        'task_due',
        'Tarefa vence em breve: ' || v_task.title,
        'Vencimento: ' || TO_CHAR(v_task.due_date, 'DD/MM às HH24:MI'),
        'normal',
        jsonb_build_object('task_id', v_task.id, 'due_date', v_task.due_date),
        v_task.lead_id,
        v_task.id,
        NULL
      );
      v_due_soon_count := v_due_soon_count + 1;
    END IF;
  END LOOP;

  -- 3. Leads sem atividade há mais de 7 dias
  FOR v_lead IN 
    SELECT l.id, l.company_name, l.responsible, l.agency_id, l.last_activity_at,
           am.user_id
    FROM public.leads l
    JOIN public.agency_members am ON am.agency_id = l.agency_id
    JOIN public.profiles p ON p.id = am.user_id AND p.full_name = l.responsible
    WHERE l.status = 'active'
      AND l.last_activity_at < now() - INTERVAL '7 days'
      AND l.pipeline_stage NOT IN ('won', 'lost')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE lead_id = v_lead.id 
        AND type = 'lead_stale'
        AND created_at > now() - INTERVAL '3 days'
    ) THEN
      PERFORM public.create_notification(
        v_lead.user_id,
        'lead_stale',
        'Lead sem atividade: ' || v_lead.company_name,
        'Sem atividades há ' || EXTRACT(DAY FROM now() - v_lead.last_activity_at)::INT || ' dias.',
        'normal',
        jsonb_build_object('lead_id', v_lead.id, 'last_activity', v_lead.last_activity_at),
        v_lead.id,
        NULL,
        NULL
      );
      v_stale_count := v_stale_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'overdue_notifications', v_overdue_count,
    'due_soon_notifications', v_due_soon_count,
    'stale_lead_notifications', v_stale_count,
    'checked_at', now()
  );
END;
$$;

-- 10.3 – Funções auxiliares de notificações
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
  RETURN v_count;
END;
$$;

-- 10.4 – Tabela para fila de emails
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_id TEXT,
  template_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  priority INT DEFAULT 5,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ DEFAULT now()
);

-- Índices para fila de emails
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_agency ON public.email_queue(agency_id);

-- RLS para email_queue (apenas sistema pode gerenciar)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view email queue"
ON public.email_queue FOR SELECT
USING (agency_id = public.current_agency_id());

-- 10.4 – Função para enfileirar email
CREATE OR REPLACE FUNCTION public.queue_email(
  p_recipient_email TEXT,
  p_subject TEXT,
  p_body_html TEXT DEFAULT NULL,
  p_body_text TEXT DEFAULT NULL,
  p_template_id TEXT DEFAULT NULL,
  p_template_data JSONB DEFAULT '{}',
  p_recipient_name TEXT DEFAULT NULL,
  p_notification_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_id UUID;
  v_agency_id UUID;
BEGIN
  v_agency_id := public.current_agency_id();
  
  INSERT INTO public.email_queue (
    agency_id, recipient_email, recipient_name, subject,
    body_html, body_text, template_id, template_data,
    notification_id, scheduled_for
  )
  VALUES (
    v_agency_id, p_recipient_email, p_recipient_name, p_subject,
    p_body_html, p_body_text, p_template_id, p_template_data,
    p_notification_id, p_scheduled_for
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;