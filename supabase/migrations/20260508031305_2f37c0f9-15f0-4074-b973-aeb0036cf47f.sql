CREATE OR REPLACE FUNCTION public.handle_new_agency()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_plan_id uuid;
BEGIN
  SELECT id INTO default_plan_id
  FROM public.plans
  WHERE slug = 'lobao' OR active = true
  ORDER BY CASE WHEN slug = 'lobao' THEN 0 ELSE 1 END
  LIMIT 1;

  INSERT INTO public.agency_limits (agency_id, max_leads, max_clients, max_users, max_recurring_clients, storage_mb)
  VALUES (NEW.id, 1000, 300, 3, 50, 1000)
  ON CONFLICT (agency_id) DO NOTHING;

  INSERT INTO public.agency_usage (agency_id, current_leads, current_clients, current_users, current_recurring_clients, storage_used_mb)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (agency_id) DO NOTHING;

  IF default_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (agency_id, plan_id, status, current_period_start)
    VALUES (NEW.id, default_plan_id, 'active', now())
    ON CONFLICT (agency_id) DO NOTHING;
  END IF;

  INSERT INTO public.agency_onboarding_status (agency_id, completed_steps)
  VALUES (NEW.id, ARRAY[]::text[])
  ON CONFLICT (agency_id) DO NOTHING;

  RETURN NEW;
END;
$function$;