
CREATE TABLE IF NOT EXISTS public.pipeline_columns (
  id          text PRIMARY KEY,
  agency_id   uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title       text NOT NULL,
  emoji       text NOT NULL DEFAULT '📋',
  color       text NOT NULL DEFAULT 'bg-slate-500',
  position    integer NOT NULL DEFAULT 0,
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_columns_select_agency" ON public.pipeline_columns
  FOR SELECT USING (agency_id = public.current_agency_id());

CREATE POLICY "pipeline_columns_insert_agency" ON public.pipeline_columns
  FOR INSERT WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "pipeline_columns_update_agency" ON public.pipeline_columns
  FOR UPDATE USING (agency_id = public.current_agency_id())
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "pipeline_columns_delete_agency" ON public.pipeline_columns
  FOR DELETE USING (agency_id = public.current_agency_id());

CREATE INDEX IF NOT EXISTS idx_pipeline_columns_agency
  ON public.pipeline_columns(agency_id, position);

CREATE TRIGGER pipeline_columns_set_updated_at
  BEFORE UPDATE ON public.pipeline_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_columns;
ALTER TABLE public.pipeline_columns REPLICA IDENTITY FULL;

-- Deprecation warning trigger on legacy `clients` table
CREATE OR REPLACE FUNCTION public.warn_clients_deprecated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE WARNING 'INSERT/UPDATE em public.clients (deprecated). Use clients_v2.';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_deprecated_warning ON public.clients;
CREATE TRIGGER clients_deprecated_warning
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.warn_clients_deprecated();

-- Deprecation warning trigger on legacy `commissions_old` table
CREATE OR REPLACE FUNCTION public.warn_commissions_old_deprecated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE WARNING 'INSERT/UPDATE em public.commissions_old (deprecated). Use commissions_v2.';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commissions_old_deprecated_warning ON public.commissions_old;
CREATE TRIGGER commissions_old_deprecated_warning
  BEFORE INSERT OR UPDATE ON public.commissions_old
  FOR EACH ROW EXECUTE FUNCTION public.warn_commissions_old_deprecated();
