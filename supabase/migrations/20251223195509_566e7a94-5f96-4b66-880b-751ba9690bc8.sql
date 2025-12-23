
-- =====================================================
-- MULTI-TENANT HARDENING
-- Goal:
-- 1) Super admin must NOT be able to browse other agencies' funnels (leads/clients/activities)
-- 2) Prevent super admin from switching tenant context via profiles.current_agency_id
-- 3) Remove unsafe global admin policies (not scoped by agency)
-- =====================================================

-- 1) Tighten current_agency_id(): allow ONLY agency membership (no super-admin bypass)
CREATE OR REPLACE FUNCTION public.current_agency_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected uuid;
  fallback uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Selected agency from profile (ONLY if user is a member)
  SELECT p.current_agency_id INTO selected
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF selected IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.agency_members am
      WHERE am.agency_id = selected
        AND am.user_id = auth.uid()
    ) THEN
      RETURN selected;
    END IF;

    -- If invalid, clear it to avoid wrong-tenant context
    UPDATE public.profiles
    SET current_agency_id = NULL,
        updated_at = now()
    WHERE id = auth.uid();
  END IF;

  -- Fallback: earliest membership
  SELECT am.agency_id INTO fallback
  FROM public.agency_members am
  WHERE am.user_id = auth.uid()
  ORDER BY am.created_at ASC
  LIMIT 1;

  RETURN fallback;
END;
$$;

-- 2) Remove super-admin bypass from funnel tables
-- LEADS
DROP POLICY IF EXISTS "leads_select_tenant" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_tenant" ON public.leads;
DROP POLICY IF EXISTS "leads_update_tenant" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_tenant" ON public.leads;

CREATE POLICY "leads_select_tenant"
ON public.leads
FOR SELECT
TO authenticated
USING (agency_id = current_agency_id());

CREATE POLICY "leads_insert_tenant"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "leads_update_tenant"
ON public.leads
FOR UPDATE
TO authenticated
USING (agency_id = current_agency_id())
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "leads_delete_tenant"
ON public.leads
FOR DELETE
TO authenticated
USING (agency_id = current_agency_id());

-- LEAD ACTIVITIES
DROP POLICY IF EXISTS "Admins can delete lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_select_tenant" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_insert_tenant" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_update_tenant" ON public.lead_activities;
DROP POLICY IF EXISTS "lead_activities_delete_tenant" ON public.lead_activities;

CREATE POLICY "lead_activities_select_tenant"
ON public.lead_activities
FOR SELECT
TO authenticated
USING (agency_id = current_agency_id());

CREATE POLICY "lead_activities_insert_tenant"
ON public.lead_activities
FOR INSERT
TO authenticated
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "lead_activities_update_tenant"
ON public.lead_activities
FOR UPDATE
TO authenticated
USING (agency_id = current_agency_id())
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "lead_activities_delete_tenant"
ON public.lead_activities
FOR DELETE
TO authenticated
USING (agency_id = current_agency_id());

-- CLIENTS (legacy kanban)
DROP POLICY IF EXISTS "clients_select_tenant" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_tenant" ON public.clients;
DROP POLICY IF EXISTS "clients_update_tenant" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_tenant" ON public.clients;

CREATE POLICY "clients_select_tenant"
ON public.clients
FOR SELECT
TO authenticated
USING (agency_id = current_agency_id());

CREATE POLICY "clients_insert_tenant"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "clients_update_tenant"
ON public.clients
FOR UPDATE
TO authenticated
USING (agency_id = current_agency_id())
WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "clients_delete_tenant"
ON public.clients
FOR DELETE
TO authenticated
USING (agency_id = current_agency_id());

-- 3) Fix mutable search_path linter warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
