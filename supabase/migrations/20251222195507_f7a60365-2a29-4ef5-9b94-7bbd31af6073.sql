-- Create system health logs table
CREATE TABLE public.system_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id),
  user_id UUID,
  user_email TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  route TEXT,
  browser TEXT,
  device TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_health_logs_agency ON public.system_health_logs(agency_id);
CREATE INDEX idx_health_logs_created ON public.system_health_logs(created_at DESC);
CREATE INDEX idx_health_logs_severity ON public.system_health_logs(severity) WHERE resolved = false;
CREATE INDEX idx_health_logs_unresolved ON public.system_health_logs(resolved) WHERE resolved = false;

-- Enable RLS
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs for their agency
CREATE POLICY "Admins can view agency health logs" 
ON public.system_health_logs 
FOR SELECT 
USING (
  agency_id IN (
    SELECT am.agency_id FROM public.agency_members am 
    WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
  )
);

-- Admins can update (resolve) logs
CREATE POLICY "Admins can resolve health logs" 
ON public.system_health_logs 
FOR UPDATE 
USING (
  agency_id IN (
    SELECT am.agency_id FROM public.agency_members am 
    WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
  )
);

-- Create aggregated health summary view
CREATE OR REPLACE VIEW public.system_health_summary AS
SELECT 
  agency_id,
  COUNT(*) FILTER (WHERE resolved = false) as unresolved_count,
  COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE resolved = false AND severity = 'error') as error_count,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as last_24h_count,
  COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour') as last_hour_count,
  MAX(created_at) as last_error_at
FROM public.system_health_logs
GROUP BY agency_id;

-- Add comment
COMMENT ON TABLE public.system_health_logs IS 'Stores frontend and backend error logs for system health monitoring';