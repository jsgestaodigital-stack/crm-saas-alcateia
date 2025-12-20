-- =============================================
-- BLOCO 9 – DASHBOARDS E MÉTRICAS
-- =============================================

-- 1. View: lead_metrics_by_stage
CREATE OR REPLACE VIEW public.lead_metrics_by_stage AS
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

-- 2. View: tasks_summary_by_status
CREATE OR REPLACE VIEW public.tasks_summary_by_status AS
SELECT
  status,
  COUNT(*) AS total_tasks
FROM public.scheduled_tasks
WHERE agency_id = public.current_agency_id()
GROUP BY status;

-- 3. View: activities_last_30_days
CREATE OR REPLACE VIEW public.activities_last_30_days AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_activities
FROM public.lead_activities
WHERE agency_id = public.current_agency_id()
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;

-- 4. Function: dashboard_summary()
CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leads_total INT;
  v_tasks_pending INT;
  v_last_7_days_activities INT;
  v_hot_leads INT;
BEGIN
  SELECT COUNT(*) INTO v_leads_total
  FROM public.leads
  WHERE agency_id = public.current_agency_id();

  SELECT COUNT(*) INTO v_tasks_pending
  FROM public.scheduled_tasks
  WHERE agency_id = public.current_agency_id()
    AND status = 'pending';

  SELECT COUNT(*) INTO v_last_7_days_activities
  FROM public.lead_activities
  WHERE agency_id = public.current_agency_id()
    AND created_at >= NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_hot_leads
  FROM public.leads
  WHERE agency_id = public.current_agency_id()
    AND temperature = 'hot';

  RETURN jsonb_build_object(
    'total_leads', v_leads_total,
    'pending_tasks', v_tasks_pending,
    'activities_last_7_days', v_last_7_days_activities,
    'hot_leads', v_hot_leads
  );
END;
$$;

-- 5. Permissões
GRANT SELECT ON public.lead_metrics_by_stage TO authenticated;
GRANT SELECT ON public.tasks_summary_by_status TO authenticated;
GRANT SELECT ON public.activities_last_30_days TO authenticated;