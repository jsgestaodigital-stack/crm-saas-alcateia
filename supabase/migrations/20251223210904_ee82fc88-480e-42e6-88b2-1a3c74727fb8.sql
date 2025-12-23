-- =====================================================
-- CORREÇÃO CRÍTICA: Função is_admin deve validar agency_id
-- =====================================================

-- 1. Criar nova função is_agency_admin que valida a agência atual
CREATE OR REPLACE FUNCTION public.is_agency_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'
      AND ur.agency_id = public.current_agency_id()
  )
$$;

-- 2. Atualizar a função is_admin para EXIGIR validação de agência
-- Agora valida se é super_admin OU admin da agência atual
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = 'admin'
        AND ur.agency_id = public.current_agency_id()
    )
    OR EXISTS (
      SELECT 1
      FROM public.agency_members am
      WHERE am.user_id = _user_id
        AND am.agency_id = public.current_agency_id()
        AND am.role IN ('owner', 'admin')
    )
$$;

-- 3. Criar função is_admin_for_agency para validar admin específico de uma agência
CREATE OR REPLACE FUNCTION public.is_admin_for_agency(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = 'admin'
        AND ur.agency_id = _agency_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.agency_members am
      WHERE am.user_id = _user_id
        AND am.agency_id = _agency_id
        AND am.role IN ('owner', 'admin')
    )
$$;