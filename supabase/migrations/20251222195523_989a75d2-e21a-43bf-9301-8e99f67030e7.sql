-- Drop the view that has security issues
DROP VIEW IF EXISTS public.system_health_summary;

-- Create a secure function instead (with search_path set)
CREATE OR REPLACE FUNCTION public.get_health_summary()
RETURNS TABLE (
  unresolved_count BIGINT,
  critical_count BIGINT,
  error_count BIGINT,
  last_24h_count BIGINT,
  last_hour_count BIGINT,
  last_error_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE resolved = false) as unresolved_count,
    COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE resolved = false AND severity = 'error') as error_count,
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as last_24h_count,
    COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour') as last_hour_count,
    MAX(created_at) as last_error_at
  FROM public.system_health_logs
  WHERE agency_id IN (
    SELECT am.agency_id FROM public.agency_members am 
    WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
  );
$$;