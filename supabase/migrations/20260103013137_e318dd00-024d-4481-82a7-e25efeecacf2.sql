-- Create function to delete an agency completely (super admin only)
CREATE OR REPLACE FUNCTION public.delete_agency_complete(_agency_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid;
  _is_super_admin boolean;
  _agency_name text;
  _user_ids uuid[];
BEGIN
  -- Get caller ID
  _caller_id := auth.uid();
  IF _caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if caller is super admin
  SELECT is_super_admin INTO _is_super_admin
  FROM user_permissions
  WHERE user_id = _caller_id;

  IF NOT COALESCE(_is_super_admin, false) THEN
    RAISE EXCEPTION 'Permission denied: super admin only';
  END IF;

  -- Get agency name for logging
  SELECT name INTO _agency_name
  FROM agencies
  WHERE id = _agency_id;

  IF _agency_name IS NULL THEN
    RAISE EXCEPTION 'Agency not found';
  END IF;

  -- Get all user IDs associated with this agency
  SELECT ARRAY_AGG(user_id) INTO _user_ids
  FROM agency_members
  WHERE agency_id = _agency_id;

  -- Delete related data in order (respecting foreign keys)
  
  -- Delete appointments
  DELETE FROM appointments WHERE agency_id = _agency_id;
  
  -- Delete audit logs
  DELETE FROM audit_log WHERE agency_id = _agency_id;
  
  -- Delete clients
  DELETE FROM clients WHERE agency_id = _agency_id;
  
  -- Delete clients_v2
  DELETE FROM clients_v2 WHERE agency_id = _agency_id;
  
  -- Delete leads
  DELETE FROM leads WHERE agency_id = _agency_id;
  
  -- Delete contracts
  DELETE FROM contracts WHERE agency_id = _agency_id;
  
  -- Delete contract templates
  DELETE FROM contract_templates WHERE agency_id = _agency_id;
  
  -- Delete proposals
  DELETE FROM proposals WHERE agency_id = _agency_id;
  
  -- Delete proposal templates
  DELETE FROM proposal_templates WHERE agency_id = _agency_id;
  
  -- Delete commissions
  DELETE FROM commissions_v2 WHERE agency_id = _agency_id;
  DELETE FROM commissions_old WHERE agency_id = _agency_id;
  
  -- Delete commission configs and roles
  DELETE FROM commission_configs WHERE agency_id = _agency_id;
  DELETE FROM commission_roles WHERE agency_id = _agency_id;
  
  -- Delete notifications
  DELETE FROM notifications WHERE agency_id = _agency_id;
  
  -- Delete questions
  DELETE FROM questions WHERE agency_id = _agency_id;
  
  -- Delete suggestions
  DELETE FROM suggestions WHERE agency_id = _agency_id;
  
  -- Delete agency invites
  DELETE FROM agency_invites WHERE agency_id = _agency_id;
  
  -- Delete agency members
  DELETE FROM agency_members WHERE agency_id = _agency_id;
  
  -- Delete agency limits
  DELETE FROM agency_limits WHERE agency_id = _agency_id;
  
  -- Delete agency usage
  DELETE FROM agency_usage WHERE agency_id = _agency_id;
  
  -- Delete agency onboarding status
  DELETE FROM agency_onboarding_status WHERE agency_id = _agency_id;
  
  -- Delete agency sensitive data
  DELETE FROM agency_sensitive_data WHERE agency_id = _agency_id;
  
  -- Delete agency health checks
  DELETE FROM agency_health_checks WHERE agency_id = _agency_id;
  
  -- Delete agency plan history
  DELETE FROM agency_plan_history WHERE agency_id = _agency_id;
  
  -- Delete subscriptions
  DELETE FROM subscriptions WHERE agency_id = _agency_id;
  
  -- Delete activation events
  DELETE FROM activation_events WHERE agency_id = _agency_id;
  
  -- Delete anomaly detections
  DELETE FROM anomaly_detections WHERE agency_id = _agency_id;
  
  -- Delete active sessions
  DELETE FROM active_sessions WHERE agency_id = _agency_id;
  
  -- Delete user-related data for agency users
  IF _user_ids IS NOT NULL AND array_length(_user_ids, 1) > 0 THEN
    DELETE FROM user_roles WHERE user_id = ANY(_user_ids);
    DELETE FROM user_permissions WHERE user_id = ANY(_user_ids);
    DELETE FROM profiles WHERE user_id = ANY(_user_ids);
    DELETE FROM nps_feedback WHERE user_id = ANY(_user_ids);
    DELETE FROM engagement_scores WHERE user_id = ANY(_user_ids);
    
    -- Delete users from auth.users (this requires service role, so we'll mark for deletion)
    -- The auth users will need to be cleaned up separately or will be orphaned
  END IF;

  -- Finally delete the agency
  DELETE FROM agencies WHERE id = _agency_id;

  -- Log the action
  INSERT INTO super_admin_actions (
    super_admin_user_id,
    action,
    agency_id,
    agency_name,
    metadata
  ) VALUES (
    _caller_id,
    'delete_agency',
    _agency_id,
    _agency_name,
    jsonb_build_object(
      'deleted_at', now(),
      'users_affected', COALESCE(array_length(_user_ids, 1), 0)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'agency_name', _agency_name,
    'users_deleted', COALESCE(array_length(_user_ids, 1), 0)
  );
END;
$$;

-- Grant execute to authenticated users (function checks super admin internally)
GRANT EXECUTE ON FUNCTION public.delete_agency_complete(uuid) TO authenticated;