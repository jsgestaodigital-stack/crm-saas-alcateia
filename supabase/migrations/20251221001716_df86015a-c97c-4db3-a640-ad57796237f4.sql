-- Create agency_invites table
CREATE TABLE public.agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'operador',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL,
  invited_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for token lookup
CREATE INDEX idx_agency_invites_token ON public.agency_invites(token);
CREATE INDEX idx_agency_invites_email ON public.agency_invites(email);
CREATE INDEX idx_agency_invites_agency_status ON public.agency_invites(agency_id, status);

-- Enable RLS
ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

-- Policies: members can view invites for their agency
CREATE POLICY "Agency members can view invites"
  ON public.agency_invites
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT am.agency_id FROM public.agency_members am WHERE am.user_id = auth.uid()
    )
  );

-- Only admins/owners can create invites
CREATE POLICY "Admins can create invites"
  ON public.agency_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_owner(auth.uid())
  );

-- Only admins/owners can update invites
CREATE POLICY "Admins can update invites"
  ON public.agency_invites
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_owner(auth.uid())
  );

-- Function to create an invite
CREATE OR REPLACE FUNCTION public.create_invite(
  _email TEXT,
  _role public.app_role DEFAULT 'operador',
  _agency_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
  v_invite_id UUID;
  v_inviter_name TEXT;
BEGIN
  -- Get agency id
  v_agency_id := COALESCE(_agency_id, current_agency_id());
  
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency context';
  END IF;
  
  -- Check permission
  IF NOT is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admins can create invites';
  END IF;
  
  -- Check if user already in agency
  IF EXISTS (
    SELECT 1 FROM agency_members am
    JOIN profiles p ON p.id = am.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE am.agency_id = v_agency_id
    AND au.email = lower(_email)
  ) THEN
    RAISE EXCEPTION 'User already belongs to this agency';
  END IF;
  
  -- Get inviter name
  SELECT full_name INTO v_inviter_name
  FROM profiles WHERE id = auth.uid();
  
  -- Cancel any existing pending invites for this email/agency
  UPDATE agency_invites
  SET status = 'cancelled', updated_at = now()
  WHERE agency_id = v_agency_id
  AND email = lower(_email)
  AND status = 'pending';
  
  -- Create new invite
  INSERT INTO agency_invites (agency_id, email, role, invited_by, invited_by_name)
  VALUES (v_agency_id, lower(_email), _role, auth.uid(), COALESCE(v_inviter_name, 'Administrador'))
  RETURNING id INTO v_invite_id;
  
  RETURN v_invite_id;
END;
$$;

-- Function to get invite by token (public - no auth required)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  agency_id UUID,
  agency_name TEXT,
  email TEXT,
  role public.app_role,
  invited_by_name TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.agency_id,
    a.name as agency_name,
    i.email,
    i.role,
    i.invited_by_name,
    i.status,
    i.expires_at,
    (i.expires_at < now()) as is_expired
  FROM agency_invites i
  JOIN agencies a ON a.id = i.agency_id
  WHERE i.token = _token;
END;
$$;

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_invite(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Get invite
  SELECT * INTO v_invite
  FROM agency_invites
  WHERE token = _token;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;
  
  IF v_invite.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite já foi utilizado ou cancelado');
  END IF;
  
  IF v_invite.expires_at < now() THEN
    UPDATE agency_invites SET status = 'expired', updated_at = now() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Convite expirado');
  END IF;
  
  -- Check if email matches (case insensitive)
  IF lower(v_user_email) != lower(v_invite.email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este convite foi enviado para outro email');
  END IF;
  
  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM agency_members
    WHERE agency_id = v_invite.agency_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já faz parte desta agência');
  END IF;
  
  -- Add to agency_members
  INSERT INTO agency_members (agency_id, user_id, role)
  VALUES (v_invite.agency_id, v_user_id, 'member')
  ON CONFLICT (agency_id, user_id) DO NOTHING;
  
  -- Assign role
  INSERT INTO user_roles (user_id, agency_id, role, granted_by)
  VALUES (v_user_id, v_invite.agency_id, v_invite.role, v_invite.invited_by)
  ON CONFLICT (user_id, agency_id) DO UPDATE SET
    role = v_invite.role,
    granted_by = v_invite.invited_by,
    updated_at = now();
  
  -- Update current_agency_id in profile
  UPDATE profiles SET current_agency_id = v_invite.agency_id WHERE id = v_user_id;
  
  -- Mark invite as accepted
  UPDATE agency_invites
  SET status = 'accepted', accepted_at = now(), accepted_by = v_user_id, updated_at = now()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'agency_id', v_invite.agency_id,
    'role', v_invite.role
  );
END;
$$;

-- Grant execute to authenticated and anon for public functions
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invite(TEXT, public.app_role, UUID) TO authenticated;