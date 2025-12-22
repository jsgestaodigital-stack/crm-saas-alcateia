-- Drop and recreate get_pending_registrations with new return type
DROP FUNCTION IF EXISTS public.get_pending_registrations();

CREATE FUNCTION public.get_pending_registrations()
RETURNS TABLE(
  id uuid, 
  agency_name text, 
  agency_slug text, 
  owner_email text, 
  owner_name text, 
  owner_phone text, 
  status text, 
  created_at timestamp with time zone,
  is_alcateia boolean,
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admin can view pending registrations';
  END IF;

  RETURN QUERY
  SELECT 
    pr.id,
    pr.agency_name,
    pr.agency_slug,
    pr.owner_email,
    pr.owner_name,
    pr.owner_phone,
    pr.status,
    pr.created_at,
    pr.is_alcateia,
    pr.source
  FROM pending_registrations pr
  ORDER BY pr.created_at DESC;
END;
$$;