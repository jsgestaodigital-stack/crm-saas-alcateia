-- =============================================
-- BLOCO 12 – SISTEMA DE PERMISSÕES (CORRIGIDO)
-- =============================================

-- 1. Adicionar coluna agency_id se não existir
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- 2. Adicionar outras colunas que podem estar faltando
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS granted_by UUID,
ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Criar enum para roles (se não existir)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'owner',
    'manager',
    'sales_rep',
    'operator',
    'support',
    'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_user_roles_agency_id ON public.user_roles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 5. Unique constraint
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_agency_unique UNIQUE (user_id, agency_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Tabela de permissões por role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

-- Inserir permissões padrão
INSERT INTO public.role_permissions (role, permission) VALUES
  ('super_admin', 'manage_agencies'),
  ('super_admin', 'manage_all_users'),
  ('super_admin', 'view_all_data'),
  ('super_admin', 'manage_billing'),
  ('super_admin', 'manage_roles'),
  ('owner', 'manage_agency'),
  ('owner', 'manage_users'),
  ('owner', 'manage_roles'),
  ('owner', 'manage_clients'),
  ('owner', 'manage_leads'),
  ('owner', 'manage_commissions'),
  ('owner', 'view_reports'),
  ('owner', 'export_data'),
  ('owner', 'manage_settings'),
  ('manager', 'manage_users'),
  ('manager', 'manage_clients'),
  ('manager', 'manage_leads'),
  ('manager', 'manage_commissions'),
  ('manager', 'view_reports'),
  ('manager', 'export_data'),
  ('manager', 'assign_tasks'),
  ('sales_rep', 'view_leads'),
  ('sales_rep', 'edit_own_leads'),
  ('sales_rep', 'create_leads'),
  ('sales_rep', 'view_clients'),
  ('sales_rep', 'view_own_commissions'),
  ('operator', 'view_clients'),
  ('operator', 'edit_assigned_clients'),
  ('operator', 'complete_tasks'),
  ('operator', 'add_activities'),
  ('operator', 'view_own_commissions'),
  ('support', 'view_clients'),
  ('support', 'add_notes'),
  ('support', 'view_activities'),
  ('viewer', 'view_clients'),
  ('viewer', 'view_leads'),
  ('viewer', 'view_reports')
ON CONFLICT (role, permission) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.role_permissions TO authenticated;