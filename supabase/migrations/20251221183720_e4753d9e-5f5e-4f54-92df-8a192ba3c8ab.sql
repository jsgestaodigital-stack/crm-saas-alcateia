-- Fix PUBLIC_DATA_EXPOSURE: System Contract Templates Expose Business Strategy
-- Drop existing policy that allows any authenticated user to read system templates
DROP POLICY IF EXISTS "Users can view templates from their agency" ON public.contract_templates;

-- Create stricter policy - only agency members can view templates
-- System templates are now only accessible to users who belong to an agency
CREATE POLICY "Agency members can view templates"
ON public.contract_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contract_templates.agency_id
    AND agency_members.user_id = auth.uid()
  )
  OR (
    -- System templates are accessible to any agency member (not any authenticated user)
    is_system = true 
    AND EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.user_id = auth.uid()
    )
  )
);