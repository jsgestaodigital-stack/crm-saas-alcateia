-- Fix admin policies on profiles to scope by agency
-- This prevents admins from viewing/modifying profiles outside their agency

-- Drop old overly permissive admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create new agency-scoped admin policies
CREATE POLICY "Admins can view agency profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
  OR (
    is_admin(auth.uid()) 
    AND id IN (
      SELECT user_id FROM public.agency_members 
      WHERE agency_id = public.current_agency_id()
    )
  )
);

CREATE POLICY "Admins can update agency profiles"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
  OR (
    is_admin(auth.uid()) 
    AND id IN (
      SELECT user_id FROM public.agency_members 
      WHERE agency_id = public.current_agency_id()
    )
  )
)
WITH CHECK (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
  OR (
    is_admin(auth.uid()) 
    AND id IN (
      SELECT user_id FROM public.agency_members 
      WHERE agency_id = public.current_agency_id()
    )
  )
);

CREATE POLICY "Admins can insert agency profiles"
ON public.profiles FOR INSERT
WITH CHECK (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
  OR is_admin(auth.uid())
);

CREATE POLICY "Admins can delete agency profiles"
ON public.profiles FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (
    is_admin(auth.uid()) 
    AND id IN (
      SELECT user_id FROM public.agency_members 
      WHERE agency_id = public.current_agency_id()
    )
  )
);