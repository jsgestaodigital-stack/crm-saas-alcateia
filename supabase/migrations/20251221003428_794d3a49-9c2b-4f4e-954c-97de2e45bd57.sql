-- Bloco 16: Melhorar create_agency_with_owner para setup completo
-- Incluir: criação de agency_limits, agency_usage, user_roles e user_permissions

CREATE OR REPLACE FUNCTION public.create_agency_with_owner(
  _name text, 
  _slug text, 
  _owner_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_agency_id uuid;
  owner_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only Super Admin can create agencies
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can create agencies';
  END IF;

  -- Basic input validation
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid agency name';
  END IF;

  IF _slug IS NULL OR length(trim(_slug)) < 2 THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  -- Ensure owner user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _owner_user_id) THEN
    RAISE EXCEPTION 'Owner user not found';
  END IF;

  -- Ensure slug is unique
  IF EXISTS (SELECT 1 FROM public.agencies WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;

  -- Get owner name from profile
  SELECT full_name INTO owner_name FROM public.profiles WHERE id = _owner_user_id;
  IF owner_name IS NULL THEN
    owner_name := 'Owner';
  END IF;

  -- Create agency
  INSERT INTO public.agencies (name, slug, status)
  VALUES (trim(_name), trim(_slug), 'active')
  RETURNING id INTO new_agency_id;

  -- Add owner membership
  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (new_agency_id, _owner_user_id, 'owner')
  ON CONFLICT (agency_id, user_id) DO UPDATE SET role = 'owner';

  -- Create user_roles entry for owner (admin role)
  INSERT INTO public.user_roles (user_id, agency_id, role)
  VALUES (_owner_user_id, new_agency_id, 'admin')
  ON CONFLICT (user_id, agency_id) DO UPDATE SET role = 'admin';

  -- Create full permissions for owner
  INSERT INTO public.user_permissions (user_id, agency_id, is_sales, is_ops, is_admin, is_finance, is_recurring)
  VALUES (_owner_user_id, new_agency_id, true, true, true, true, true)
  ON CONFLICT (user_id, agency_id) DO UPDATE SET
    is_sales = true,
    is_ops = true,
    is_admin = true,
    is_finance = true,
    is_recurring = true;

  -- Initialize agency limits with defaults
  INSERT INTO public.agency_limits (agency_id, max_users, max_clients, max_leads, max_recurring_clients, storage_mb)
  VALUES (new_agency_id, 10, 100, 500, 50, 5120)
  ON CONFLICT (agency_id) DO NOTHING;

  -- Initialize agency usage
  INSERT INTO public.agency_usage (agency_id, current_users, current_clients, current_leads, current_recurring_clients, storage_used_mb)
  VALUES (new_agency_id, 1, 0, 0, 0, 0)
  ON CONFLICT (agency_id) DO NOTHING;

  -- Set owner's current agency context
  UPDATE public.profiles
  SET current_agency_id = new_agency_id,
      updated_at = now()
  WHERE id = _owner_user_id;

  -- Log the action in super_admin_actions
  INSERT INTO public.super_admin_actions (super_admin_user_id, super_admin_name, action, agency_id, agency_name, metadata)
  SELECT 
    auth.uid(),
    p.full_name,
    'create_agency',
    new_agency_id,
    _name,
    jsonb_build_object('owner_user_id', _owner_user_id, 'slug', _slug)
  FROM public.profiles p WHERE p.id = auth.uid();

  RETURN new_agency_id;
END;
$$;

-- Create function to get agency details for editing
CREATE OR REPLACE FUNCTION public.get_agency_details(_agency_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  status text,
  logo_url text,
  settings jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  limits_max_users int,
  limits_max_clients int,
  limits_max_leads int,
  limits_max_recurring_clients int,
  limits_storage_mb int,
  usage_current_users int,
  usage_current_clients int,
  usage_current_leads int,
  usage_current_recurring_clients int,
  usage_storage_used_mb int,
  members_count bigint,
  owner_name text,
  owner_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.status,
    a.logo_url,
    a.settings,
    a.created_at,
    a.updated_at,
    COALESCE(l.max_users, 10),
    COALESCE(l.max_clients, 100),
    COALESCE(l.max_leads, 500),
    COALESCE(l.max_recurring_clients, 50),
    COALESCE(l.storage_mb, 5120),
    COALESCE(u.current_users, 0),
    COALESCE(u.current_clients, 0),
    COALESCE(u.current_leads, 0),
    COALESCE(u.current_recurring_clients, 0),
    COALESCE(u.storage_used_mb, 0),
    (SELECT COUNT(*) FROM public.agency_members am WHERE am.agency_id = a.id),
    (SELECT p.full_name FROM public.profiles p 
     JOIN public.agency_members am ON p.id = am.user_id 
     WHERE am.agency_id = a.id AND am.role = 'owner' LIMIT 1),
    (SELECT au.email FROM auth.users au 
     JOIN public.agency_members am ON au.id = am.user_id 
     WHERE am.agency_id = a.id AND am.role = 'owner' LIMIT 1)
  FROM public.agencies a
  LEFT JOIN public.agency_limits l ON l.agency_id = a.id
  LEFT JOIN public.agency_usage u ON u.agency_id = a.id
  WHERE a.id = _agency_id
    AND public.is_super_admin(auth.uid());
$$;

-- Create function to update agency
CREATE OR REPLACE FUNCTION public.update_agency(
  _agency_id uuid,
  _name text DEFAULT NULL,
  _status text DEFAULT NULL,
  _logo_url text DEFAULT NULL,
  _settings jsonb DEFAULT NULL,
  _max_users int DEFAULT NULL,
  _max_clients int DEFAULT NULL,
  _max_leads int DEFAULT NULL,
  _max_recurring_clients int DEFAULT NULL,
  _storage_mb int DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, super_admin_name, action, agency_id, agency_name, metadata)
  SELECT 
    auth.uid(),
    p.full_name,
    'update_agency',
    _agency_id,
    a.name,
    jsonb_build_object(
      'name', _name, 
      'status', _status,
      'max_users', _max_users,
      'max_clients', _max_clients
    )
  FROM public.profiles p, public.agencies a 
  WHERE p.id = auth.uid() AND a.id = _agency_id;

  RETURN true;
END;
$$;