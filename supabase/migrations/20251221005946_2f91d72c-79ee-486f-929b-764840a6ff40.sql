-- =====================================================
-- Bloco 17: Sistema RBAC Avançado
-- =====================================================

-- 1. Adicionar novas colunas de permissões granulares
ALTER TABLE public.user_permissions
ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_clients BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_clients BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_leads BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_leads BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_leads BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_commissions BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_audit_logs BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_data BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_settings BOOLEAN NOT NULL DEFAULT false;

-- 2. Criar tabela de templates de role (permissões padrão por role)
CREATE TABLE IF NOT EXISTS public.role_permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL UNIQUE,
  description TEXT,
  can_sales BOOLEAN NOT NULL DEFAULT false,
  can_ops BOOLEAN NOT NULL DEFAULT false,
  can_admin BOOLEAN NOT NULL DEFAULT false,
  can_finance BOOLEAN NOT NULL DEFAULT false,
  can_recurring BOOLEAN NOT NULL DEFAULT false,
  can_view_reports BOOLEAN NOT NULL DEFAULT false,
  can_edit_clients BOOLEAN NOT NULL DEFAULT false,
  can_delete_clients BOOLEAN NOT NULL DEFAULT false,
  can_view_leads BOOLEAN NOT NULL DEFAULT false,
  can_edit_leads BOOLEAN NOT NULL DEFAULT false,
  can_delete_leads BOOLEAN NOT NULL DEFAULT false,
  can_manage_team BOOLEAN NOT NULL DEFAULT false,
  can_manage_commissions BOOLEAN NOT NULL DEFAULT false,
  can_view_audit_logs BOOLEAN NOT NULL DEFAULT false,
  can_export_data BOOLEAN NOT NULL DEFAULT false,
  can_manage_settings BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_permission_templates ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins can manage, others can view
CREATE POLICY "Super admins can manage role templates" ON public.role_permission_templates
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Authenticated users can view role templates" ON public.role_permission_templates
  FOR SELECT TO authenticated
  USING (true);

-- 3. Inserir templates padrão para cada role
INSERT INTO public.role_permission_templates (role, description, can_sales, can_ops, can_admin, can_finance, can_recurring, can_view_reports, can_edit_clients, can_delete_clients, can_view_leads, can_edit_leads, can_delete_leads, can_manage_team, can_manage_commissions, can_view_audit_logs, can_export_data, can_manage_settings)
VALUES
  ('super_admin', 'Administrador global do sistema', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('owner', 'Dono da agência - acesso total', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('admin', 'Administrador da agência', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
  ('manager', 'Gerente - gerencia equipe e relatórios', true, true, false, true, true, true, true, false, true, true, false, true, true, true, true, false),
  ('operador', 'Operador - executa tarefas operacionais', false, true, false, false, true, false, true, false, false, false, false, false, false, false, false, false),
  ('sales_rep', 'Vendedor - foco em leads e vendas', true, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false),
  ('support', 'Suporte - atendimento ao cliente', false, true, false, false, false, false, true, false, true, false, false, false, false, false, false, false),
  ('visualizador', 'Visualizador - apenas visualiza dados', false, false, false, false, false, true, false, false, true, false, false, false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- 4. Função para obter permissões completas do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID, _agency_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  user_agency_id UUID;
  user_role public.app_role;
BEGIN
  -- Get user's agency if not provided
  IF _agency_id IS NULL THEN
    SELECT current_agency_id INTO user_agency_id FROM public.profiles WHERE id = _user_id;
  ELSE
    user_agency_id := _agency_id;
  END IF;

  -- Get user's role for this agency
  SELECT role INTO user_role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
    AND (agency_id = user_agency_id OR agency_id IS NULL)
  ORDER BY agency_id NULLS LAST
  LIMIT 1;

  -- Get permissions from user_permissions table
  SELECT jsonb_build_object(
    'user_id', _user_id,
    'agency_id', user_agency_id,
    'role', user_role,
    'role_label', CASE user_role
      WHEN 'super_admin' THEN 'Super Admin'
      WHEN 'owner' THEN 'Dono'
      WHEN 'admin' THEN 'Admin'
      WHEN 'manager' THEN 'Gerente'
      WHEN 'operador' THEN 'Operador'
      WHEN 'sales_rep' THEN 'Vendedor'
      WHEN 'support' THEN 'Suporte'
      WHEN 'visualizador' THEN 'Visualizador'
      ELSE 'Desconhecido'
    END,
    'permissions', jsonb_build_object(
      'can_sales', COALESCE(up.can_sales, false),
      'can_ops', COALESCE(up.can_ops, false),
      'can_admin', COALESCE(up.can_admin, false),
      'can_finance', COALESCE(up.can_finance, false),
      'can_recurring', COALESCE(up.can_recurring, false),
      'is_super_admin', COALESCE(up.is_super_admin, false),
      'can_view_reports', COALESCE(up.can_view_reports, false),
      'can_edit_clients', COALESCE(up.can_edit_clients, false),
      'can_delete_clients', COALESCE(up.can_delete_clients, false),
      'can_view_leads', COALESCE(up.can_view_leads, false),
      'can_edit_leads', COALESCE(up.can_edit_leads, false),
      'can_delete_leads', COALESCE(up.can_delete_leads, false),
      'can_manage_team', COALESCE(up.can_manage_team, false),
      'can_manage_commissions', COALESCE(up.can_manage_commissions, false),
      'can_view_audit_logs', COALESCE(up.can_view_audit_logs, false),
      'can_export_data', COALESCE(up.can_export_data, false),
      'can_manage_settings', COALESCE(up.can_manage_settings, false)
    )
  ) INTO result
  FROM public.user_permissions up
  WHERE up.user_id = _user_id;

  -- If no permissions found, return defaults based on role template
  IF result IS NULL AND user_role IS NOT NULL THEN
    SELECT jsonb_build_object(
      'user_id', _user_id,
      'agency_id', user_agency_id,
      'role', user_role,
      'role_label', CASE user_role
        WHEN 'super_admin' THEN 'Super Admin'
        WHEN 'owner' THEN 'Dono'
        WHEN 'admin' THEN 'Admin'
        WHEN 'manager' THEN 'Gerente'
        WHEN 'operador' THEN 'Operador'
        WHEN 'sales_rep' THEN 'Vendedor'
        WHEN 'support' THEN 'Suporte'
        WHEN 'visualizador' THEN 'Visualizador'
        ELSE 'Desconhecido'
      END,
      'permissions', jsonb_build_object(
        'can_sales', rpt.can_sales,
        'can_ops', rpt.can_ops,
        'can_admin', rpt.can_admin,
        'can_finance', rpt.can_finance,
        'can_recurring', rpt.can_recurring,
        'is_super_admin', user_role = 'super_admin',
        'can_view_reports', rpt.can_view_reports,
        'can_edit_clients', rpt.can_edit_clients,
        'can_delete_clients', rpt.can_delete_clients,
        'can_view_leads', rpt.can_view_leads,
        'can_edit_leads', rpt.can_edit_leads,
        'can_delete_leads', rpt.can_delete_leads,
        'can_manage_team', rpt.can_manage_team,
        'can_manage_commissions', rpt.can_manage_commissions,
        'can_view_audit_logs', rpt.can_view_audit_logs,
        'can_export_data', rpt.can_export_data,
        'can_manage_settings', rpt.can_manage_settings
      )
    ) INTO result
    FROM public.role_permission_templates rpt
    WHERE rpt.role = user_role;
  END IF;

  RETURN COALESCE(result, jsonb_build_object(
    'user_id', _user_id,
    'agency_id', user_agency_id,
    'role', null,
    'role_label', 'Sem função',
    'permissions', jsonb_build_object()
  ));
END;
$$;

-- 5. Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.is_allowed(_user_id UUID, _agency_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perms JSONB;
  perm_value BOOLEAN;
BEGIN
  -- Super admin always allowed
  IF public.is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- Get user permissions
  perms := public.get_user_permissions(_user_id, _agency_id);
  
  -- Check if user belongs to agency
  IF (perms->>'agency_id')::UUID != _agency_id THEN
    RETURN false;
  END IF;

  -- Owner and admin have full access within their agency
  IF (perms->>'role') IN ('owner', 'admin') THEN
    RETURN true;
  END IF;

  -- Check specific permission
  perm_value := (perms->'permissions'->>_permission)::BOOLEAN;
  
  RETURN COALESCE(perm_value, false);
END;
$$;

-- 6. Função para atualizar role de um membro
CREATE OR REPLACE FUNCTION public.update_member_role(
  _target_user_id UUID,
  _new_role public.app_role,
  _agency_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_role public.app_role;
  target_agency UUID;
  result JSONB;
BEGIN
  caller_id := auth.uid();
  
  -- Determine agency
  IF _agency_id IS NULL THEN
    SELECT current_agency_id INTO target_agency FROM public.profiles WHERE id = caller_id;
  ELSE
    target_agency := _agency_id;
  END IF;

  -- Get caller's role
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = caller_id 
    AND (agency_id = target_agency OR agency_id IS NULL)
  ORDER BY agency_id NULLS LAST
  LIMIT 1;

  -- Check permissions (only super_admin, owner, or admin can change roles)
  IF caller_role NOT IN ('super_admin', 'owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não tem permissão para alterar funções');
  END IF;

  -- Prevent changing super_admin role (only super_admin can do that)
  IF _new_role = 'super_admin' AND caller_role != 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas Super Admins podem atribuir esta função');
  END IF;

  -- Prevent owner from demoting themselves
  IF _target_user_id = caller_id AND caller_role = 'owner' AND _new_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode remover seu próprio papel de dono');
  END IF;

  -- Update the role
  UPDATE public.user_roles
  SET role = _new_role, updated_at = now()
  WHERE user_id = _target_user_id 
    AND agency_id = target_agency;

  IF NOT FOUND THEN
    -- Insert if not exists
    INSERT INTO public.user_roles (user_id, role, agency_id, granted_by, granted_at)
    VALUES (_target_user_id, _new_role, target_agency, caller_id, now());
  END IF;

  -- Apply role template permissions
  INSERT INTO public.user_permissions (
    user_id, can_sales, can_ops, can_admin, can_finance, can_recurring,
    can_view_reports, can_edit_clients, can_delete_clients, can_view_leads,
    can_edit_leads, can_delete_leads, can_manage_team, can_manage_commissions,
    can_view_audit_logs, can_export_data, can_manage_settings, is_super_admin
  )
  SELECT
    _target_user_id,
    rpt.can_sales, rpt.can_ops, rpt.can_admin, rpt.can_finance, rpt.can_recurring,
    rpt.can_view_reports, rpt.can_edit_clients, rpt.can_delete_clients, rpt.can_view_leads,
    rpt.can_edit_leads, rpt.can_delete_leads, rpt.can_manage_team, rpt.can_manage_commissions,
    rpt.can_view_audit_logs, rpt.can_export_data, rpt.can_manage_settings,
    _new_role = 'super_admin'
  FROM public.role_permission_templates rpt
  WHERE rpt.role = _new_role
  ON CONFLICT (user_id) DO UPDATE SET
    can_sales = EXCLUDED.can_sales,
    can_ops = EXCLUDED.can_ops,
    can_admin = EXCLUDED.can_admin,
    can_finance = EXCLUDED.can_finance,
    can_recurring = EXCLUDED.can_recurring,
    can_view_reports = EXCLUDED.can_view_reports,
    can_edit_clients = EXCLUDED.can_edit_clients,
    can_delete_clients = EXCLUDED.can_delete_clients,
    can_view_leads = EXCLUDED.can_view_leads,
    can_edit_leads = EXCLUDED.can_edit_leads,
    can_delete_leads = EXCLUDED.can_delete_leads,
    can_manage_team = EXCLUDED.can_manage_team,
    can_manage_commissions = EXCLUDED.can_manage_commissions,
    can_view_audit_logs = EXCLUDED.can_view_audit_logs,
    can_export_data = EXCLUDED.can_export_data,
    can_manage_settings = EXCLUDED.can_manage_settings,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = now();

  -- Log the action
  PERFORM public.log_action(
    'update',
    'user_role',
    _target_user_id::TEXT,
    NULL,
    jsonb_build_object('new_role', _new_role, 'agency_id', target_agency)
  );

  RETURN jsonb_build_object('success', true, 'new_role', _new_role);
END;
$$;

-- 7. Função para atualizar template de permissões (super admin only)
CREATE OR REPLACE FUNCTION public.update_role_template(
  _role public.app_role,
  _permissions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admin can update templates
  IF NOT public.is_super_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas Super Admins podem editar templates');
  END IF;

  UPDATE public.role_permission_templates
  SET
    can_sales = COALESCE((_permissions->>'can_sales')::BOOLEAN, can_sales),
    can_ops = COALESCE((_permissions->>'can_ops')::BOOLEAN, can_ops),
    can_admin = COALESCE((_permissions->>'can_admin')::BOOLEAN, can_admin),
    can_finance = COALESCE((_permissions->>'can_finance')::BOOLEAN, can_finance),
    can_recurring = COALESCE((_permissions->>'can_recurring')::BOOLEAN, can_recurring),
    can_view_reports = COALESCE((_permissions->>'can_view_reports')::BOOLEAN, can_view_reports),
    can_edit_clients = COALESCE((_permissions->>'can_edit_clients')::BOOLEAN, can_edit_clients),
    can_delete_clients = COALESCE((_permissions->>'can_delete_clients')::BOOLEAN, can_delete_clients),
    can_view_leads = COALESCE((_permissions->>'can_view_leads')::BOOLEAN, can_view_leads),
    can_edit_leads = COALESCE((_permissions->>'can_edit_leads')::BOOLEAN, can_edit_leads),
    can_delete_leads = COALESCE((_permissions->>'can_delete_leads')::BOOLEAN, can_delete_leads),
    can_manage_team = COALESCE((_permissions->>'can_manage_team')::BOOLEAN, can_manage_team),
    can_manage_commissions = COALESCE((_permissions->>'can_manage_commissions')::BOOLEAN, can_manage_commissions),
    can_view_audit_logs = COALESCE((_permissions->>'can_view_audit_logs')::BOOLEAN, can_view_audit_logs),
    can_export_data = COALESCE((_permissions->>'can_export_data')::BOOLEAN, can_export_data),
    can_manage_settings = COALESCE((_permissions->>'can_manage_settings')::BOOLEAN, can_manage_settings),
    updated_at = now()
  WHERE role = _role;

  RETURN jsonb_build_object('success', true);
END;
$$;