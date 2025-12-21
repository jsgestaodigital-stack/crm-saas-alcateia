-- Add additional fields to audit_log for better tracking
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);

-- Function to log actions (for manual use in code/triggers)
CREATE OR REPLACE FUNCTION public.log_action(
  _action_type TEXT,
  _entity_type TEXT,
  _entity_id TEXT DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _old_value JSONB DEFAULT NULL,
  _new_value JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_agency_id UUID;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_agency_id := current_agency_id();
  
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM profiles WHERE id = v_user_id;
  
  -- If no user context, use system
  IF v_user_id IS NULL THEN
    v_user_name := 'Sistema';
  END IF;
  
  INSERT INTO audit_log (
    user_id,
    user_name,
    agency_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    old_value,
    new_value,
    metadata
  ) VALUES (
    COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(v_user_name, 'Sistema'),
    v_agency_id,
    _action_type,
    _entity_type,
    _entity_id,
    _entity_name,
    _old_value,
    _new_value,
    _metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Generic trigger function for auditing changes
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_agency_id UUID;
  v_action TEXT;
  v_entity_name TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;
  v_user_name := COALESCE(v_user_name, 'Sistema');
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  END IF;
  
  -- Get agency_id from the record
  IF TG_OP = 'DELETE' THEN
    v_agency_id := (OLD).agency_id;
  ELSE
    v_agency_id := (NEW).agency_id;
  END IF;
  
  -- Get entity name based on table
  CASE TG_TABLE_NAME
    WHEN 'leads' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).company_name ELSE (NEW).company_name END;
    WHEN 'clients' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).company_name ELSE (NEW).company_name END;
    WHEN 'clients_v2' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).company_name ELSE (NEW).company_name END;
    WHEN 'agency_invites' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).email ELSE (NEW).email END;
    WHEN 'user_roles' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).role::TEXT ELSE (NEW).role::TEXT END;
    WHEN 'notifications' THEN
      v_entity_name := CASE WHEN TG_OP = 'DELETE' THEN (OLD).title ELSE (NEW).title END;
    ELSE
      v_entity_name := NULL;
  END CASE;
  
  -- Insert audit record
  INSERT INTO audit_log (
    user_id,
    user_name,
    agency_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    old_value,
    new_value,
    metadata
  ) VALUES (
    v_user_id,
    v_user_name,
    v_agency_id,
    v_action,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (OLD).id::TEXT ELSE (NEW).id::TEXT END,
    v_entity_name,
    v_old_data,
    v_new_data,
    jsonb_build_object('trigger', TG_NAME, 'operation', TG_OP)
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for key entities

-- Leads audit trigger
DROP TRIGGER IF EXISTS audit_leads_trigger ON public.leads;
CREATE TRIGGER audit_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Clients V2 audit trigger
DROP TRIGGER IF EXISTS audit_clients_v2_trigger ON public.clients_v2;
CREATE TRIGGER audit_clients_v2_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.clients_v2
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Agency invites audit trigger
DROP TRIGGER IF EXISTS audit_agency_invites_trigger ON public.agency_invites;
CREATE TRIGGER audit_agency_invites_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_invites
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- User roles audit trigger
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Commissions V2 audit trigger
DROP TRIGGER IF EXISTS audit_commissions_v2_trigger ON public.commissions_v2;
CREATE TRIGGER audit_commissions_v2_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.commissions_v2
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_action(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) TO authenticated;

-- Ensure RLS policies prevent modification of audit logs (read-only for everyone except system)
DROP POLICY IF EXISTS "Audit logs are read only" ON public.audit_log;
CREATE POLICY "Agency members can view their audit logs"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT am.agency_id FROM agency_members am WHERE am.user_id = auth.uid()
    )
  );

-- Prevent any modifications via RLS (only triggers can insert)
DROP POLICY IF EXISTS "No direct inserts to audit log" ON public.audit_log;
-- Note: Triggers use SECURITY DEFINER so they bypass RLS