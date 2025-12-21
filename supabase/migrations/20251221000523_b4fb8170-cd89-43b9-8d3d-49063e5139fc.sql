-- =============================================
-- BLOCO 12 – EXPANDIR ENUM E ADICIONAR FUNÇÕES
-- =============================================

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';

-- 2. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS para role_permissions
DROP POLICY IF EXISTS "Anyone can read role permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- 4. RLS para user_roles (SELECT)
DROP POLICY IF EXISTS "Users can view roles in their agencies" ON public.user_roles;
CREATE POLICY "Users can view roles in their agencies"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  agency_id IN (SELECT am.agency_id FROM public.agency_members am WHERE am.user_id = auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- 5. Função SECURITY DEFINER para verificar role (retorna TEXT para flexibilidade)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _agency_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles
  WHERE user_id = _user_id AND agency_id = _agency_id
  LIMIT 1;
$$;

-- 6. Função para verificar se usuário tem determinado role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT, _agency_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
      AND (agency_id = _agency_id OR _agency_id IS NULL)
  );
$$;

-- 7. Função para verificar se é admin ou owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID, _agency_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT IN ('super_admin', 'owner', 'manager', 'admin')
      AND (_agency_id IS NULL OR agency_id = _agency_id)
  ) OR public.is_super_admin(_user_id);
$$;

-- 8. Função para verificar permissão
CREATE OR REPLACE FUNCTION public.can(_permission TEXT, _user_id UUID DEFAULT NULL, _agency_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_agency_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := COALESCE(_user_id, auth.uid());
  v_agency_id := COALESCE(_agency_id, public.current_agency_id());
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF public.is_super_admin(v_user_id) THEN
    RETURN TRUE;
  END IF;
  
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user_id AND agency_id = v_agency_id;
  
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND permission = _permission
  );
END;
$$;

-- 9. Função helper para obter role do usuário atual
CREATE OR REPLACE FUNCTION public.my_role(_agency_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles
  WHERE user_id = auth.uid()
    AND agency_id = COALESCE(_agency_id, public.current_agency_id())
  LIMIT 1;
$$;

-- 10. Função para atribuir role
CREATE OR REPLACE FUNCTION public.assign_role(
  _target_user_id UUID,
  _role TEXT,
  _agency_id UUID DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
  v_role_id UUID;
  v_caller_role TEXT;
BEGIN
  v_agency_id := COALESCE(_agency_id, public.current_agency_id());
  
  IF NOT public.is_super_admin(auth.uid()) THEN
    SELECT role::TEXT INTO v_caller_role
    FROM public.user_roles
    WHERE user_id = auth.uid() AND agency_id = v_agency_id;
    
    IF v_caller_role NOT IN ('owner', 'manager', 'admin') THEN
      RAISE EXCEPTION 'Permission denied: only owners and managers can assign roles';
    END IF;
    
    IF v_caller_role = 'manager' AND _role IN ('owner', 'manager', 'super_admin', 'admin') THEN
      RAISE EXCEPTION 'Permission denied: managers cannot assign owner or manager roles';
    END IF;
  END IF;
  
  IF _role = 'super_admin' AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can assign super admin role';
  END IF;
  
  INSERT INTO public.user_roles (user_id, agency_id, role, granted_by, notes)
  VALUES (_target_user_id, v_agency_id, _role::public.app_role, auth.uid(), _notes)
  ON CONFLICT (user_id, agency_id) DO UPDATE SET
    role = _role::public.app_role,
    granted_by = auth.uid(),
    granted_at = now(),
    notes = _notes,
    updated_at = now()
  RETURNING id INTO v_role_id;
  
  RETURN v_role_id;
END;
$$;

-- 11. Trigger para impedir downgrade de super_admin
CREATE OR REPLACE FUNCTION public.prevent_super_admin_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role::TEXT = 'super_admin' AND NEW.role::TEXT != 'super_admin' THEN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only super admins can change super admin roles';
    END IF;
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role::TEXT = 'super_admin' AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last super admin';
    END IF;
  END IF;
  
  IF NEW.role::TEXT = 'super_admin' AND OLD.role::TEXT != 'super_admin' THEN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only super admins can promote to super admin';
    END IF;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_super_admin_downgrade_trigger ON public.user_roles;
CREATE TRIGGER prevent_super_admin_downgrade_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_downgrade();

-- 12. Policies para INSERT/UPDATE/DELETE em user_roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_admin_or_owner(auth.uid(), agency_id)
);

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin_or_owner(auth.uid(), agency_id)
);

DROP POLICY IF EXISTS "Only super_admin can delete roles" ON public.user_roles;
CREATE POLICY "Only super_admin can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 13. Adicionar permissões para admin e operador (mapeando para os existentes)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'manage_agency'),
  ('admin', 'manage_users'),
  ('admin', 'manage_roles'),
  ('admin', 'manage_clients'),
  ('admin', 'manage_leads'),
  ('admin', 'manage_commissions'),
  ('admin', 'view_reports'),
  ('admin', 'export_data'),
  ('admin', 'manage_settings'),
  ('operador', 'view_clients'),
  ('operador', 'edit_assigned_clients'),
  ('operador', 'complete_tasks'),
  ('operador', 'add_activities'),
  ('operador', 'view_own_commissions'),
  ('visualizador', 'view_clients'),
  ('visualizador', 'view_leads'),
  ('visualizador', 'view_reports')
ON CONFLICT (role, permission) DO NOTHING;