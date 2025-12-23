-- =====================================================
-- TRIGGER: Criar limites e usage automaticamente para novas agências
-- =====================================================

-- Função para criar registros padrão quando nova agência é criada
CREATE OR REPLACE FUNCTION public.handle_new_agency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_plan_id uuid;
BEGIN
  -- Buscar plano padrão (Lobão ou o primeiro ativo)
  SELECT id INTO default_plan_id
  FROM public.plans
  WHERE slug = 'lobao' OR active = true
  ORDER BY CASE WHEN slug = 'lobao' THEN 0 ELSE 1 END
  LIMIT 1;

  -- Criar agency_limits com valores padrão do plano Lobão
  INSERT INTO public.agency_limits (agency_id, max_leads, max_clients, max_users, max_recurring_clients, storage_mb)
  VALUES (NEW.id, 1000, 300, 3, 50, 1000)
  ON CONFLICT (agency_id) DO NOTHING;

  -- Criar agency_usage zerado
  INSERT INTO public.agency_usage (agency_id, current_leads, current_clients, current_users, current_recurring_clients, storage_used_mb)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (agency_id) DO NOTHING;

  -- Criar subscription padrão se houver plano
  IF default_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (agency_id, plan_id, status, started_at)
    VALUES (NEW.id, default_plan_id, 'active', now())
    ON CONFLICT (agency_id) DO NOTHING;
  END IF;

  -- Criar onboarding status
  INSERT INTO public.agency_onboarding_status (agency_id, completed_steps)
  VALUES (NEW.id, ARRAY[]::text[])
  ON CONFLICT (agency_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_agency_created ON public.agencies;
CREATE TRIGGER on_agency_created
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_agency();

-- =====================================================
-- FUNÇÃO: Recalcular usage de uma agência
-- =====================================================
CREATE OR REPLACE FUNCTION public.recalculate_agency_usage(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leads_count integer;
  clients_count integer;
  users_count integer;
  recurring_count integer;
BEGIN
  -- Contar leads ativos
  SELECT COUNT(*) INTO leads_count
  FROM public.leads
  WHERE agency_id = _agency_id
    AND status NOT IN ('converted', 'lost');

  -- Contar clientes ativos
  SELECT COUNT(*) INTO clients_count
  FROM public.clients
  WHERE agency_id = _agency_id
    AND deleted_at IS NULL;

  -- Contar usuários membros
  SELECT COUNT(*) INTO users_count
  FROM public.agency_members
  WHERE agency_id = _agency_id;

  -- Contar clientes recorrentes ativos
  SELECT COUNT(*) INTO recurring_count
  FROM public.recurring_clients
  WHERE agency_id = _agency_id
    AND status = 'active';

  -- Atualizar usage
  UPDATE public.agency_usage
  SET 
    current_leads = leads_count,
    current_clients = clients_count,
    current_users = users_count,
    current_recurring_clients = recurring_count,
    last_calculated_at = now(),
    updated_at = now()
  WHERE agency_id = _agency_id;
END;
$$;

-- =====================================================
-- FUNÇÃO: Verificar se agência pode adicionar mais recursos
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_add_resource(_agency_id uuid, _resource_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  -- Buscar limites
  SELECT 
    CASE _resource_type
      WHEN 'lead' THEN al.max_leads
      WHEN 'client' THEN al.max_clients
      WHEN 'user' THEN al.max_users
      WHEN 'recurring' THEN al.max_recurring_clients
    END INTO max_allowed
  FROM public.agency_limits al
  WHERE al.agency_id = _agency_id;

  -- Buscar uso atual
  SELECT 
    CASE _resource_type
      WHEN 'lead' THEN au.current_leads
      WHEN 'client' THEN au.current_clients
      WHEN 'user' THEN au.current_users
      WHEN 'recurring' THEN au.current_recurring_clients
    END INTO current_count
  FROM public.agency_usage au
  WHERE au.agency_id = _agency_id;

  RETURN COALESCE(current_count, 0) < COALESCE(max_allowed, 999999);
END;
$$;