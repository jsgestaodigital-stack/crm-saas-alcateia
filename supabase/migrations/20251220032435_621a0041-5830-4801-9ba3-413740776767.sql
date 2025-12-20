-- Create super_admin_actions audit table
CREATE TABLE public.super_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admin_actions ENABLE ROW LEVEL SECURITY;

-- Only super admins can access this table
CREATE POLICY "super_admin_actions_select_super_admin"
ON public.super_admin_actions
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "super_admin_actions_insert_super_admin"
ON public.super_admin_actions
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Function to approve an agency
CREATE OR REPLACE FUNCTION public.approve_agency(_agency_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can approve agencies';
  END IF;

  -- Update agency status
  UPDATE public.agencies
  SET status = 'active', updated_at = now()
  WHERE id = _agency_id;

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), _agency_id, 'approve_agency', jsonb_build_object('previous_status', (SELECT status FROM public.agencies WHERE id = _agency_id)));
END;
$$;

-- Function to suspend an agency
CREATE OR REPLACE FUNCTION public.suspend_agency(_agency_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_status TEXT;
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can suspend agencies';
  END IF;

  -- Get previous status
  SELECT status INTO prev_status FROM public.agencies WHERE id = _agency_id;

  -- Update agency status
  UPDATE public.agencies
  SET status = 'suspended', updated_at = now()
  WHERE id = _agency_id;

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), _agency_id, 'suspend_agency', jsonb_build_object('previous_status', prev_status));
END;
$$;

-- Function to reactivate an agency
CREATE OR REPLACE FUNCTION public.reactivate_agency(_agency_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_status TEXT;
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can reactivate agencies';
  END IF;

  -- Get previous status
  SELECT status INTO prev_status FROM public.agencies WHERE id = _agency_id;

  -- Update agency status
  UPDATE public.agencies
  SET status = 'active', updated_at = now()
  WHERE id = _agency_id;

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), _agency_id, 'reactivate_agency', jsonb_build_object('previous_status', prev_status));
END;
$$;

-- Function to impersonate (enter as) an agency
CREATE OR REPLACE FUNCTION public.impersonate_agency(_agency_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_agency_id UUID;
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can impersonate agencies';
  END IF;

  -- Get current agency before switch
  SELECT current_agency_id INTO prev_agency_id FROM public.profiles WHERE id = auth.uid();

  -- Update current agency
  UPDATE public.profiles
  SET current_agency_id = _agency_id, updated_at = now()
  WHERE id = auth.uid();

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), _agency_id, 'impersonate_agency', jsonb_build_object('previous_agency_id', prev_agency_id));
END;
$$;

-- Function to exit impersonate mode
CREATE OR REPLACE FUNCTION public.exit_impersonate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_agency UUID;
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can exit impersonate mode';
  END IF;

  -- Get current agency before clearing
  SELECT current_agency_id INTO current_agency FROM public.profiles WHERE id = auth.uid();

  -- Clear current agency
  UPDATE public.profiles
  SET current_agency_id = NULL, updated_at = now()
  WHERE id = auth.uid();

  -- Log the action
  INSERT INTO public.super_admin_actions (super_admin_user_id, agency_id, action, metadata)
  VALUES (auth.uid(), current_agency, 'exit_impersonate', '{}'::jsonb);
END;
$$;

-- Function to get all agencies with stats (for super admin only)
CREATE OR REPLACE FUNCTION public.get_all_agencies_with_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  members_count BIGINT,
  clients_count BIGINT,
  leads_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can view all agencies';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.status,
    a.created_at,
    a.updated_at,
    (SELECT COUNT(*) FROM public.agency_members am WHERE am.agency_id = a.id) AS members_count,
    (SELECT COUNT(*) FROM public.clients c WHERE c.agency_id = a.id AND c.deleted_at IS NULL) AS clients_count,
    (SELECT COUNT(*) FROM public.leads l WHERE l.agency_id = a.id) AS leads_count
  FROM public.agencies a
  ORDER BY a.created_at DESC;
END;
$$;

-- Function to get super admin audit logs
CREATE OR REPLACE FUNCTION public.get_super_admin_logs(_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  super_admin_user_id UUID,
  super_admin_name TEXT,
  agency_id UUID,
  agency_name TEXT,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admin can execute
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can view audit logs';
  END IF;

  RETURN QUERY
  SELECT 
    sa.id,
    sa.super_admin_user_id,
    p.full_name AS super_admin_name,
    sa.agency_id,
    a.name AS agency_name,
    sa.action,
    sa.metadata,
    sa.created_at
  FROM public.super_admin_actions sa
  LEFT JOIN public.profiles p ON p.id = sa.super_admin_user_id
  LEFT JOIN public.agencies a ON a.id = sa.agency_id
  ORDER BY sa.created_at DESC
  LIMIT _limit;
END;
$$;