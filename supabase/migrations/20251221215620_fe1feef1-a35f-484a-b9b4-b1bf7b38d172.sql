-- Create RPC function to unmark onboarding step
CREATE OR REPLACE FUNCTION public.unmark_onboarding_step(_step text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _agency_id uuid;
BEGIN
  -- Get current agency for user
  SELECT agency_id INTO _agency_id 
  FROM public.agency_members 
  WHERE user_id = _user_id 
  LIMIT 1;
  
  IF _agency_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remove step from completed_steps array
  UPDATE public.agency_onboarding_status
  SET 
    completed_steps = array_remove(completed_steps, _step),
    updated_at = now(),
    completed_at = NULL -- Reset completion if unmarking
  WHERE agency_id = _agency_id;
  
  RETURN true;
END;
$$;