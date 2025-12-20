
-- =============================================
-- ETAPA 1: ESCALA PARA 100 AGÊNCIAS
-- Sistema de Planos, Limites e Melhorias
-- =============================================

-- 1. Adicionar logo às agências
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Criar tabela de limites por agência (customizáveis)
CREATE TABLE IF NOT EXISTS public.agency_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_leads INTEGER NOT NULL DEFAULT 500,
  max_clients INTEGER NOT NULL DEFAULT 100,
  max_recurring_clients INTEGER NOT NULL DEFAULT 50,
  storage_mb INTEGER NOT NULL DEFAULT 1000,
  features JSONB DEFAULT '{"ai_agents": true, "exports": true, "api_access": false}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id)
);

-- 3. Criar tabela de uso atual por agência (cache para performance)
CREATE TABLE IF NOT EXISTS public.agency_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  current_users INTEGER NOT NULL DEFAULT 0,
  current_leads INTEGER NOT NULL DEFAULT 0,
  current_clients INTEGER NOT NULL DEFAULT 0,
  current_recurring_clients INTEGER NOT NULL DEFAULT 0,
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id)
);

-- 4. RLS para agency_limits
ALTER TABLE public.agency_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage all limits"
ON public.agency_limits FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency owners can view own limits"
ON public.agency_limits FOR SELECT
TO authenticated
USING (public.can_access_agency(agency_id, auth.uid()));

-- 5. RLS para agency_usage
ALTER TABLE public.agency_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage all usage"
ON public.agency_usage FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency members can view own usage"
ON public.agency_usage FOR SELECT
TO authenticated
USING (public.can_access_agency(agency_id, auth.uid()));

-- 6. Função para calcular uso atual de uma agência
CREATE OR REPLACE FUNCTION public.calculate_agency_usage(_agency_id UUID)
RETURNS public.agency_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users INTEGER;
  v_leads INTEGER;
  v_clients INTEGER;
  v_recurring INTEGER;
  v_result public.agency_usage;
BEGIN
  -- Contar usuários
  SELECT COUNT(*) INTO v_users
  FROM public.agency_members
  WHERE agency_id = _agency_id;

  -- Contar leads ativos
  SELECT COUNT(*) INTO v_leads
  FROM public.leads
  WHERE agency_id = _agency_id AND status != 'lost';

  -- Contar clientes ativos
  SELECT COUNT(*) INTO v_clients
  FROM public.clients
  WHERE agency_id = _agency_id AND deleted_at IS NULL;

  -- Contar clientes recorrentes ativos
  SELECT COUNT(*) INTO v_recurring
  FROM public.recurring_clients
  WHERE agency_id = _agency_id AND status = 'active';

  -- Upsert na tabela de uso
  INSERT INTO public.agency_usage (agency_id, current_users, current_leads, current_clients, current_recurring_clients, last_calculated_at)
  VALUES (_agency_id, v_users, v_leads, v_clients, v_recurring, now())
  ON CONFLICT (agency_id) DO UPDATE SET
    current_users = v_users,
    current_leads = v_leads,
    current_clients = v_clients,
    current_recurring_clients = v_recurring,
    last_calculated_at = now(),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- 7. Função para verificar se ação está dentro dos limites
CREATE OR REPLACE FUNCTION public.check_limit(_agency_id UUID, _resource TEXT, _increment INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_usage RECORD;
  v_current INTEGER;
  v_max INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Buscar limites
  SELECT * INTO v_limits FROM public.agency_limits WHERE agency_id = _agency_id;
  
  -- Se não tem limites configurados, permitir (agência sem restrições)
  IF v_limits IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'message', 'No limits configured');
  END IF;

  -- Buscar uso atual
  SELECT * INTO v_usage FROM public.agency_usage WHERE agency_id = _agency_id;
  
  -- Determinar valores baseado no recurso
  CASE _resource
    WHEN 'users' THEN
      v_current := COALESCE(v_usage.current_users, 0);
      v_max := v_limits.max_users;
    WHEN 'leads' THEN
      v_current := COALESCE(v_usage.current_leads, 0);
      v_max := v_limits.max_leads;
    WHEN 'clients' THEN
      v_current := COALESCE(v_usage.current_clients, 0);
      v_max := v_limits.max_clients;
    WHEN 'recurring_clients' THEN
      v_current := COALESCE(v_usage.current_recurring_clients, 0);
      v_max := v_limits.max_recurring_clients;
    ELSE
      RETURN jsonb_build_object('allowed', true, 'message', 'Unknown resource');
  END CASE;

  v_allowed := (v_current + _increment) <= v_max;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current', v_current,
    'max', v_max,
    'remaining', GREATEST(0, v_max - v_current),
    'percentage', ROUND((v_current::NUMERIC / NULLIF(v_max, 0)) * 100, 1),
    'message', CASE 
      WHEN v_allowed THEN 'Within limits' 
      ELSE format('Limit reached: %s/%s %s', v_current, v_max, _resource)
    END
  );
END;
$$;

-- 8. Criar limites default para agência Rankeia
INSERT INTO public.agency_limits (agency_id, max_users, max_leads, max_clients, max_recurring_clients, storage_mb, features)
SELECT 
  id,
  10,     -- max_users
  1000,   -- max_leads
  200,    -- max_clients
  100,    -- max_recurring
  5000,   -- storage_mb
  '{"ai_agents": true, "exports": true, "api_access": true}'::jsonb
FROM public.agencies
WHERE slug = 'rankeia'
ON CONFLICT (agency_id) DO NOTHING;

-- 9. Calcular uso atual para Rankeia
SELECT public.calculate_agency_usage(id) FROM public.agencies WHERE slug = 'rankeia';

-- 10. Índices para performance em buscas frequentes
CREATE INDEX IF NOT EXISTS idx_leads_agency_status ON public.leads(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_agency_pipeline ON public.leads(agency_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON public.leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_agency_deleted ON public.clients(agency_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients(company_name);
CREATE INDEX IF NOT EXISTS idx_recurring_clients_agency_status ON public.recurring_clients(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON public.agency_members(agency_id);

-- 11. Trigger para atualizar updated_at nas novas tabelas
CREATE TRIGGER update_agency_limits_updated_at
  BEFORE UPDATE ON public.agency_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_agency_usage_updated_at
  BEFORE UPDATE ON public.agency_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
