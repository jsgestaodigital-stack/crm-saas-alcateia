
-- Fix CROSS_TENANT_PRIVILEGE_ESCALATION: scope can_access_* by current_agency_id
CREATE OR REPLACE FUNCTION public.can_access_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE((SELECT can_admin FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_sales(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE((SELECT can_sales FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_ops(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE((SELECT can_ops FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_recurring(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    COALESCE((SELECT can_recurring FROM public.user_permissions WHERE user_id = _user_id), false)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$$;

-- Fix CROSS_TENANT_INVITE_CREATION: scope agency_invites RLS by agency_id
DROP POLICY IF EXISTS "Admins can create invites" ON public.agency_invites;
CREATE POLICY "Admins can create invites" ON public.agency_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_owner(auth.uid(), agency_id));

DROP POLICY IF EXISTS "Admins can update invites" ON public.agency_invites;
CREATE POLICY "Admins can update invites" ON public.agency_invites
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_owner(auth.uid(), agency_id))
  WITH CHECK (public.is_admin_or_owner(auth.uid(), agency_id));

-- Fix UNAUTHENTICATED_DATA_INSERTION on agency_plan_history
DROP POLICY IF EXISTS "System can insert plan history" ON public.agency_plan_history;
CREATE POLICY "Members can insert plan history for their agency"
  ON public.agency_plan_history
  FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (
      SELECT am.agency_id FROM public.agency_members am
      WHERE am.user_id = auth.uid() AND am.role IN ('owner','admin')
    )
  );
