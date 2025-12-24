-- Fix questions_set_agency_id function that references non-existent lead_id column
CREATE OR REPLACE FUNCTION public.questions_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency uuid;
  v_client_uuid uuid;
BEGIN
  -- Get agency from client_id if available
  IF NEW.agency_id IS NULL AND NEW.client_id IS NOT NULL THEN
    BEGIN
      v_client_uuid := public.try_uuid(NEW.client_id::text);
    EXCEPTION WHEN others THEN
      v_client_uuid := NULL;
    END;

    IF v_client_uuid IS NOT NULL THEN
      SELECT c.agency_id INTO v_agency
      FROM public.clients c
      WHERE c.id = v_client_uuid
      LIMIT 1;

      IF v_agency IS NOT NULL THEN
        NEW.agency_id := v_agency;
      END IF;
    END IF;
  END IF;

  -- Fallback: current agency context
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;

  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No current agency selected for this user (questions)';
  END IF;

  RETURN NEW;
END;
$$;

-- Also fix enforce_questions_agency_from_parent that references lead_id
CREATE OR REPLACE FUNCTION public.enforce_questions_agency_from_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
  a_client uuid;
BEGIN
  -- Only use client_id - questions table doesn't have lead_id
  cid := public.try_uuid(to_jsonb(NEW)->>'client_id');
  
  IF cid IS NOT NULL THEN
    SELECT c.agency_id INTO a_client FROM public.clients c WHERE c.id = cid LIMIT 1;
  END IF;
  
  IF a_client IS NOT NULL THEN
    IF NEW.agency_id IS NULL THEN
      NEW.agency_id := a_client;
    ELSIF NEW.agency_id <> a_client THEN
      RAISE EXCEPTION 'Tenant mismatch: questions.agency_id (%) must match client agency_id (%)', NEW.agency_id, a_client;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;