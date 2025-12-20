
-- =============================================
-- ETAPA 2: SISTEMA DE PLANOS E ASSINATURAS (COMPLETO)
-- =============================================

-- 1. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2),
  max_users INTEGER NOT NULL DEFAULT 2,
  max_leads INTEGER NOT NULL DEFAULT 100,
  max_clients INTEGER NOT NULL DEFAULT 20,
  max_recurring_clients INTEGER NOT NULL DEFAULT 10,
  storage_mb INTEGER NOT NULL DEFAULT 500,
  features JSONB NOT NULL DEFAULT '{"ai_agents": false, "exports": false, "api_access": false}'::jsonb,
  trial_days INTEGER NOT NULL DEFAULT 14,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled', 'past_due')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  payment_method TEXT,
  external_subscription_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id)
);

-- 3. Histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES public.plans(id),
  new_plan_id UUID REFERENCES public.plans(id),
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS para plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
TO authenticated
USING (active = true OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admin can manage plans" ON public.plans;
CREATE POLICY "Super admin can manage plans"
ON public.plans FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- 5. RLS para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admin can manage all subscriptions"
ON public.subscriptions FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Agency members can view own subscription" ON public.subscriptions;
CREATE POLICY "Agency members can view own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.can_access_agency(agency_id, auth.uid()));

-- 6. RLS para subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can view all history" ON public.subscription_history;
CREATE POLICY "Super admin can view all history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Agency members can view own history" ON public.subscription_history;
CREATE POLICY "Agency members can view own history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (public.can_access_agency(agency_id, auth.uid()));

-- 7. Triggers
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Criar plano Starter
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_leads, max_clients, max_recurring_clients, storage_mb, features, trial_days, sort_order)
VALUES (
  'Starter',
  'starter',
  'Plano inicial para pequenas agências',
  47.00,
  470.00,
  2,
  1000,
  100,
  50,
  1000,
  '{"ai_agents": true, "exports": true, "api_access": false, "priority_support": false}'::jsonb,
  14,
  1
) ON CONFLICT (slug) DO NOTHING;
