-- =============================================
-- TABELAS DE AUDITORIA MULTI-TENANT
-- =============================================

-- 1. Tabela para logs de violações de segurança multi-tenant
CREATE TABLE IF NOT EXISTS public.mt_security_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_type TEXT NOT NULL, -- 'cross_agency_access', 'invalid_function_call', 'super_admin_data_access', 'policy_bypass_attempt'
  user_id UUID,
  attempted_agency_id UUID,
  user_current_agency_id UUID,
  table_name TEXT,
  function_name TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela para tracking de mudanças em políticas RLS
CREATE TABLE IF NOT EXISTS public.rls_policy_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  policy_definition TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rls_policy_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'modified', 'dropped'
  old_definition TEXT,
  new_definition TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- 3. Tabela para health checks de agências
CREATE TABLE IF NOT EXISTS public.agency_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL, -- 'usage_sync', 'limits_exist', 'member_validation', 'subscription_exist', 'owner_exist'
  status TEXT NOT NULL, -- 'healthy', 'warning', 'critical'
  details JSONB,
  auto_repaired BOOLEAN DEFAULT false,
  repair_details TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela para alertas do Super Admin
CREATE TABLE IF NOT EXISTS public.super_admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'security_violation', 'policy_change', 'agency_health', 'system_integrity'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_by UUID,
  read_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela para registrar o último audit executado
CREATE TABLE IF NOT EXISTS public.system_audit_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type TEXT NOT NULL, -- 'daily_audit', 'manual_audit', 'policy_check'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  agencies_checked INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  issues_repaired INTEGER DEFAULT 0,
  summary JSONB,
  error_message TEXT
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_mt_security_violations_type ON public.mt_security_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_mt_security_violations_created ON public.mt_security_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mt_security_violations_user ON public.mt_security_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_mt_security_violations_severity ON public.mt_security_violations(severity);

CREATE INDEX IF NOT EXISTS idx_rls_policy_changes_table ON public.rls_policy_changes(table_name);
CREATE INDEX IF NOT EXISTS idx_rls_policy_changes_detected ON public.rls_policy_changes(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_agency_health_checks_agency ON public.agency_health_checks(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_health_checks_status ON public.agency_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_agency_health_checks_checked ON public.agency_health_checks(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_super_admin_alerts_severity ON public.super_admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_super_admin_alerts_read ON public.super_admin_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_super_admin_alerts_created ON public.super_admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_super_admin_alerts_agency ON public.super_admin_alerts(agency_id);

-- 7. RLS - Apenas Super Admins podem acessar estas tabelas de auditoria
ALTER TABLE public.mt_security_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rls_policy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rls_policy_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view security violations"
  ON public.mt_security_violations FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view policy snapshots"
  ON public.rls_policy_snapshots FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view policy changes"
  ON public.rls_policy_changes FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage policy reviews"
  ON public.rls_policy_changes FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view agency health"
  ON public.agency_health_checks FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view alerts"
  ON public.super_admin_alerts FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage alerts"
  ON public.super_admin_alerts FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view audit runs"
  ON public.system_audit_runs FOR SELECT
  USING (is_super_admin(auth.uid()));