
-- =====================================================
-- MULTI-TENANT HARDENING - FASE 2 (CORRIGIDO)
-- Remover bypass de super admin de TODAS as tabelas sensíveis
-- =====================================================

-- AUDIT_LOG - já tem insert, só precisa atualizar select/update/delete
DROP POLICY IF EXISTS "audit_log_delete_tenant" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_select_tenant" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_update_tenant" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert_tenant" ON public.audit_log;

CREATE POLICY "audit_log_select_tenant" ON public.audit_log FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "audit_log_insert_tenant" ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "audit_log_update_tenant" ON public.audit_log FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "audit_log_delete_tenant" ON public.audit_log FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- COMMISSION_CONFIGS
DROP POLICY IF EXISTS "commission_configs_delete_tenant" ON public.commission_configs;
DROP POLICY IF EXISTS "commission_configs_select_tenant" ON public.commission_configs;
DROP POLICY IF EXISTS "commission_configs_update_tenant" ON public.commission_configs;
DROP POLICY IF EXISTS "commission_configs_insert_tenant" ON public.commission_configs;

CREATE POLICY "commission_configs_select_tenant" ON public.commission_configs FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "commission_configs_insert_tenant" ON public.commission_configs FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commission_configs_update_tenant" ON public.commission_configs FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commission_configs_delete_tenant" ON public.commission_configs FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- COMMISSION_ROLES
DROP POLICY IF EXISTS "commission_roles_delete_tenant" ON public.commission_roles;
DROP POLICY IF EXISTS "commission_roles_select_tenant" ON public.commission_roles;
DROP POLICY IF EXISTS "commission_roles_update_tenant" ON public.commission_roles;
DROP POLICY IF EXISTS "commission_roles_insert_tenant" ON public.commission_roles;

CREATE POLICY "commission_roles_select_tenant" ON public.commission_roles FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "commission_roles_insert_tenant" ON public.commission_roles FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commission_roles_update_tenant" ON public.commission_roles FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commission_roles_delete_tenant" ON public.commission_roles FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- COMMISSIONS_OLD
DROP POLICY IF EXISTS "commissions_old_delete_tenant" ON public.commissions_old;
DROP POLICY IF EXISTS "commissions_old_select_tenant" ON public.commissions_old;
DROP POLICY IF EXISTS "commissions_old_update_tenant" ON public.commissions_old;
DROP POLICY IF EXISTS "commissions_old_insert_tenant" ON public.commissions_old;

CREATE POLICY "commissions_old_select_tenant" ON public.commissions_old FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "commissions_old_insert_tenant" ON public.commissions_old FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commissions_old_update_tenant" ON public.commissions_old FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commissions_old_delete_tenant" ON public.commissions_old FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- COMMISSIONS_V2
DROP POLICY IF EXISTS "commissions_v2_delete_tenant" ON public.commissions_v2;
DROP POLICY IF EXISTS "commissions_v2_select_tenant" ON public.commissions_v2;
DROP POLICY IF EXISTS "commissions_v2_update_tenant" ON public.commissions_v2;
DROP POLICY IF EXISTS "commissions_v2_insert_tenant" ON public.commissions_v2;

CREATE POLICY "commissions_v2_select_tenant" ON public.commissions_v2 FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "commissions_v2_insert_tenant" ON public.commissions_v2 FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commissions_v2_update_tenant" ON public.commissions_v2 FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "commissions_v2_delete_tenant" ON public.commissions_v2 FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- QUESTIONS
DROP POLICY IF EXISTS "questions_delete_tenant" ON public.questions;
DROP POLICY IF EXISTS "questions_select_tenant" ON public.questions;
DROP POLICY IF EXISTS "questions_update_tenant" ON public.questions;
DROP POLICY IF EXISTS "questions_insert_tenant" ON public.questions;

CREATE POLICY "questions_select_tenant" ON public.questions FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "questions_insert_tenant" ON public.questions FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "questions_update_tenant" ON public.questions FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "questions_delete_tenant" ON public.questions FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- RAIOX_ANALYSES
DROP POLICY IF EXISTS "raiox_analyses_delete_tenant" ON public.raiox_analyses;
DROP POLICY IF EXISTS "raiox_analyses_select_tenant" ON public.raiox_analyses;
DROP POLICY IF EXISTS "raiox_analyses_update_tenant" ON public.raiox_analyses;
DROP POLICY IF EXISTS "raiox_analyses_insert_tenant" ON public.raiox_analyses;

CREATE POLICY "raiox_analyses_select_tenant" ON public.raiox_analyses FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "raiox_analyses_insert_tenant" ON public.raiox_analyses FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "raiox_analyses_update_tenant" ON public.raiox_analyses FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "raiox_analyses_delete_tenant" ON public.raiox_analyses FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- RECURRING_CLIENTS
DROP POLICY IF EXISTS "recurring_clients_delete_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_select_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_update_tenant" ON public.recurring_clients;
DROP POLICY IF EXISTS "recurring_clients_insert_tenant" ON public.recurring_clients;

CREATE POLICY "recurring_clients_select_tenant" ON public.recurring_clients FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "recurring_clients_insert_tenant" ON public.recurring_clients FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_clients_update_tenant" ON public.recurring_clients FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_clients_delete_tenant" ON public.recurring_clients FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- RECURRING_ROUTINES
DROP POLICY IF EXISTS "recurring_routines_delete_tenant" ON public.recurring_routines;
DROP POLICY IF EXISTS "recurring_routines_select_tenant" ON public.recurring_routines;
DROP POLICY IF EXISTS "recurring_routines_update_tenant" ON public.recurring_routines;
DROP POLICY IF EXISTS "recurring_routines_insert_tenant" ON public.recurring_routines;

CREATE POLICY "recurring_routines_select_tenant" ON public.recurring_routines FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "recurring_routines_insert_tenant" ON public.recurring_routines FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_routines_update_tenant" ON public.recurring_routines FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_routines_delete_tenant" ON public.recurring_routines FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- RECURRING_TASKS
DROP POLICY IF EXISTS "recurring_tasks_delete_tenant" ON public.recurring_tasks;
DROP POLICY IF EXISTS "recurring_tasks_select_tenant" ON public.recurring_tasks;
DROP POLICY IF EXISTS "recurring_tasks_update_tenant" ON public.recurring_tasks;
DROP POLICY IF EXISTS "recurring_tasks_insert_tenant" ON public.recurring_tasks;

CREATE POLICY "recurring_tasks_select_tenant" ON public.recurring_tasks FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "recurring_tasks_insert_tenant" ON public.recurring_tasks FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_tasks_update_tenant" ON public.recurring_tasks FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "recurring_tasks_delete_tenant" ON public.recurring_tasks FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- SUGGESTIONS
DROP POLICY IF EXISTS "suggestions_delete_tenant" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_select_tenant" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_update_tenant" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_insert_tenant" ON public.suggestions;
DROP POLICY IF EXISTS "Admins can view suggestions from colaboradores" ON public.suggestions;
DROP POLICY IF EXISTS "Super admins can view suggestions from admins" ON public.suggestions;
DROP POLICY IF EXISTS "Admins can update suggestions status" ON public.suggestions;

CREATE POLICY "suggestions_select_tenant" ON public.suggestions FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "suggestions_insert_tenant" ON public.suggestions FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "suggestions_update_tenant" ON public.suggestions FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "suggestions_delete_tenant" ON public.suggestions FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- TASK_TIME_ENTRIES
DROP POLICY IF EXISTS "task_time_entries_delete_tenant" ON public.task_time_entries;
DROP POLICY IF EXISTS "task_time_entries_select_tenant" ON public.task_time_entries;
DROP POLICY IF EXISTS "task_time_entries_update_tenant" ON public.task_time_entries;
DROP POLICY IF EXISTS "task_time_entries_insert_tenant" ON public.task_time_entries;

CREATE POLICY "task_time_entries_select_tenant" ON public.task_time_entries FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "task_time_entries_insert_tenant" ON public.task_time_entries FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "task_time_entries_update_tenant" ON public.task_time_entries FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "task_time_entries_delete_tenant" ON public.task_time_entries FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- LEAD_SOURCES
DROP POLICY IF EXISTS "lead_sources_delete_tenant" ON public.lead_sources;
DROP POLICY IF EXISTS "lead_sources_select_tenant" ON public.lead_sources;
DROP POLICY IF EXISTS "lead_sources_update_tenant" ON public.lead_sources;
DROP POLICY IF EXISTS "lead_sources_insert_tenant" ON public.lead_sources;

CREATE POLICY "lead_sources_select_tenant" ON public.lead_sources FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "lead_sources_insert_tenant" ON public.lead_sources FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "lead_sources_update_tenant" ON public.lead_sources FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "lead_sources_delete_tenant" ON public.lead_sources FOR DELETE TO authenticated
USING (agency_id = current_agency_id());

-- LOST_REASONS
DROP POLICY IF EXISTS "lost_reasons_delete_tenant" ON public.lost_reasons;
DROP POLICY IF EXISTS "lost_reasons_select_tenant" ON public.lost_reasons;
DROP POLICY IF EXISTS "lost_reasons_update_tenant" ON public.lost_reasons;
DROP POLICY IF EXISTS "lost_reasons_insert_tenant" ON public.lost_reasons;

CREATE POLICY "lost_reasons_select_tenant" ON public.lost_reasons FOR SELECT TO authenticated
USING (agency_id = current_agency_id());
CREATE POLICY "lost_reasons_insert_tenant" ON public.lost_reasons FOR INSERT TO authenticated
WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "lost_reasons_update_tenant" ON public.lost_reasons FOR UPDATE TO authenticated
USING (agency_id = current_agency_id()) WITH CHECK (agency_id = current_agency_id());
CREATE POLICY "lost_reasons_delete_tenant" ON public.lost_reasons FOR DELETE TO authenticated
USING (agency_id = current_agency_id());
