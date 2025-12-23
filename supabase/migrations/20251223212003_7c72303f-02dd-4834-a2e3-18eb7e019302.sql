-- =============================================
-- CORREÇÃO DE POLÍTICAS INSERT SEM VALIDAÇÃO
-- =============================================

-- 1. clients - INSERT
DROP POLICY IF EXISTS "clients_insert_tenant" ON public.clients;
CREATE POLICY "clients_insert_tenant" ON public.clients
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 2. clients_v2 - INSERT
DROP POLICY IF EXISTS "Members can insert clients_v2" ON public.clients_v2;
CREATE POLICY "Members can insert clients_v2" ON public.clients_v2
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 3. leads - INSERT
DROP POLICY IF EXISTS "leads_insert_tenant" ON public.leads;
CREATE POLICY "leads_insert_tenant" ON public.leads
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 4. commissions_v2 - INSERT (corrigir políticas duplicadas)
DROP POLICY IF EXISTS "commissions_v2_insert_tenant" ON public.commissions_v2;
DROP POLICY IF EXISTS "Admins can insert commissions_v2" ON public.commissions_v2;
CREATE POLICY "commissions_v2_insert_tenant" ON public.commissions_v2
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 5. contracts - Atualizar todas as políticas
DROP POLICY IF EXISTS "Users can create contracts in their agency" ON public.contracts;
DROP POLICY IF EXISTS "Users can view contracts from their agency" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts in their agency" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts in their agency" ON public.contracts;

CREATE POLICY "contracts_select_tenant" ON public.contracts
FOR SELECT USING (agency_id = current_agency_id());

CREATE POLICY "contracts_insert_tenant" ON public.contracts
FOR INSERT WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "contracts_update_tenant" ON public.contracts
FOR UPDATE USING (agency_id = current_agency_id());

CREATE POLICY "contracts_delete_tenant" ON public.contracts
FOR DELETE USING (agency_id = current_agency_id());

-- 6. proposals - Atualizar todas as políticas
DROP POLICY IF EXISTS "Users can create proposals in their agency" ON public.proposals;
DROP POLICY IF EXISTS "Users can view proposals from their agency" ON public.proposals;
DROP POLICY IF EXISTS "Users can update proposals in their agency" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete proposals in their agency" ON public.proposals;

CREATE POLICY "proposals_select_tenant" ON public.proposals
FOR SELECT USING (agency_id = current_agency_id());

CREATE POLICY "proposals_insert_tenant" ON public.proposals
FOR INSERT WITH CHECK (agency_id = current_agency_id());

CREATE POLICY "proposals_update_tenant" ON public.proposals
FOR UPDATE USING (agency_id = current_agency_id());

CREATE POLICY "proposals_delete_tenant" ON public.proposals
FOR DELETE USING (agency_id = current_agency_id());

-- 7. questions - INSERT
DROP POLICY IF EXISTS "questions_insert_tenant" ON public.questions;
DROP POLICY IF EXISTS "Users can create their own questions" ON public.questions;
CREATE POLICY "questions_insert_tenant" ON public.questions
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 8. recurring_clients - INSERT
DROP POLICY IF EXISTS "recurring_clients_insert_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "Recurring or admin can insert recurring_clients" ON public.recurring_clients;
CREATE POLICY "recurring_clients_insert_tenant" ON public.recurring_clients
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 9. recurring_tasks - INSERT
DROP POLICY IF EXISTS "recurring_tasks_insert_tenant" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Recurring or admin can insert recurring_tasks" ON public.recurring_tasks;
CREATE POLICY "recurring_tasks_insert_tenant" ON public.recurring_tasks
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 10. suggestions - INSERT
DROP POLICY IF EXISTS "suggestions_insert_tenant" ON public.suggestions;
DROP POLICY IF EXISTS "Members can create suggestions" ON public.suggestions;
CREATE POLICY "suggestions_insert_tenant" ON public.suggestions
FOR INSERT WITH CHECK (agency_id = current_agency_id());

-- 11. Remover políticas duplicadas de commissions_v2
DROP POLICY IF EXISTS "Admins can delete commissions_v2" ON public.commissions_v2;
DROP POLICY IF EXISTS "Admins can update commissions_v2" ON public.commissions_v2;
DROP POLICY IF EXISTS "Admins can view all commissions_v2" ON public.commissions_v2;