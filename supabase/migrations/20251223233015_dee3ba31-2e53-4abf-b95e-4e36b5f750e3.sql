-- =============================================================
-- SECURITY FIX: Make audit logs immutable by removing DELETE policies
-- =============================================================

-- Drop ALL DELETE policies on audit_log
DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_delete_tenant" ON public.audit_log;

-- Also remove UPDATE policy to ensure full immutability
DROP POLICY IF EXISTS "audit_log_update_tenant" ON public.audit_log;

-- =============================================================
-- SECURITY FIX: Restrict agency_sensitive_data to owners only
-- =============================================================

-- Drop the current policy that allows any admin
DROP POLICY IF EXISTS "Agency admin can manage sensitive data" ON public.agency_sensitive_data;

-- Create a function to check if user is the agency owner
CREATE OR REPLACE FUNCTION public.is_agency_owner(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM agency_members am
    WHERE am.user_id = _user_id
      AND am.agency_id = _agency_id
      AND am.role = 'owner'
  )
$$;

-- Create new policy restricting to agency owners only
CREATE POLICY "Only agency owners can access sensitive data"
ON public.agency_sensitive_data
FOR ALL
USING (
  agency_id = current_agency_id() 
  AND (
    is_super_admin(auth.uid()) 
    OR is_agency_owner(auth.uid(), agency_id)
  )
)
WITH CHECK (
  agency_id = current_agency_id() 
  AND (
    is_super_admin(auth.uid()) 
    OR is_agency_owner(auth.uid(), agency_id)
  )
);

-- =============================================================
-- SECURITY FIX: Add audit log trigger for sensitive data access
-- =============================================================

-- Create trigger function to log access to sensitive data
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO audit_log (
    user_id,
    user_name,
    agency_id,
    action_type,
    entity_type,
    entity_id,
    metadata
  )
  SELECT 
    auth.uid(),
    COALESCE(p.full_name, 'Unknown'),
    NEW.agency_id,
    TG_OP,
    'agency_sensitive_data',
    NEW.id::text,
    jsonb_build_object(
      'accessed_at', now(),
      'operation', TG_OP
    )
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN NEW;
END;
$$;

-- Create triggers for sensitive data access logging
DROP TRIGGER IF EXISTS log_sensitive_data_select ON public.agency_sensitive_data;
DROP TRIGGER IF EXISTS log_sensitive_data_insert ON public.agency_sensitive_data;
DROP TRIGGER IF EXISTS log_sensitive_data_update ON public.agency_sensitive_data;

CREATE TRIGGER log_sensitive_data_insert
  AFTER INSERT ON public.agency_sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_data_access();

CREATE TRIGGER log_sensitive_data_update
  AFTER UPDATE ON public.agency_sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_data_access();