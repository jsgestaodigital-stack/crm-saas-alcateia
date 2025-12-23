
-- ============================================
-- CORREÇÃO: GARANTIR LIMITES PARA TODAS AS AGÊNCIAS
-- ============================================

-- 1. Inserir agency_limits para agências que não têm
INSERT INTO public.agency_limits (agency_id, max_users, max_leads, max_clients, max_recurring_clients, storage_mb)
SELECT 
  a.id,
  3,    -- max_users padrão (plano básico)
  100,  -- max_leads padrão
  20,   -- max_clients padrão
  10,   -- max_recurring_clients padrão
  500   -- storage_mb padrão
FROM public.agencies a
LEFT JOIN public.agency_limits al ON al.agency_id = a.id
WHERE al.id IS NULL;

-- 2. Inserir agency_usage para agências que não têm
INSERT INTO public.agency_usage (agency_id, current_users, current_leads, current_clients, current_recurring_clients, storage_used_mb)
SELECT 
  a.id,
  0, 0, 0, 0, 0
FROM public.agencies a
LEFT JOIN public.agency_usage au ON au.agency_id = a.id
WHERE au.id IS NULL;

-- 3. Criar trigger para garantir limites em novas agências
CREATE OR REPLACE FUNCTION public.ensure_agency_limits_and_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar limites padrão
  INSERT INTO public.agency_limits (agency_id, max_users, max_leads, max_clients, max_recurring_clients, storage_mb)
  VALUES (NEW.id, 3, 100, 20, 10, 500)
  ON CONFLICT (agency_id) DO NOTHING;
  
  -- Criar registro de uso
  INSERT INTO public.agency_usage (agency_id, current_users, current_leads, current_clients, current_recurring_clients, storage_used_mb)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (agency_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger na tabela agencies
DROP TRIGGER IF EXISTS trigger_ensure_agency_limits ON public.agencies;
CREATE TRIGGER trigger_ensure_agency_limits
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_agency_limits_and_usage();

-- 5. Função para recalcular uso real de uma agência
CREATE OR REPLACE FUNCTION public.recalculate_agency_usage(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_users int;
  _current_leads int;
  _current_clients int;
  _current_recurring int;
BEGIN
  -- Contar usuários
  SELECT COUNT(*) INTO _current_users
  FROM public.agency_members
  WHERE agency_id = _agency_id;
  
  -- Contar leads
  SELECT COUNT(*) INTO _current_leads
  FROM public.leads
  WHERE agency_id = _agency_id;
  
  -- Contar clientes (clients_v2)
  SELECT COUNT(*) INTO _current_clients
  FROM public.clients_v2
  WHERE agency_id = _agency_id AND deleted_at IS NULL;
  
  -- Contar recorrentes
  SELECT COUNT(*) INTO _current_recurring
  FROM public.recurring_clients
  WHERE agency_id = _agency_id;
  
  -- Atualizar ou inserir
  INSERT INTO public.agency_usage (
    agency_id, 
    current_users, 
    current_leads, 
    current_clients, 
    current_recurring_clients,
    last_calculated_at
  )
  VALUES (
    _agency_id, 
    _current_users, 
    _current_leads, 
    _current_clients, 
    _current_recurring,
    now()
  )
  ON CONFLICT (agency_id) DO UPDATE SET
    current_users = EXCLUDED.current_users,
    current_leads = EXCLUDED.current_leads,
    current_clients = EXCLUDED.current_clients,
    current_recurring_clients = EXCLUDED.current_recurring_clients,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- 6. Recalcular uso de todas as agências
DO $$
DECLARE
  agency_record RECORD;
BEGIN
  FOR agency_record IN SELECT id FROM public.agencies
  LOOP
    PERFORM public.recalculate_agency_usage(agency_record.id);
  END LOOP;
END;
$$;
