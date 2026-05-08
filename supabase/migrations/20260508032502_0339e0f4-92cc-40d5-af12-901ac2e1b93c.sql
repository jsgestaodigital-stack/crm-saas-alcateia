
CREATE OR REPLACE FUNCTION public.validate_current_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate when current_agency_id is changing to a non-null value
  IF NEW.current_agency_id IS NOT NULL
     AND NEW.current_agency_id IS DISTINCT FROM OLD.current_agency_id THEN

    -- Allow super admins to switch freely (impersonation/support)
    IF EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = NEW.id AND p.is_super_admin = true
    ) THEN
      RETURN NEW;
    END IF;

    -- Verify the user is an active member of the target agency
    IF NOT EXISTS (
      SELECT 1
      FROM public.agency_members am
      WHERE am.user_id = NEW.id
        AND am.agency_id = NEW.current_agency_id
        AND COALESCE(am.is_active, true) = true
    ) THEN
      RAISE EXCEPTION 'Você não é membro ativo desta agência.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_current_agency_id_trg ON public.profiles;
CREATE TRIGGER validate_current_agency_id_trg
BEFORE UPDATE OF current_agency_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_current_agency_id();
