
-- Trigger to prevent non-super-admin from modifying alcateia_member fields
CREATE OR REPLACE FUNCTION public.protect_alcateia_member_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.alcateia_member IS DISTINCT FROM OLD.alcateia_member)
     OR (NEW.alcateia_member_since IS DISTINCT FROM OLD.alcateia_member_since) THEN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permissão negada: apenas super admins podem alterar acesso Alcateia';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_alcateia_member_fields_trg ON public.profiles;
CREATE TRIGGER protect_alcateia_member_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_alcateia_member_fields();

-- RPC for super admin to set alcateia membership
CREATE OR REPLACE FUNCTION public.set_alcateia_member(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  UPDATE public.profiles
  SET
    alcateia_member = new_value,
    alcateia_member_since = CASE WHEN new_value THEN now() ELSE NULL END
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_alcateia_member(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.set_alcateia_member(uuid, boolean) TO authenticated;
