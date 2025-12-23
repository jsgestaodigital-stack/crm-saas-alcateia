-- Fix security definer view by dropping and recreating as invoker
DROP VIEW IF EXISTS public.user_engagement_scores;

-- Recreate with security_invoker property
CREATE VIEW public.user_engagement_scores 
WITH (security_invoker = on) AS
SELECT 
  ue.user_id,
  ue.agency_id,
  COUNT(DISTINCT ue.id) as total_events,
  SUM(ue.weight) as total_score,
  COUNT(DISTINCT DATE(ue.created_at)) as active_days,
  COUNT(CASE WHEN ue.event_category = 'navigation' THEN 1 END) as navigation_events,
  COUNT(CASE WHEN ue.event_category = 'crud' THEN 1 END) as crud_events,
  COUNT(CASE WHEN ue.event_category = 'feature' THEN 1 END) as feature_events,
  MAX(ue.created_at) as last_activity,
  MIN(ue.created_at) as first_activity,
  a.name as agency_name,
  p.full_name as user_name
FROM public.user_engagement_events ue
JOIN public.agencies a ON a.id = ue.agency_id
LEFT JOIN public.profiles p ON p.id = ue.user_id
GROUP BY ue.user_id, ue.agency_id, a.name, p.full_name;