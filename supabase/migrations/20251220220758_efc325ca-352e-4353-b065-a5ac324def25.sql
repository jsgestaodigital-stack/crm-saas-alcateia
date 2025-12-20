-- =============================================
-- ETAPA 5.1 – COMUNICAÇÃO COM LEADS
-- =============================================

-- 1. Criar tabela de mensagens por lead
CREATE TABLE IF NOT EXISTS public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'note', -- note | interaction | system
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead ON public.lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_agency ON public.lead_messages(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_created ON public.lead_messages(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_messages FORCE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
CREATE POLICY "Members can view messages from own agency"
  ON public.lead_messages FOR SELECT
  USING (
    agency_id = public.current_agency_id()
    AND public.can_access_agency(agency_id, auth.uid())
  );

CREATE POLICY "Members can insert messages"
  ON public.lead_messages FOR INSERT
  WITH CHECK (
    agency_id = public.current_agency_id()
    AND public.can_access_agency(agency_id, auth.uid())
  );

CREATE POLICY "Members can update own messages"
  ON public.lead_messages FOR UPDATE
  USING (
    agency_id = public.current_agency_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "Members can delete own messages"
  ON public.lead_messages FOR DELETE
  USING (
    agency_id = public.current_agency_id()
    AND user_id = auth.uid()
  );

-- 5. Trigger para set agency_id automaticamente
CREATE OR REPLACE FUNCTION public.lead_messages_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency UUID;
  v_user_name TEXT;
BEGIN
  -- Get agency from lead
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
    RAISE EXCEPTION 'No agency found for lead message';
  END IF;
  
  -- Set user name
  IF NEW.user_id IS NOT NULL AND NEW.user_name = '' THEN
    SELECT full_name INTO v_user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    NEW.user_name := COALESCE(v_user_name, 'Sistema');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_messages_set_agency_id_trigger
  BEFORE INSERT ON public.lead_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_messages_set_agency_id();

-- 6. Trigger de atualização de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_messages_updated_at
  BEFORE UPDATE ON public.lead_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Função para registrar mensagem e auditar
CREATE OR REPLACE FUNCTION public.log_lead_message(
  _lead_id UUID,
  _message TEXT,
  _message_type TEXT DEFAULT 'note',
  _is_private BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
  v_user_name TEXT;
  v_id UUID;
BEGIN
  -- Buscar agência do lead
  SELECT agency_id INTO v_agency_id
  FROM public.leads
  WHERE id = _lead_id;
  
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Inserir mensagem
  INSERT INTO public.lead_messages (
    lead_id, agency_id, user_id, user_name, message, message_type, is_private
  )
  VALUES (
    _lead_id, v_agency_id, auth.uid(), COALESCE(v_user_name, 'Sistema'), _message, _message_type, _is_private
  )
  RETURNING id INTO v_id;

  -- Registrar log de ação
  PERFORM public.log_action(
    'add_message',
    'lead',
    _lead_id::TEXT,
    NULL,
    NULL,
    jsonb_build_object('message', _message, 'type', _message_type),
    NULL
  );

  RETURN v_id;
END;
$$;