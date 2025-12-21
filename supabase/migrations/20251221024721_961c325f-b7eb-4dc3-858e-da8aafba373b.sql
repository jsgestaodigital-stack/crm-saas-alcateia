-- Tabela para status de onboarding da agência
CREATE TABLE IF NOT EXISTS public.agency_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  dismissed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT agency_onboarding_status_agency_id_key UNIQUE (agency_id)
);

-- Enable RLS
ALTER TABLE public.agency_onboarding_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "agency_onboarding_select" ON public.agency_onboarding_status
  FOR SELECT USING (agency_id = current_agency_id());

CREATE POLICY "agency_onboarding_insert" ON public.agency_onboarding_status
  FOR INSERT WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "agency_onboarding_update" ON public.agency_onboarding_status
  FOR UPDATE USING (agency_id = current_agency_id());

-- Function to mark onboarding step as completed
CREATE OR REPLACE FUNCTION public.mark_onboarding_step_completed(_step TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agency_id UUID;
  _result JSONB;
BEGIN
  -- Get current agency
  SELECT current_agency_id INTO _agency_id FROM profiles WHERE id = auth.uid();
  
  IF _agency_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No agency found');
  END IF;

  -- Insert or update the onboarding status
  INSERT INTO public.agency_onboarding_status (agency_id, completed_steps)
  VALUES (_agency_id, ARRAY[_step])
  ON CONFLICT (agency_id) DO UPDATE
    SET 
      completed_steps = CASE 
        WHEN agency_onboarding_status.completed_steps @> ARRAY[_step] 
        THEN agency_onboarding_status.completed_steps
        ELSE array_append(agency_onboarding_status.completed_steps, _step)
      END,
      updated_at = now();

  -- Check if all steps are completed (7 steps total)
  UPDATE public.agency_onboarding_status
  SET completed_at = now()
  WHERE agency_id = _agency_id 
    AND completed_at IS NULL
    AND array_length(completed_steps, 1) >= 7;

  SELECT jsonb_build_object(
    'success', true,
    'completed_steps', completed_steps,
    'completed_at', completed_at
  ) INTO _result
  FROM public.agency_onboarding_status
  WHERE agency_id = _agency_id;

  RETURN COALESCE(_result, jsonb_build_object('success', true));
END;
$$;

-- Function to dismiss onboarding checklist
CREATE OR REPLACE FUNCTION public.dismiss_onboarding()
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

  INSERT INTO public.agency_onboarding_status (agency_id, dismissed_at)
  VALUES (_agency_id, now())
  ON CONFLICT (agency_id) DO UPDATE
    SET dismissed_at = now(), updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get onboarding status
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
    RETURN jsonb_build_object('completed_steps', ARRAY[]::TEXT[], 'dismissed', false, 'completed', false);
  END IF;

  SELECT jsonb_build_object(
    'completed_steps', COALESCE(completed_steps, ARRAY[]::TEXT[]),
    'dismissed', dismissed_at IS NOT NULL,
    'completed', completed_at IS NOT NULL
  ) INTO _result
  FROM public.agency_onboarding_status
  WHERE agency_id = _agency_id;

  RETURN COALESCE(_result, jsonb_build_object('completed_steps', ARRAY[]::TEXT[], 'dismissed', false, 'completed', false));
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.mark_onboarding_step_completed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_onboarding() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_status() TO authenticated;