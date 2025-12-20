-- =============================================
-- ETAPA 6.2 e 6.3 – FUNÇÕES DE IA PARA COPILOTO
-- =============================================

-- Função: Gerar resumo do lead
CREATE OR REPLACE FUNCTION public.generate_lead_summary(
  _lead_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prompt TEXT;
  v_lead RECORD;
BEGIN
  -- Buscar dados do lead
  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id;
  
  IF v_lead IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Montar prompt com base no lead
  v_prompt := 'Resuma o seguinte lead de forma concisa:' || E'\n' ||
    'Empresa: ' || COALESCE(v_lead.company_name, 'N/A') || E'\n' ||
    'Contato: ' || COALESCE(v_lead.contact_name, 'N/A') || E'\n' ||
    'Email: ' || COALESCE(v_lead.email, 'N/A') || E'\n' ||
    'Telefone: ' || COALESCE(v_lead.phone, 'N/A') || E'\n' ||
    'WhatsApp: ' || COALESCE(v_lead.whatsapp, 'N/A') || E'\n' ||
    'Cidade: ' || COALESCE(v_lead.city, 'N/A') || E'\n' ||
    'Categoria: ' || COALESCE(v_lead.main_category, 'N/A') || E'\n' ||
    'Temperatura: ' || COALESCE(v_lead.temperature::TEXT, 'N/A') || E'\n' ||
    'Estágio: ' || COALESCE(v_lead.pipeline_stage::TEXT, 'N/A') || E'\n' ||
    'Valor Estimado: ' || COALESCE(v_lead.estimated_value::TEXT, 'N/A') || E'\n' ||
    'Notas: ' || COALESCE(v_lead.notes, 'Sem notas');

  RETURN v_prompt;
END;
$$;

-- Função: Montar prompt para sugestão de próxima ação
CREATE OR REPLACE FUNCTION public.build_suggestion_prompt(
  _lead_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prompt TEXT;
  v_lead RECORD;
  v_messages TEXT;
  v_activities TEXT;
BEGIN
  -- Buscar dados do lead
  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id;
  
  IF v_lead IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Buscar últimas mensagens
  SELECT STRING_AGG(
    '[' || TO_CHAR(m.created_at, 'DD/MM HH24:MI') || '] ' || m.user_name || ': ' || m.message, 
    E'\n'
  ) INTO v_messages
  FROM (
    SELECT * FROM public.lead_messages 
    WHERE lead_id = _lead_id 
    ORDER BY created_at DESC 
    LIMIT 10
  ) m;

  -- Buscar últimas atividades
  SELECT STRING_AGG(
    '[' || TO_CHAR(a.created_at, 'DD/MM HH24:MI') || '] ' || a.type::TEXT || ': ' || a.content, 
    E'\n'
  ) INTO v_activities
  FROM (
    SELECT * FROM public.lead_activities 
    WHERE lead_id = _lead_id 
    ORDER BY created_at DESC 
    LIMIT 5
  ) a;

  -- Montar prompt
  v_prompt := 'Analise o lead e sugira a próxima melhor ação comercial:' || E'\n\n' ||
    '== DADOS DO LEAD ==' || E'\n' ||
    'Empresa: ' || COALESCE(v_lead.company_name, 'N/A') || E'\n' ||
    'Contato: ' || COALESCE(v_lead.contact_name, 'N/A') || E'\n' ||
    'Temperatura: ' || COALESCE(v_lead.temperature::TEXT, 'frio') || E'\n' ||
    'Estágio: ' || COALESCE(v_lead.pipeline_stage::TEXT, 'cold') || E'\n' ||
    'Próxima Ação Planejada: ' || COALESCE(v_lead.next_action, 'Nenhuma') || E'\n' ||
    'Data Próxima Ação: ' || COALESCE(TO_CHAR(v_lead.next_action_date, 'DD/MM/YYYY'), 'N/A') || E'\n\n';

  IF v_messages IS NOT NULL THEN
    v_prompt := v_prompt || '== ÚLTIMAS MENSAGENS ==' || E'\n' || v_messages || E'\n\n';
  END IF;

  IF v_activities IS NOT NULL THEN
    v_prompt := v_prompt || '== ÚLTIMAS ATIVIDADES ==' || E'\n' || v_activities || E'\n\n';
  END IF;

  v_prompt := v_prompt || 'Com base nessas informações, sugira a próxima ação específica e objetiva para avançar este lead no funil de vendas.';

  RETURN v_prompt;
END;
$$;

-- Função: Salvar interação de IA
CREATE OR REPLACE FUNCTION public.save_ai_interaction(
  _lead_id UUID,
  _interaction_type TEXT,
  _prompt TEXT,
  _ai_response TEXT,
  _model TEXT DEFAULT 'google/gemini-2.5-flash',
  _tokens_used INTEGER DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_agency_id UUID;
BEGIN
  -- Buscar agency do lead
  SELECT agency_id INTO v_agency_id FROM public.leads WHERE id = _lead_id;
  
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  INSERT INTO public.lead_ai_interactions (
    lead_id,
    agency_id,
    user_id,
    interaction_type,
    prompt,
    ai_response,
    model,
    tokens_used,
    metadata
  )
  VALUES (
    _lead_id,
    v_agency_id,
    auth.uid(),
    _interaction_type,
    _prompt,
    _ai_response,
    _model,
    _tokens_used,
    _metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;