-- Fix SECURITY DEFINER views to SECURITY INVOKER
-- This ensures RLS policies of the querying user are enforced

-- Recreate views with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.lead_metrics_by_stage;
DROP VIEW IF EXISTS public.tasks_summary_by_status;
DROP VIEW IF EXISTS public.activities_last_30_days;

-- 1. View: lead_metrics_by_stage (SECURITY INVOKER)
CREATE VIEW public.lead_metrics_by_stage 
WITH (security_invoker = true) AS
SELECT
  pipeline_stage,
  COUNT(*) AS total_leads,
  SUM(CASE WHEN temperature = 'hot' THEN 1 ELSE 0 END) AS hot_leads,
  SUM(CASE WHEN temperature = 'warm' THEN 1 ELSE 0 END) AS warm_leads,
  SUM(CASE WHEN temperature = 'cold' THEN 1 ELSE 0 END) AS cold_leads,
  SUM(estimated_value) AS total_value
FROM public.leads
WHERE agency_id = public.current_agency_id()
GROUP BY pipeline_stage;

-- 2. View: tasks_summary_by_status (SECURITY INVOKER)
CREATE VIEW public.tasks_summary_by_status 
WITH (security_invoker = true) AS
SELECT
  status,
  COUNT(*) AS total_tasks
FROM public.scheduled_tasks
WHERE agency_id = public.current_agency_id()
GROUP BY status;

-- 3. View: activities_last_30_days (SECURITY INVOKER)
CREATE VIEW public.activities_last_30_days 
WITH (security_invoker = true) AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_activities
FROM public.lead_activities
WHERE agency_id = public.current_agency_id()
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;

-- Re-grant permissions
GRANT SELECT ON public.lead_metrics_by_stage TO authenticated;
GRANT SELECT ON public.tasks_summary_by_status TO authenticated;
GRANT SELECT ON public.activities_last_30_days TO authenticated;