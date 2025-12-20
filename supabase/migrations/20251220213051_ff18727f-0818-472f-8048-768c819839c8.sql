
-- Funções para gerenciamento de planos e assinaturas

-- 1. Função para obter features da agência
CREATE OR REPLACE FUNCTION public.get_agency_features(_agency_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE agency_id = _agency_id;
  
  IF v_sub IS NULL THEN
    RETURN jsonb_build_object(
      'has_subscription', false,
      'status', 'none',
      'features', '{}'::jsonb,
      'limits', jsonb_build_object('max_users', 1, 'max_leads', 50, 'max_clients', 10)
    );
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id;

  IF v_sub.status = 'trial' AND v_sub.trial_ends_at < now() THEN
    RETURN jsonb_build_object(
      'has_subscription', true,
      'status', 'expired',
      'message', 'Trial expirado',
      'features', '{}'::jsonb,
      'limits', jsonb_build_object('max_users', 1, 'max_leads', 0, 'max_clients', 0)
    );
  END IF;

  IF v_sub.status IN ('expired', 'cancelled') THEN
    RETURN jsonb_build_object(
      'has_subscription', true,
      'status', v_sub.status,
      'features', '{}'::jsonb,
      'limits', jsonb_build_object('max_users', 1, 'max_leads', 0, 'max_clients', 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'status', v_sub.status,
    'plan_name', v_plan.name,
    'plan_id', v_plan.id,
    'trial_ends_at', v_sub.trial_ends_at,
    'current_period_end', v_sub.current_period_end,
    'features', v_plan.features,
    'limits', jsonb_build_object(
      'max_users', v_plan.max_users,
      'max_leads', v_plan.max_leads,
      'max_clients', v_plan.max_clients,
      'max_recurring_clients', v_plan.max_recurring_clients,
      'storage_mb', v_plan.storage_mb
    )
  );
END;
$$;

-- 2. Função para sincronizar limites
CREATE OR REPLACE FUNCTION public.sync_agency_limits_from_plan(_agency_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE agency_id = _agency_id;
  IF v_sub IS NULL THEN RETURN; END IF;

  SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id;
  IF v_plan IS NULL THEN RETURN; END IF;

  INSERT INTO public.agency_limits (agency_id, max_users, max_leads, max_clients, max_recurring_clients, storage_mb, features)
  VALUES (_agency_id, v_plan.max_users, v_plan.max_leads, v_plan.max_clients, v_plan.max_recurring_clients, v_plan.storage_mb, v_plan.features)
  ON CONFLICT (agency_id) DO UPDATE SET
    max_users = v_plan.max_users,
    max_leads = v_plan.max_leads,
    max_clients = v_plan.max_clients,
    max_recurring_clients = v_plan.max_recurring_clients,
    storage_mb = v_plan.storage_mb,
    features = v_plan.features,
    updated_at = now();
END;
$$;

-- 3. Função para criar trial
CREATE OR REPLACE FUNCTION public.create_trial_subscription(_agency_id UUID, _plan_slug TEXT DEFAULT 'starter')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_sub_id UUID;
BEGIN
  SELECT * INTO v_plan FROM public.plans WHERE slug = _plan_slug AND active = true;
  IF v_plan IS NULL THEN
    SELECT * INTO v_plan FROM public.plans WHERE active = true ORDER BY sort_order LIMIT 1;
  END IF;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'No active plan found'; END IF;

  INSERT INTO public.subscriptions (agency_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
  VALUES (_agency_id, v_plan.id, 'trial', now() + (v_plan.trial_days || ' days')::interval, now(), now() + (v_plan.trial_days || ' days')::interval)
  ON CONFLICT (agency_id) DO UPDATE SET plan_id = v_plan.id, status = 'trial', trial_ends_at = now() + (v_plan.trial_days || ' days')::interval, updated_at = now()
  RETURNING id INTO v_sub_id;

  PERFORM public.sync_agency_limits_from_plan(_agency_id);
  RETURN v_sub_id;
END;
$$;

-- 4. Função para atualizar expirados
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_temp INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.subscriptions SET status = 'expired', updated_at = now()
    WHERE status = 'trial' AND trial_ends_at < now() RETURNING 1
  )
  SELECT COUNT(*) INTO v_temp FROM updated;
  v_count := v_count + v_temp;

  WITH updated AS (
    UPDATE public.subscriptions SET status = 'past_due', updated_at = now()
    WHERE status = 'active' AND current_period_end < now() RETURNING 1
  )
  SELECT COUNT(*) INTO v_temp FROM updated;
  v_count := v_count + v_temp;

  RETURN v_count;
END;
$$;

-- 5. Função para mudar plano
CREATE OR REPLACE FUNCTION public.change_agency_plan(_agency_id UUID, _new_plan_id UUID, _new_status TEXT DEFAULT NULL, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_sub RECORD;
  v_new_plan RECORD;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Only super admin can change plans'; END IF;

  SELECT * INTO v_old_sub FROM public.subscriptions WHERE agency_id = _agency_id;
  SELECT * INTO v_new_plan FROM public.plans WHERE id = _new_plan_id;
  IF v_new_plan IS NULL THEN RAISE EXCEPTION 'Plan not found'; END IF;

  IF v_old_sub IS NULL THEN
    INSERT INTO public.subscriptions (agency_id, plan_id, status, current_period_start, current_period_end)
    VALUES (_agency_id, _new_plan_id, COALESCE(_new_status, 'active'), now(), now() + interval '30 days');
  ELSE
    INSERT INTO public.subscription_history (subscription_id, agency_id, old_plan_id, new_plan_id, old_status, new_status, changed_by, reason)
    VALUES (v_old_sub.id, _agency_id, v_old_sub.plan_id, _new_plan_id, v_old_sub.status, COALESCE(_new_status, v_old_sub.status), auth.uid(), _reason);

    UPDATE public.subscriptions SET 
      plan_id = _new_plan_id,
      status = COALESCE(_new_status, status),
      current_period_start = CASE WHEN _new_status = 'active' THEN now() ELSE current_period_start END,
      current_period_end = CASE WHEN _new_status = 'active' THEN now() + interval '30 days' ELSE current_period_end END,
      updated_at = now()
    WHERE agency_id = _agency_id;
  END IF;

  PERFORM public.sync_agency_limits_from_plan(_agency_id);

  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), _agency_id, 'change_plan', jsonb_build_object('old_plan_id', v_old_sub.plan_id, 'new_plan_id', _new_plan_id, 'new_status', _new_status, 'reason', _reason));
END;
$$;

-- 6. Criar assinatura trial para Rankeia
DO $$
DECLARE v_agency_id UUID; v_plan_id UUID;
BEGIN
  SELECT id INTO v_agency_id FROM public.agencies WHERE slug = 'rankeia';
  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'starter';
  IF v_agency_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (agency_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
    VALUES (v_agency_id, v_plan_id, 'trial', now() + interval '14 days', now(), now() + interval '14 days')
    ON CONFLICT (agency_id) DO NOTHING;
    PERFORM public.sync_agency_limits_from_plan(v_agency_id);
  END IF;
END $$;
