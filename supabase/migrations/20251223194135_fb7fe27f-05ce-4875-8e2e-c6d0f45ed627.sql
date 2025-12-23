
-- =============================================
-- CRITICAL SECURITY FIX: Remove duplicate RLS policies that don't filter by agency_id
-- These policies allow users to see data from ALL agencies, which is a severe security breach
-- =============================================

-- Drop the problematic policies on leads table (they don't filter by agency_id)
DROP POLICY IF EXISTS "Sales or admin can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Sales or admin can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Sales or admin can update leads" ON public.leads;
DROP POLICY IF EXISTS "Sales or admin can view leads" ON public.leads;

-- Drop the problematic policies on lead_activities table
DROP POLICY IF EXISTS "Sales or admin can insert lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Sales or admin can view lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Sales or admin can update lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Sales or admin can delete lead activities" ON public.lead_activities;

-- Ensure lead_activities has proper tenant-based policies
-- First check if they exist, if not create them

-- SELECT policy for lead_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lead_activities' 
    AND policyname = 'lead_activities_select_tenant'
  ) THEN
    CREATE POLICY "lead_activities_select_tenant"
    ON public.lead_activities
    FOR SELECT
    TO authenticated
    USING (
      is_super_admin(auth.uid()) 
      OR agency_id = current_agency_id()
    );
  END IF;
END $$;

-- INSERT policy for lead_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lead_activities' 
    AND policyname = 'lead_activities_insert_tenant'
  ) THEN
    CREATE POLICY "lead_activities_insert_tenant"
    ON public.lead_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (
      is_super_admin(auth.uid()) 
      OR agency_id = current_agency_id()
    );
  END IF;
END $$;

-- UPDATE policy for lead_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lead_activities' 
    AND policyname = 'lead_activities_update_tenant'
  ) THEN
    CREATE POLICY "lead_activities_update_tenant"
    ON public.lead_activities
    FOR UPDATE
    TO authenticated
    USING (
      is_super_admin(auth.uid()) 
      OR agency_id = current_agency_id()
    )
    WITH CHECK (
      is_super_admin(auth.uid()) 
      OR agency_id = current_agency_id()
    );
  END IF;
END $$;

-- DELETE policy for lead_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lead_activities' 
    AND policyname = 'lead_activities_delete_tenant'
  ) THEN
    CREATE POLICY "lead_activities_delete_tenant"
    ON public.lead_activities
    FOR DELETE
    TO authenticated
    USING (
      is_super_admin(auth.uid()) 
      OR agency_id = current_agency_id()
    );
  END IF;
END $$;
