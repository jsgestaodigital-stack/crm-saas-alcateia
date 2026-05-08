
-- 1. security_alerts: only service_role or super admins can insert
DROP POLICY IF EXISTS "System can insert alerts" ON public.security_alerts;
CREATE POLICY "Service role can insert alerts"
ON public.security_alerts
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Super admins can insert alerts"
ON public.security_alerts
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- 2. user_sessions: only the user themself (authenticated) can insert their own session
DROP POLICY IF EXISTS "System can insert sessions" ON public.user_sessions;
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert sessions"
ON public.user_sessions
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. failed_login_attempts: only service role can insert (the security-check edge function uses service role)
DROP POLICY IF EXISTS "System can insert failed attempts" ON public.failed_login_attempts;
CREATE POLICY "Service role can insert failed attempts"
ON public.failed_login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. user_permissions: prevent privilege escalation
-- Only super admins can INSERT or UPDATE; the existing "Admins can manage permissions" ALL policy
-- with USING is_super_admin already covers UPDATE/DELETE, but INSERT needs WITH CHECK enforcement.
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
CREATE POLICY "Super admins can manage permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- 5. pending_registrations: prevent anonymous users from setting is_alcateia=true
DROP POLICY IF EXISTS "Anyone can register" ON public.pending_registrations;
CREATE POLICY "Anyone can register"
ON public.pending_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending'::text AND is_alcateia = false);

-- 6. Scope permission functions to current agency membership
CREATE OR REPLACE FUNCTION public.can_access_sales(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (
      COALESCE((SELECT can_sales FROM public.user_permissions WHERE user_id = _user_id), false)
      AND EXISTS (
        SELECT 1 FROM public.agency_members
        WHERE user_id = _user_id AND agency_id = public.current_agency_id()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_ops(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (
      COALESCE((SELECT can_ops FROM public.user_permissions WHERE user_id = _user_id), false)
      AND EXISTS (
        SELECT 1 FROM public.agency_members
        WHERE user_id = _user_id AND agency_id = public.current_agency_id()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_recurring(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (
      COALESCE((SELECT can_recurring FROM public.user_permissions WHERE user_id = _user_id), false)
      AND EXISTS (
        SELECT 1 FROM public.agency_members
        WHERE user_id = _user_id AND agency_id = public.current_agency_id()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (
      COALESCE((SELECT can_admin FROM public.user_permissions WHERE user_id = _user_id), false)
      AND EXISTS (
        SELECT 1 FROM public.agency_members
        WHERE user_id = _user_id AND agency_id = public.current_agency_id()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
        AND agency_id = public.current_agency_id()
    )
$function$;
