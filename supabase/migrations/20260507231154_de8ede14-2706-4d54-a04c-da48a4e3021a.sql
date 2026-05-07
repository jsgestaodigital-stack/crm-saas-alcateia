CREATE OR REPLACE FUNCTION public.warn_clients_v2_deprecated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE WARNING 'INSERT/UPDATE em clients_v2 (deprecated). Use clients.';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_v2_deprecated_warning ON public.clients_v2;
CREATE TRIGGER clients_v2_deprecated_warning
  BEFORE INSERT OR UPDATE ON public.clients_v2
  FOR EACH ROW EXECUTE FUNCTION public.warn_clients_v2_deprecated();