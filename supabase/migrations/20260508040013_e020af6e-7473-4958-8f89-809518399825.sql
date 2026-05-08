CREATE TABLE IF NOT EXISTS public.production_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  component TEXT,
  user_id UUID,
  agency_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read production errors"
  ON public.production_errors
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert errors"
  ON public.production_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anonymous can insert errors"
  ON public.production_errors
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_production_errors_created_at
  ON public.production_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_errors_type
  ON public.production_errors (error_type);
CREATE INDEX IF NOT EXISTS idx_production_errors_agency
  ON public.production_errors (agency_id);
CREATE INDEX IF NOT EXISTS idx_production_errors_user
  ON public.production_errors (user_id);