-- =====================================================
-- BLINDAGEM FINAL: Atualizar políticas restantes
-- =====================================================

-- AUDIT_LOG: Restringir a agência atual
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log;
CREATE POLICY "Admins can view all audit logs" ON public.audit_log
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.audit_log;
CREATE POLICY "Admins can delete audit logs" ON public.audit_log
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

-- QUESTIONS: Restringir a agência atual
DROP POLICY IF EXISTS "Ops or admin can view questions" ON public.questions;
CREATE POLICY "Ops or admin can view questions" ON public.questions
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND (can_access_ops(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;
CREATE POLICY "Admins can delete questions" ON public.questions
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
CREATE POLICY "Admins can update questions" ON public.questions
FOR UPDATE USING (
  agency_id = current_agency_id() 
  AND (is_admin(auth.uid()) OR (auth.uid() = asked_by))
);

-- RAIOX_ANALYSES: Restringir a agência atual
DROP POLICY IF EXISTS "Sales or admin can view raiox analyses" ON public.raiox_analyses;
CREATE POLICY "Sales or admin can view raiox analyses" ON public.raiox_analyses
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND (can_access_sales(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can delete raiox analyses" ON public.raiox_analyses;
CREATE POLICY "Admins can delete raiox analyses" ON public.raiox_analyses
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

-- RECURRING_CLIENTS: Restringir a agência atual
DROP POLICY IF EXISTS "Recurring or admin can view recurring_clients" ON public.recurring_clients;
CREATE POLICY "Recurring or admin can view recurring_clients" ON public.recurring_clients
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND (can_access_recurring(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Recurring or admin can update recurring_clients" ON public.recurring_clients;
CREATE POLICY "Recurring or admin can update recurring_clients" ON public.recurring_clients
FOR UPDATE USING (
  agency_id = current_agency_id() 
  AND (can_access_recurring(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can delete recurring_clients" ON public.recurring_clients;
CREATE POLICY "Admins can delete recurring_clients" ON public.recurring_clients
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

-- RECURRING_TASKS: Restringir a agência atual
DROP POLICY IF EXISTS "Recurring or admin can view recurring_tasks" ON public.recurring_tasks;
CREATE POLICY "Recurring or admin can view recurring_tasks" ON public.recurring_tasks
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND (can_access_recurring(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Recurring or admin can update recurring_tasks" ON public.recurring_tasks;
CREATE POLICY "Recurring or admin can update recurring_tasks" ON public.recurring_tasks
FOR UPDATE USING (
  agency_id = current_agency_id() 
  AND (can_access_recurring(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can delete recurring_tasks" ON public.recurring_tasks;
CREATE POLICY "Admins can delete recurring_tasks" ON public.recurring_tasks
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);

-- TASK_TIME_ENTRIES: Restringir a agência atual
DROP POLICY IF EXISTS "Ops or admin can view time entries" ON public.task_time_entries;
CREATE POLICY "Ops or admin can view time entries" ON public.task_time_entries
FOR SELECT USING (
  agency_id = current_agency_id() 
  AND (can_access_ops(auth.uid()) OR can_access_admin(auth.uid()) OR is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can delete time entries" ON public.task_time_entries;
CREATE POLICY "Admins can delete time entries" ON public.task_time_entries
FOR DELETE USING (
  agency_id = current_agency_id() 
  AND is_admin(auth.uid())
);