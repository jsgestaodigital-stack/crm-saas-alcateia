-- Drop and recreate get_agency_details function to include owner_id
DROP FUNCTION IF EXISTS public.get_agency_details(uuid);

CREATE FUNCTION public.get_agency_details(_agency_id uuid)
RETURNS TABLE(
  id uuid, 
  name text, 
  slug text, 
  status text, 
  logo_url text, 
  settings jsonb, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  limits_max_users integer, 
  limits_max_clients integer, 
  limits_max_leads integer, 
  limits_max_recurring_clients integer, 
  limits_storage_mb integer, 
  usage_current_users integer, 
  usage_current_clients integer, 
  usage_current_leads integer, 
  usage_current_recurring_clients integer, 
  usage_storage_used_mb integer, 
  members_count bigint, 
  owner_name text, 
  owner_email text,
  owner_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
     WHERE am.agency_id = a.id AND am.role = 'owner' LIMIT 1),
    (SELECT am.user_id FROM public.agency_members am 
     WHERE am.agency_id = a.id AND am.role = 'owner' LIMIT 1)
  FROM public.agencies a
  LEFT JOIN public.agency_limits l ON l.agency_id = a.id
  LEFT JOIN public.agency_usage u ON u.agency_id = a.id
  WHERE a.id = _agency_id
    AND public.is_super_admin(auth.uid());
$function$;