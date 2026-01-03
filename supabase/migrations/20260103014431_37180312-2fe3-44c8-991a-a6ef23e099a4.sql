-- Fix update_agency function to match actual super_admin_actions table structure
CREATE OR REPLACE FUNCTION public.update_agency(
  _agency_id uuid, 
  _name text DEFAULT NULL::text, 
  _status text DEFAULT NULL::text, 
  _logo_url text DEFAULT NULL::text, 
  _settings jsonb DEFAULT NULL::jsonb, 
  _max_users integer DEFAULT NULL::integer, 
  _max_clients integer DEFAULT NULL::integer, 
  _max_leads integer DEFAULT NULL::integer, 
  _max_recurring_clients integer DEFAULT NULL::integer, 
  _storage_mb integer DEFAULT NULL::integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can update agencies';
  END IF;

  -- Update agency table
  UPDATE public.agencies SET
    name = COALESCE(_name, name),
    status = COALESCE(_status, status),
    logo_url = COALESCE(_logo_url, logo_url),
    settings = COALESCE(_settings, settings),
    updated_at = now()
  WHERE id = _agency_id;

  -- Update limits if any provided
  IF _max_users IS NOT NULL OR _max_clients IS NOT NULL OR _max_leads IS NOT NULL 
     OR _max_recurring_clients IS NOT NULL OR _storage_mb IS NOT NULL THEN
    UPDATE public.agency_limits SET
      max_users = COALESCE(_max_users, max_users),
      max_clients = COALESCE(_max_clients, max_clients),
      max_leads = COALESCE(_max_leads, max_leads),
      max_recurring_clients = COALESCE(_max_recurring_clients, max_recurring_clients),
      storage_mb = COALESCE(_storage_mb, storage_mb),
      updated_at = now()
    WHERE agency_id = _agency_id;
  END IF;

  -- Log the action (using correct column names)
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (
    auth.uid(),
    _agency_id,
    'update_agency',
    jsonb_build_object(
      'name', _name, 
      'status', _status,
      'max_users', _max_users,
      'max_clients', _max_clients,
      'max_leads', _max_leads,
      'max_recurring_clients', _max_recurring_clients,
      'storage_mb', _storage_mb
    )
  );

  RETURN true;
END;
$function$;