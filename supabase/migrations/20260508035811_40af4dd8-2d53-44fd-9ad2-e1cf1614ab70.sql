-- Performance indexes (Dimensão 3)
-- Note: CONCURRENTLY não é compatível com transações de migração; usamos IF NOT EXISTS.

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity_at ON public.leads (last_activity_at DESC NULLS LAST);

-- Lead activities (composto p/ feed por agência)
CREATE INDEX IF NOT EXISTS idx_lead_activities_agency_created
  ON public.lead_activities (agency_id, created_at DESC);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON public.clients (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_last_update ON public.clients (last_update DESC NULLS LAST);

-- Contracts / templates
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_at ON public.contract_templates (created_at DESC);

-- Proposals / templates
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_created_at ON public.proposal_templates (created_at DESC);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions (created_at DESC);

-- Suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_author_id ON public.suggestions (author_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions (created_at DESC);

-- Recurring
CREATE INDEX IF NOT EXISTS idx_recurring_clients_client_id ON public.recurring_clients (client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_routines_active_sort
  ON public.recurring_routines (active, sort_order);

-- Commissions / lookup tables
CREATE INDEX IF NOT EXISTS idx_commission_configs_active_event
  ON public.commission_configs (active, trigger_event);
CREATE INDEX IF NOT EXISTS idx_commission_roles_active_sort
  ON public.commission_roles (active, sort_order);
CREATE INDEX IF NOT EXISTS idx_lead_sources_active_label
  ON public.lead_sources (active, label);
CREATE INDEX IF NOT EXISTS idx_lost_reasons_active_sort
  ON public.lost_reasons (active, sort_order);
CREATE INDEX IF NOT EXISTS idx_plans_active_sort
  ON public.plans (active, sort_order);

-- Sessions / invites / audit / subscriptions / super admin
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity
  ON public.active_sessions (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_invites_created_at
  ON public.agency_invites (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end
  ON public.subscriptions (current_period_end);
CREATE INDEX IF NOT EXISTS idx_system_audit_runs_started_at
  ON public.system_audit_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_super_admin_alerts_unresolved
  ON public.super_admin_alerts (created_at DESC) WHERE is_resolved = false;

-- Consents
CREATE INDEX IF NOT EXISTS idx_user_consents_policy_type ON public.user_consents (policy_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_accepted_at
  ON public.user_consents (accepted_at DESC);
