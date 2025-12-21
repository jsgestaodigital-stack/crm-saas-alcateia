-- Adicionar colunas para controle do tour visual
ALTER TABLE public.agency_onboarding_status
ADD COLUMN IF NOT EXISTS ui_tour_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ui_tour_completed_at TIMESTAMPTZ;

-- Atualizar função get_onboarding_status para incluir status do tour
CREATE OR REPLACE FUNCTION public.get_onboarding_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
  _result JSONB;
BEGIN
  SELECT current_agency_id INTO _agency_id FROM profiles WHERE id = auth.uid();
  
  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object(
      'completed_steps', ARRAY[]::TEXT[], 
      'dismissed', false, 
      'completed', false,
      'tour_started', false,
      'tour_completed', false
    );
  END IF;

  SELECT jsonb_build_object(
    'completed_steps', COALESCE(completed_steps, ARRAY[]::TEXT[]),
    'dismissed', dismissed_at IS NOT NULL,
    'completed', completed_at IS NOT NULL,
    'tour_started', ui_tour_started_at IS NOT NULL,
    'tour_completed', ui_tour_completed_at IS NOT NULL
  ) INTO _result
  FROM public.agency_onboarding_status
  WHERE agency_id = _agency_id;

  RETURN COALESCE(_result, jsonb_build_object(
    'completed_steps', ARRAY[]::TEXT[], 
    'dismissed', false, 
    'completed', false,
    'tour_started', false,
    'tour_completed', false
  ));
END;
$$;

-- Função para iniciar o tour visual
CREATE OR REPLACE FUNCTION public.start_visual_tour()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
BEGIN
  SELECT current_agency_id INTO _agency_id FROM profiles WHERE id = auth.uid();
  
  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  INSERT INTO public.agency_onboarding_status (agency_id, ui_tour_started_at)
  VALUES (_agency_id, now())
  ON CONFLICT (agency_id) DO UPDATE
    SET ui_tour_started_at = now(), updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Função para completar o tour visual
CREATE OR REPLACE FUNCTION public.complete_visual_tour()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
BEGIN
  SELECT current_agency_id INTO _agency_id FROM profiles WHERE id = auth.uid();
  
  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  INSERT INTO public.agency_onboarding_status (agency_id, ui_tour_started_at, ui_tour_completed_at)
  VALUES (_agency_id, now(), now())
  ON CONFLICT (agency_id) DO UPDATE
    SET ui_tour_completed_at = now(), updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Função para resetar o tour (admin only)
CREATE OR REPLACE FUNCTION public.reset_visual_tour()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
BEGIN
  SELECT current_agency_id INTO _agency_id FROM profiles WHERE id = auth.uid();
  
  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  UPDATE public.agency_onboarding_status
  SET ui_tour_started_at = NULL, ui_tour_completed_at = NULL, updated_at = now()
  WHERE agency_id = _agency_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.start_visual_tour() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_visual_tour() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_visual_tour() TO authenticated;