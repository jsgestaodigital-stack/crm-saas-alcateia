-- =============================================
-- ETAPA 7.1 – ESTRUTURA BASE clients_v2
-- =============================================

-- Enum para status de cliente
DO $$ BEGIN
  CREATE TYPE public.client_status_v2 AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela principal clients_v2
CREATE TABLE IF NOT EXISTS public.clients_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  main_category TEXT,
  status public.client_status_v2 NOT NULL DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_value NUMERIC(12,2),
  plan_name TEXT,
  custom_fields JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  notes TEXT,
  responsible TEXT,
  google_profile_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para clients_v2
ALTER TABLE public.clients_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_v2 FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view own agency clients_v2"
  ON public.clients_v2 FOR SELECT
  USING (agency_id = public.current_agency_id() AND deleted_at IS NULL);

CREATE POLICY "Members can insert clients_v2"
  ON public.clients_v2 FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "Members can update own agency clients_v2"
  ON public.clients_v2 FOR UPDATE
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Admins can delete clients_v2"
  ON public.clients_v2 FOR DELETE
  USING (agency_id = public.current_agency_id());

-- Trigger para set_agency_id
CREATE OR REPLACE FUNCTION public.clients_v2_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found for client';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_v2_set_agency_trigger
  BEFORE INSERT ON public.clients_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.clients_v2_set_agency_id();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.clients_v2_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_v2_update_timestamp_trigger
  BEFORE UPDATE ON public.clients_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.clients_v2_update_timestamp();

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_v2_agency ON public.clients_v2(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_v2_status ON public.clients_v2(status);
CREATE INDEX IF NOT EXISTS idx_clients_v2_email ON public.clients_v2(email);
CREATE INDEX IF NOT EXISTS idx_clients_v2_start_date ON public.clients_v2(start_date);
CREATE INDEX IF NOT EXISTS idx_clients_v2_end_date ON public.clients_v2(end_date);
CREATE INDEX IF NOT EXISTS idx_clients_v2_deleted ON public.clients_v2(deleted_at) WHERE deleted_at IS NULL;