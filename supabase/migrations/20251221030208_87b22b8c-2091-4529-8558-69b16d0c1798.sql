-- Tabela de eventos de ativação
CREATE TABLE IF NOT EXISTS public.activation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT activation_events_user_event_unique UNIQUE(user_id, event_type)
);

-- Enable RLS
ALTER TABLE public.activation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "activation_events_insert_own" ON public.activation_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "activation_events_select_own" ON public.activation_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activation_events_admin_select" ON public.activation_events
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    (agency_id = current_agency_id() AND is_admin(auth.uid()))
  );

-- Tabela de respostas NPS
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT nps_responses_user_unique UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "nps_insert_own" ON public.nps_responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "nps_update_own" ON public.nps_responses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "nps_select_own" ON public.nps_responses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "nps_admin_select" ON public.nps_responses
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    (agency_id = current_agency_id() AND is_admin(auth.uid()))
  );

-- Função para registrar evento de ativação
CREATE OR REPLACE FUNCTION public.log_activation_event(_event TEXT, _metadata JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _agency_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT current_agency_id INTO _agency_id FROM public.profiles WHERE id = _user_id;

  IF _agency_id IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  INSERT INTO public.activation_events (user_id, agency_id, event_type, metadata)
  VALUES (_user_id, _agency_id, _event, _metadata)
  ON CONFLICT (user_id, event_type) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'event', _event);
END;
$$;

-- Função para obter status de ativação do usuário
CREATE OR REPLACE FUNCTION public.get_activation_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _events TEXT[];
  _count INT;
  _created_at TIMESTAMPTZ;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('events', ARRAY[]::TEXT[], 'count', 0, 'days_since_signup', 0);
  END IF;

  SELECT array_agg(event_type) INTO _events
  FROM public.activation_events
  WHERE user_id = _user_id;

  SELECT created_at INTO _created_at
  FROM public.profiles
  WHERE id = _user_id;

  RETURN jsonb_build_object(
    'events', COALESCE(_events, ARRAY[]::TEXT[]),
    'count', COALESCE(array_length(_events, 1), 0),
    'days_since_signup', EXTRACT(DAY FROM (now() - COALESCE(_created_at, now())))::INT
  );
END;
$$;

-- Função para verificar se deve mostrar NPS
CREATE OR REPLACE FUNCTION public.should_show_nps()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _activation_count INT;
  _days_since_signup INT;
  _has_responded BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('show', false);
  END IF;

  -- Check if already responded
  SELECT EXISTS(SELECT 1 FROM public.nps_responses WHERE user_id = _user_id) INTO _has_responded;
  
  IF _has_responded THEN
    RETURN jsonb_build_object('show', false, 'reason', 'already_responded');
  END IF;

  -- Get activation count
  SELECT COUNT(*) INTO _activation_count
  FROM public.activation_events
  WHERE user_id = _user_id;

  -- Get days since signup
  SELECT EXTRACT(DAY FROM (now() - created_at))::INT INTO _days_since_signup
  FROM public.profiles
  WHERE id = _user_id;

  -- Show NPS if user has 7+ days and 3+ activation events
  IF _days_since_signup >= 7 AND _activation_count >= 3 THEN
    RETURN jsonb_build_object('show', true, 'activation_count', _activation_count, 'days', _days_since_signup);
  END IF;

  RETURN jsonb_build_object('show', false, 'activation_count', _activation_count, 'days', COALESCE(_days_since_signup, 0));
END;
$$;

-- Função para submeter NPS
CREATE OR REPLACE FUNCTION public.submit_nps(_score INT, _feedback TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _agency_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF _score < 0 OR _score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid score');
  END IF;

  SELECT current_agency_id INTO _agency_id FROM public.profiles WHERE id = _user_id;

  IF _agency_id IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  INSERT INTO public.nps_responses (user_id, agency_id, score, feedback)
  VALUES (_user_id, _agency_id, _score, _feedback)
  ON CONFLICT (user_id) DO UPDATE
    SET score = _score, feedback = _feedback, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Função para obter estatísticas de ativação (admin)
CREATE OR REPLACE FUNCTION public.get_activation_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
  _result JSONB;
BEGIN
  SELECT current_agency_id INTO _agency_id FROM public.profiles WHERE id = auth.uid();

  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No agency found');
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM public.agency_members WHERE agency_id = _agency_id),
    'events_by_type', (
      SELECT jsonb_object_agg(event_type, count)
      FROM (
        SELECT event_type, COUNT(*) as count
        FROM public.activation_events
        WHERE agency_id = _agency_id
        GROUP BY event_type
      ) sub
    ),
    'nps_stats', (
      SELECT jsonb_build_object(
        'total_responses', COUNT(*),
        'average_score', ROUND(AVG(score)::numeric, 1),
        'promoters', COUNT(*) FILTER (WHERE score >= 9),
        'passives', COUNT(*) FILTER (WHERE score >= 7 AND score < 9),
        'detractors', COUNT(*) FILTER (WHERE score < 7),
        'nps_score', ROUND(
          ((COUNT(*) FILTER (WHERE score >= 9)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100) -
          ((COUNT(*) FILTER (WHERE score < 7)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100)
        )
      )
      FROM public.nps_responses
      WHERE agency_id = _agency_id
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.log_activation_event(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activation_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_show_nps() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_nps(INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activation_stats() TO authenticated;