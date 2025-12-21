-- Fix view security by using security_invoker instead of security_definer
DROP VIEW IF EXISTS public.agency_members_with_roles;

CREATE VIEW public.agency_members_with_roles 
WITH (security_invoker = on)
AS
SELECT 
  am.id,
  am.agency_id,
  am.user_id,
  am.role as member_role,
  am.created_at,
  p.full_name,
  p.avatar_url,
  p.status,
  p.last_login,
  ur.role as app_role,
  ur.expires_at,
  ur.notes as role_notes,
  a.name as agency_name
FROM public.agency_members am
JOIN public.profiles p ON p.id = am.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = am.user_id AND ur.agency_id = am.agency_id
LEFT JOIN public.agencies a ON a.id = am.agency_id;

-- Grant access
GRANT SELECT ON public.agency_members_with_roles TO authenticated;