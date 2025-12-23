-- =============================================
-- FUNÇÕES DE VALIDAÇÃO E AUTO-REPARO MULTI-TENANT
-- =============================================

-- 1. Função para logar violação de segurança
CREATE OR REPLACE FUNCTION public.log_security_violation(
  _violation_type TEXT,
  _user_id UUID DEFAULT NULL,
  _attempted_agency_id UUID DEFAULT NULL,
  _table_name TEXT DEFAULT NULL,
  _function_name TEXT DEFAULT NULL,
  _details JSONB DEFAULT NULL,
  _severity TEXT DEFAULT 'warning'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _violation_id UUID;
BEGIN
  INSERT INTO public.mt_security_violations (
    violation_type,
    user_id,
    attempted_agency_id,
    user_current_agency_id,
    table_name,
    function_name,
    details,
    severity
  ) VALUES (
    _violation_type,
    COALESCE(_user_id, auth.uid()),
    _attempted_agency_id,
    current_agency_id(),
    _table_name,
    _function_name,
    _details,
    _severity
  )
  RETURNING id INTO _violation_id;
  
  -- Se for crítico, cria alerta para super admin
  IF _severity = 'critical' THEN
    INSERT INTO public.super_admin_alerts (
      alert_type,
      severity,
      title,
      message,
      details,
      agency_id
    ) VALUES (
      'security_violation',
      'critical',
      'Violação de Segurança Crítica',
      'Detectada tentativa de ' || _violation_type,
      jsonb_build_object(
        'violation_id', _violation_id,
        'user_id', COALESCE(_user_id, auth.uid()),
        'table', _table_name,
        'function', _function_name
      ),
      _attempted_agency_id
    );
  END IF;
  
  RETURN _violation_id;
END;
$$;

-- 2. Função para verificar integridade de uma agência
CREATE OR REPLACE FUNCTION public.check_agency_integrity(_agency_id UUID)
RETURNS TABLE(
  check_type TEXT,
  status TEXT,
  details JSONB,
  needs_repair BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: agency_limits existe
  RETURN QUERY
  SELECT 
    'limits_exist'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM agency_limits WHERE agency_id = _agency_id) 
      THEN 'healthy' ELSE 'critical' END,
    CASE WHEN EXISTS(SELECT 1 FROM agency_limits WHERE agency_id = _agency_id)
      THEN '{"message": "agency_limits configurado"}'::JSONB
      ELSE '{"message": "agency_limits NÃO existe"}'::JSONB END,
    NOT EXISTS(SELECT 1 FROM agency_limits WHERE agency_id = _agency_id);
  
  -- Check 2: agency_usage existe
  RETURN QUERY
  SELECT 
    'usage_exist'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM agency_usage WHERE agency_id = _agency_id) 
      THEN 'healthy' ELSE 'critical' END,
    CASE WHEN EXISTS(SELECT 1 FROM agency_usage WHERE agency_id = _agency_id)
      THEN '{"message": "agency_usage configurado"}'::JSONB
      ELSE '{"message": "agency_usage NÃO existe"}'::JSONB END,
    NOT EXISTS(SELECT 1 FROM agency_usage WHERE agency_id = _agency_id);
  
  -- Check 3: subscription existe
  RETURN QUERY
  SELECT 
    'subscription_exist'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM subscriptions WHERE agency_id = _agency_id) 
      THEN 'healthy' ELSE 'warning' END,
    CASE WHEN EXISTS(SELECT 1 FROM subscriptions WHERE agency_id = _agency_id)
      THEN '{"message": "subscription configurada"}'::JSONB
      ELSE '{"message": "subscription NÃO existe"}'::JSONB END,
    NOT EXISTS(SELECT 1 FROM subscriptions WHERE agency_id = _agency_id);
  
  -- Check 4: Tem pelo menos 1 owner
  RETURN QUERY
  SELECT 
    'owner_exist'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM agency_members am
      JOIN user_roles ur ON ur.user_id = am.user_id
      WHERE am.agency_id = _agency_id AND ur.role = 'owner'
    ) THEN 'healthy' ELSE 'critical' END,
    CASE WHEN EXISTS(
      SELECT 1 FROM agency_members am
      JOIN user_roles ur ON ur.user_id = am.user_id
      WHERE am.agency_id = _agency_id AND ur.role = 'owner'
    ) THEN '{"message": "Owner encontrado"}'::JSONB
    ELSE '{"message": "NENHUM owner na agência"}'::JSONB END,
    NOT EXISTS(
      SELECT 1 FROM agency_members am
      JOIN user_roles ur ON ur.user_id = am.user_id
      WHERE am.agency_id = _agency_id AND ur.role = 'owner'
    );
  
  -- Check 5: agency_usage está sincronizado
  RETURN QUERY
  WITH real_counts AS (
    SELECT
      (SELECT COUNT(*) FROM leads WHERE agency_id = _agency_id AND status != 'converted') as leads_count,
      (SELECT COUNT(*) FROM clients WHERE agency_id = _agency_id AND deleted_at IS NULL) as clients_count,
      (SELECT COUNT(*) FROM agency_members WHERE agency_id = _agency_id) as users_count
  ),
  stored_counts AS (
    SELECT current_leads, current_clients, current_users
    FROM agency_usage WHERE agency_id = _agency_id
  )
  SELECT 
    'usage_sync'::TEXT,
    CASE 
      WHEN sc.current_leads IS NULL THEN 'critical'
      WHEN rc.leads_count != sc.current_leads 
           OR rc.clients_count != sc.current_clients 
           OR rc.users_count != sc.current_users 
      THEN 'warning' 
      ELSE 'healthy' 
    END,
    jsonb_build_object(
      'real_leads', rc.leads_count,
      'stored_leads', sc.current_leads,
      'real_clients', rc.clients_count,
      'stored_clients', sc.current_clients,
      'real_users', rc.users_count,
      'stored_users', sc.current_users
    ),
    CASE 
      WHEN sc.current_leads IS NULL THEN true
      WHEN rc.leads_count != sc.current_leads 
           OR rc.clients_count != sc.current_clients 
           OR rc.users_count != sc.current_users 
      THEN true 
      ELSE false 
    END
  FROM real_counts rc
  LEFT JOIN stored_counts sc ON true;
END;
$$;

-- 3. Função para reparar integridade de uma agência
CREATE OR REPLACE FUNCTION public.repair_agency_integrity(_agency_id UUID)
RETURNS TABLE(
  repair_type TEXT,
  was_repaired BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _default_plan_id UUID;
BEGIN
  -- Buscar plano padrão
  SELECT id INTO _default_plan_id FROM plans WHERE slug = 'free' LIMIT 1;
  IF _default_plan_id IS NULL THEN
    SELECT id INTO _default_plan_id FROM plans ORDER BY price_monthly ASC LIMIT 1;
  END IF;

  -- Repair 1: Criar agency_limits se não existir
  IF NOT EXISTS(SELECT 1 FROM agency_limits WHERE agency_id = _agency_id) THEN
    INSERT INTO agency_limits (agency_id, max_leads, max_clients, max_users, max_recurring_clients, storage_mb)
    VALUES (_agency_id, 100, 50, 3, 20, 500);
    
    RETURN QUERY SELECT 'agency_limits'::TEXT, true, 'Criado com limites padrão (100 leads, 50 clients, 3 users)';
  ELSE
    RETURN QUERY SELECT 'agency_limits'::TEXT, false, 'Já existia';
  END IF;

  -- Repair 2: Criar agency_usage se não existir
  IF NOT EXISTS(SELECT 1 FROM agency_usage WHERE agency_id = _agency_id) THEN
    INSERT INTO agency_usage (agency_id, current_leads, current_clients, current_users, current_recurring_clients)
    VALUES (_agency_id, 0, 0, 0, 0);
    
    RETURN QUERY SELECT 'agency_usage'::TEXT, true, 'Criado com valores zerados';
  ELSE
    RETURN QUERY SELECT 'agency_usage'::TEXT, false, 'Já existia';
  END IF;

  -- Repair 3: Sincronizar agency_usage com dados reais
  UPDATE agency_usage SET
    current_leads = (SELECT COUNT(*) FROM leads WHERE agency_id = _agency_id AND status != 'converted'),
    current_clients = (SELECT COUNT(*) FROM clients WHERE agency_id = _agency_id AND deleted_at IS NULL),
    current_users = (SELECT COUNT(*) FROM agency_members WHERE agency_id = _agency_id),
    current_recurring_clients = (SELECT COUNT(*) FROM recurring_clients WHERE agency_id = _agency_id AND deleted_at IS NULL),
    last_calculated_at = now(),
    updated_at = now()
  WHERE agency_id = _agency_id;
  
  RETURN QUERY SELECT 'usage_sync'::TEXT, true, 'Sincronizado com dados reais';

  -- Repair 4: Criar subscription se não existir
  IF NOT EXISTS(SELECT 1 FROM subscriptions WHERE agency_id = _agency_id) AND _default_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (agency_id, plan_id, status, current_period_start, current_period_end)
    VALUES (_agency_id, _default_plan_id, 'active', now(), now() + interval '30 days');
    
    RETURN QUERY SELECT 'subscription'::TEXT, true, 'Criada subscription com plano padrão';
  ELSE
    RETURN QUERY SELECT 'subscription'::TEXT, false, 'Já existia ou plano não encontrado';
  END IF;

  -- Repair 5: Criar onboarding_status se não existir
  IF NOT EXISTS(SELECT 1 FROM agency_onboarding_status WHERE agency_id = _agency_id) THEN
    INSERT INTO agency_onboarding_status (agency_id, completed_steps)
    VALUES (_agency_id, ARRAY[]::TEXT[]);
    
    RETURN QUERY SELECT 'onboarding_status'::TEXT, true, 'Criado status de onboarding';
  ELSE
    RETURN QUERY SELECT 'onboarding_status'::TEXT, false, 'Já existia';
  END IF;
END;
$$;

-- 4. Função para executar auditoria completa em todas as agências
CREATE OR REPLACE FUNCTION public.run_full_agency_audit()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _run_id UUID;
  _agency RECORD;
  _check RECORD;
  _agencies_checked INTEGER := 0;
  _issues_found INTEGER := 0;
  _issues_repaired INTEGER := 0;
BEGIN
  -- Criar registro de execução
  INSERT INTO system_audit_runs (run_type, status)
  VALUES ('daily_audit', 'running')
  RETURNING id INTO _run_id;
  
  -- Iterar sobre todas as agências ativas
  FOR _agency IN SELECT id, name FROM agencies WHERE status = 'active'
  LOOP
    _agencies_checked := _agencies_checked + 1;
    
    -- Executar checks
    FOR _check IN SELECT * FROM check_agency_integrity(_agency.id)
    LOOP
      -- Registrar health check
      INSERT INTO agency_health_checks (agency_id, check_type, status, details)
      VALUES (_agency.id, _check.check_type, _check.status, _check.details);
      
      -- Se precisa reparo, executar
      IF _check.needs_repair THEN
        _issues_found := _issues_found + 1;
        
        -- Auto-reparar
        PERFORM repair_agency_integrity(_agency.id);
        _issues_repaired := _issues_repaired + 1;
        
        -- Atualizar registro como reparado
        UPDATE agency_health_checks 
        SET auto_repaired = true, repair_details = 'Auto-reparado pelo audit diário'
        WHERE agency_id = _agency.id 
          AND check_type = _check.check_type 
          AND checked_at = (SELECT MAX(checked_at) FROM agency_health_checks WHERE agency_id = _agency.id AND check_type = _check.check_type);
      END IF;
      
      -- Se crítico, criar alerta
      IF _check.status = 'critical' THEN
        INSERT INTO super_admin_alerts (alert_type, severity, title, message, details, agency_id)
        VALUES (
          'agency_health',
          'critical',
          'Problema Crítico de Integridade',
          'Agência ' || _agency.name || ': ' || _check.check_type,
          _check.details,
          _agency.id
        );
      END IF;
    END LOOP;
  END LOOP;
  
  -- Atualizar registro de execução
  UPDATE system_audit_runs SET
    completed_at = now(),
    status = 'completed',
    agencies_checked = _agencies_checked,
    issues_found = _issues_found,
    issues_repaired = _issues_repaired,
    summary = jsonb_build_object(
      'agencies_checked', _agencies_checked,
      'issues_found', _issues_found,
      'issues_repaired', _issues_repaired,
      'completed_at', now()
    )
  WHERE id = _run_id;
  
  RETURN _run_id;
END;
$$;

-- 5. Função para verificar snapshot de políticas RLS
CREATE OR REPLACE FUNCTION public.snapshot_rls_policies()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER := 0;
BEGIN
  -- Salvar snapshot atual de todas as políticas
  INSERT INTO rls_policy_snapshots (table_name, policy_name, policy_definition)
  SELECT 
    schemaname || '.' || tablename,
    policyname,
    pg_get_expr(polwithcheck, polrelid)::TEXT
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 6. Função para detectar mudanças em políticas RLS
CREATE OR REPLACE FUNCTION public.detect_rls_policy_changes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _changes INTEGER := 0;
  _policy RECORD;
  _last_snapshot TIMESTAMPTZ;
BEGIN
  -- Buscar última snapshot
  SELECT MAX(snapshot_at) INTO _last_snapshot FROM rls_policy_snapshots;
  
  IF _last_snapshot IS NULL THEN
    PERFORM snapshot_rls_policies();
    RETURN 0;
  END IF;
  
  -- Detectar políticas novas ou modificadas
  FOR _policy IN 
    SELECT 
      current.schemaname || '.' || current.tablename as table_name,
      current.policyname as policy_name,
      pg_get_expr(current.polwithcheck, current.polrelid)::TEXT as current_def,
      snap.policy_definition as old_def
    FROM pg_policies current
    LEFT JOIN rls_policy_snapshots snap 
      ON snap.table_name = current.schemaname || '.' || current.tablename
      AND snap.policy_name = current.policyname
      AND snap.snapshot_at = _last_snapshot
    WHERE current.schemaname = 'public'
      AND (snap.policy_definition IS NULL 
           OR snap.policy_definition != pg_get_expr(current.polwithcheck, current.polrelid)::TEXT)
  LOOP
    _changes := _changes + 1;
    
    INSERT INTO rls_policy_changes (table_name, policy_name, change_type, old_definition, new_definition)
    VALUES (
      _policy.table_name,
      _policy.policy_name,
      CASE WHEN _policy.old_def IS NULL THEN 'created' ELSE 'modified' END,
      _policy.old_def,
      _policy.current_def
    );
    
    -- Criar alerta para super admin
    INSERT INTO super_admin_alerts (alert_type, severity, title, message, details)
    VALUES (
      'policy_change',
      'warning',
      'Política RLS Alterada',
      'Política ' || _policy.policy_name || ' em ' || _policy.table_name || ' foi alterada',
      jsonb_build_object(
        'table', _policy.table_name,
        'policy', _policy.policy_name,
        'old_definition', _policy.old_def,
        'new_definition', _policy.current_def
      )
    );
  END LOOP;
  
  -- Atualizar snapshot
  PERFORM snapshot_rls_policies();
  
  RETURN _changes;
END;
$$;