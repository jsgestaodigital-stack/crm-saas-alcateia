-- =============================================
-- ETAPA 7.2, 7.3, 7.4 – TABELAS DEPENDENTES + VIEW + FUNÇÕES
-- =============================================

-- Enum para status de recorrência
DO $$ BEGIN
  CREATE TYPE public.recurring_status AS ENUM ('active', 'paused', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para status de fatura
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 7.3 – TABELA client_recurring_history
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_recurring_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients_v2(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly',
  notes TEXT,
  status public.recurring_status NOT NULL DEFAULT 'active',
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_recurring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_recurring_history FORCE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own agency recurring"
  ON public.client_recurring_history FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Members can insert recurring"
  ON public.client_recurring_history FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "Members can update own agency recurring"
  ON public.client_recurring_history FOR UPDATE
  USING (agency_id = public.current_agency_id());

CREATE OR REPLACE FUNCTION public.client_recurring_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency UUID;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT agency_id INTO v_agency FROM public.clients_v2 WHERE id = NEW.client_id LIMIT 1;
    IF v_agency IS NOT NULL THEN NEW.agency_id := v_agency; END IF;
  END IF;
  IF NEW.agency_id IS NULL THEN NEW.agency_id := public.current_agency_id(); END IF;
  IF NEW.agency_id IS NULL THEN RAISE EXCEPTION 'No agency found for recurring history'; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER client_recurring_set_agency_trigger
  BEFORE INSERT ON public.client_recurring_history
  FOR EACH ROW EXECUTE FUNCTION public.client_recurring_set_agency_id();

CREATE TRIGGER client_recurring_update_timestamp_trigger
  BEFORE UPDATE ON public.client_recurring_history
  FOR EACH ROW EXECUTE FUNCTION public.clients_v2_update_timestamp();

CREATE INDEX IF NOT EXISTS idx_recurring_history_client ON public.client_recurring_history(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_agency ON public.client_recurring_history(agency_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_status ON public.client_recurring_history(status);

-- =============================================
-- 7.4 – TABELA client_invoices
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients_v2(id) ON DELETE CASCADE,
  recurring_id UUID REFERENCES public.client_recurring_history(id),
  invoice_number TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  payment_method TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own agency invoices"
  ON public.client_invoices FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Members can insert invoices"
  ON public.client_invoices FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "Members can update own agency invoices"
  ON public.client_invoices FOR UPDATE
  USING (agency_id = public.current_agency_id());

CREATE OR REPLACE FUNCTION public.client_invoices_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency UUID;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT agency_id INTO v_agency FROM public.clients_v2 WHERE id = NEW.client_id LIMIT 1;
    IF v_agency IS NOT NULL THEN NEW.agency_id := v_agency; END IF;
  END IF;
  IF NEW.agency_id IS NULL THEN NEW.agency_id := public.current_agency_id(); END IF;
  IF NEW.agency_id IS NULL THEN RAISE EXCEPTION 'No agency found for invoice'; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER client_invoices_set_agency_trigger
  BEFORE INSERT ON public.client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.client_invoices_set_agency_id();

CREATE TRIGGER client_invoices_update_timestamp_trigger
  BEFORE UPDATE ON public.client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.clients_v2_update_timestamp();

CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency ON public.client_invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.client_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.client_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.client_invoices(invoice_number);

-- =============================================
-- 7.2 – VIEW EXPANDIDA
-- =============================================

CREATE OR REPLACE VIEW public.clients_v2_expanded AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM public.client_recurring_history h WHERE h.client_id = c.id) AS recurring_count,
  (SELECT COUNT(*) FROM public.client_invoices i WHERE i.client_id = c.id) AS invoices_count
FROM public.clients_v2 c
WHERE c.deleted_at IS NULL;

-- =============================================
-- FUNÇÕES UTILITÁRIAS
-- =============================================

-- Função de busca avançada
CREATE OR REPLACE FUNCTION public.search_clients_v2(
  _search TEXT DEFAULT NULL, _status TEXT DEFAULT NULL, _tags TEXT[] DEFAULT NULL,
  _start_date_from DATE DEFAULT NULL, _start_date_to DATE DEFAULT NULL,
  _responsible TEXT DEFAULT NULL, _custom_field_filters JSONB DEFAULT NULL,
  _limit INTEGER DEFAULT 100, _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, company_name TEXT, contact_name TEXT, email TEXT, phone TEXT, whatsapp TEXT, city TEXT,
  status public.client_status_v2, start_date DATE, end_date DATE, monthly_value NUMERIC,
  plan_name TEXT, responsible TEXT, custom_fields JSONB, tags JSONB, notes TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.company_name, c.contact_name, c.email, c.phone, c.whatsapp, c.city, c.status,
    c.start_date, c.end_date, c.monthly_value, c.plan_name, c.responsible, c.custom_fields,
    c.tags, c.notes, c.created_at, c.updated_at
  FROM public.clients_v2 c
  WHERE c.agency_id = public.current_agency_id() AND c.deleted_at IS NULL
    AND (_search IS NULL OR _search = '' OR c.company_name ILIKE '%' || _search || '%' OR c.contact_name ILIKE '%' || _search || '%' OR c.email ILIKE '%' || _search || '%')
    AND (_status IS NULL OR c.status::TEXT = _status)
    AND (_responsible IS NULL OR _responsible = '' OR c.responsible ILIKE '%' || _responsible || '%')
    AND (_start_date_from IS NULL OR c.start_date >= _start_date_from)
    AND (_start_date_to IS NULL OR c.start_date <= _start_date_to)
    AND (_tags IS NULL OR array_length(_tags, 1) IS NULL OR c.tags ?| _tags)
    AND (_custom_field_filters IS NULL OR _custom_field_filters = '{}'::jsonb OR c.custom_fields @> _custom_field_filters)
  ORDER BY c.updated_at DESC LIMIT _limit OFFSET _offset;
END;
$$;

-- Função de contagem
CREATE OR REPLACE FUNCTION public.count_clients_v2(
  _search TEXT DEFAULT NULL, _status TEXT DEFAULT NULL, _tags TEXT[] DEFAULT NULL,
  _start_date_from DATE DEFAULT NULL, _start_date_to DATE DEFAULT NULL,
  _responsible TEXT DEFAULT NULL, _custom_field_filters JSONB DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count FROM public.clients_v2 c
  WHERE c.agency_id = public.current_agency_id() AND c.deleted_at IS NULL
    AND (_search IS NULL OR _search = '' OR c.company_name ILIKE '%' || _search || '%' OR c.contact_name ILIKE '%' || _search || '%' OR c.email ILIKE '%' || _search || '%')
    AND (_status IS NULL OR c.status::TEXT = _status)
    AND (_responsible IS NULL OR _responsible = '' OR c.responsible ILIKE '%' || _responsible || '%')
    AND (_start_date_from IS NULL OR c.start_date >= _start_date_from)
    AND (_start_date_to IS NULL OR c.start_date <= _start_date_to)
    AND (_tags IS NULL OR array_length(_tags, 1) IS NULL OR c.tags ?| _tags)
    AND (_custom_field_filters IS NULL OR _custom_field_filters = '{}'::jsonb OR c.custom_fields @> _custom_field_filters);
  RETURN v_count;
END;
$$;

-- Função de exportação
CREATE OR REPLACE FUNCTION public.export_clients_v2(_search TEXT DEFAULT NULL, _status TEXT DEFAULT NULL, _tags TEXT[] DEFAULT NULL)
RETURNS TABLE(
  id UUID, company_name TEXT, contact_name TEXT, email TEXT, phone TEXT, whatsapp TEXT, city TEXT,
  status TEXT, start_date TEXT, end_date TEXT, monthly_value NUMERIC, plan_name TEXT,
  responsible TEXT, notes TEXT, custom_fields JSONB, tags TEXT, created_at TEXT, updated_at TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.log_action('export', 'clients_v2', NULL, NULL, NULL, jsonb_build_object('filters', jsonb_build_object('search', _search, 'status', _status, 'tags', _tags)), NULL);
  RETURN QUERY
  SELECT c.id, c.company_name, c.contact_name, c.email, c.phone, c.whatsapp, c.city, c.status::TEXT,
    TO_CHAR(c.start_date, 'YYYY-MM-DD'), TO_CHAR(c.end_date, 'YYYY-MM-DD'), c.monthly_value, c.plan_name,
    c.responsible, c.notes, c.custom_fields,
    (SELECT string_agg(t::TEXT, ', ') FROM jsonb_array_elements_text(c.tags) AS t),
    TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(c.updated_at, 'YYYY-MM-DD HH24:MI:SS')
  FROM public.clients_v2 c
  WHERE c.agency_id = public.current_agency_id() AND c.deleted_at IS NULL
    AND (_search IS NULL OR _search = '' OR c.company_name ILIKE '%' || _search || '%' OR c.contact_name ILIKE '%' || _search || '%')
    AND (_status IS NULL OR c.status::TEXT = _status)
    AND (_tags IS NULL OR array_length(_tags, 1) IS NULL OR c.tags ?| _tags)
  ORDER BY c.updated_at DESC;
END;
$$;

-- Função para adicionar recorrência
CREATE OR REPLACE FUNCTION public.add_client_recurring(
  _client_id UUID, _plan_name TEXT, _amount NUMERIC, _start_date DATE DEFAULT CURRENT_DATE,
  _billing_cycle TEXT DEFAULT 'monthly', _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID; v_agency UUID;
BEGIN
  SELECT agency_id INTO v_agency FROM public.clients_v2 WHERE id = _client_id AND deleted_at IS NULL;
  IF v_agency IS NULL THEN RAISE EXCEPTION 'Client not found'; END IF;
  UPDATE public.client_recurring_history SET status = 'completed', end_date = CURRENT_DATE, updated_at = now() WHERE client_id = _client_id AND status = 'active';
  INSERT INTO public.client_recurring_history (agency_id, client_id, plan_name, amount, start_date, billing_cycle, notes)
  VALUES (v_agency, _client_id, _plan_name, _amount, _start_date, _billing_cycle, _notes) RETURNING id INTO v_id;
  UPDATE public.clients_v2 SET plan_name = _plan_name, monthly_value = _amount, status = 'active', updated_at = now() WHERE id = _client_id;
  PERFORM public.log_action('add_recurring', 'client', _client_id::TEXT, NULL, NULL, jsonb_build_object('plan', _plan_name, 'amount', _amount), NULL);
  RETURN v_id;
END;
$$;

-- Função para cancelar recorrência
CREATE OR REPLACE FUNCTION public.cancel_client_recurring(_client_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.client_recurring_history SET status = 'cancelled', end_date = CURRENT_DATE, cancelled_at = now(), cancelled_reason = _reason, updated_at = now() WHERE client_id = _client_id AND status = 'active';
  UPDATE public.clients_v2 SET status = 'cancelled', end_date = CURRENT_DATE, updated_at = now() WHERE id = _client_id;
  PERFORM public.log_action('cancel_recurring', 'client', _client_id::TEXT, NULL, NULL, jsonb_build_object('reason', _reason), NULL);
END;
$$;

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_agency_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.client_invoices WHERE agency_id = _agency_id AND created_at >= DATE_TRUNC('year', CURRENT_DATE);
  RETURN 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;

-- Função para gerar fatura manual
CREATE OR REPLACE FUNCTION public.generate_manual_invoice(
  _client_id UUID, _amount NUMERIC, _due_date DATE, _description TEXT DEFAULT NULL, _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID; v_agency UUID; v_invoice_number TEXT; v_client_name TEXT;
BEGIN
  SELECT agency_id, company_name INTO v_agency, v_client_name FROM public.clients_v2 WHERE id = _client_id AND deleted_at IS NULL;
  IF v_agency IS NULL THEN RAISE EXCEPTION 'Client not found'; END IF;
  v_invoice_number := public.generate_invoice_number(v_agency);
  INSERT INTO public.client_invoices (agency_id, client_id, invoice_number, description, amount, due_date, notes)
  VALUES (v_agency, _client_id, v_invoice_number, COALESCE(_description, 'Fatura para ' || v_client_name), _amount, _due_date, _notes) RETURNING id INTO v_id;
  PERFORM public.log_action('create_invoice', 'invoice', v_id::TEXT, v_invoice_number, NULL, jsonb_build_object('client_id', _client_id, 'amount', _amount, 'due_date', _due_date), NULL);
  RETURN v_id;
END;
$$;

-- Função para marcar fatura como paga
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(_invoice_id UUID, _paid_amount NUMERIC DEFAULT NULL, _payment_method TEXT DEFAULT 'manual')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_invoice RECORD;
BEGIN
  SELECT * INTO v_invoice FROM public.client_invoices WHERE id = _invoice_id AND agency_id = public.current_agency_id();
  IF v_invoice IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;
  UPDATE public.client_invoices SET status = 'paid', paid_at = now(), paid_amount = COALESCE(_paid_amount, amount), payment_method = _payment_method, updated_at = now() WHERE id = _invoice_id;
  PERFORM public.log_action('pay_invoice', 'invoice', _invoice_id::TEXT, v_invoice.invoice_number, jsonb_build_object('status', v_invoice.status::TEXT), jsonb_build_object('status', 'paid', 'paid_amount', COALESCE(_paid_amount, v_invoice.amount)), NULL);
END;
$$;

-- Fix search_path for clients_v2_update_timestamp
CREATE OR REPLACE FUNCTION public.clients_v2_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;