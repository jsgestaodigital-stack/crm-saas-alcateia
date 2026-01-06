-- Limpar policies duplicadas e conflitantes em recurring_clients
DROP POLICY IF EXISTS "Recurring or admin can view recurring_clients" ON public.recurring_clients;
DROP POLICY IF EXISTS "Recurring or admin can update recurring_clients" ON public.recurring_clients;
DROP POLICY IF EXISTS "Admins can delete recurring_clients" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_insert_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_select_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_update_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_delete_tenant" ON public.recurring_clients;

-- Policies simplificadas baseadas apenas em agency_id
CREATE POLICY "recurring_clients_select" ON public.recurring_clients
FOR SELECT USING (agency_id = current_agency_id());

CREATE POLICY "recurring_clients_insert" ON public.recurring_clients
FOR INSERT WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "recurring_clients_update" ON public.recurring_clients
FOR UPDATE USING (agency_id = current_agency_id());

CREATE POLICY "recurring_clients_delete" ON public.recurring_clients
FOR DELETE USING (agency_id = current_agency_id());