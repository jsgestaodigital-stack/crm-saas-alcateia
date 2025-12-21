-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled');

-- Create contract type enum
CREATE TYPE public.contract_type AS ENUM ('single_optimization', 'recurring', 'custom');

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Contract metadata
  title TEXT NOT NULL,
  contract_type public.contract_type NOT NULL DEFAULT 'single_optimization',
  status public.contract_status NOT NULL DEFAULT 'draft',
  
  -- Party information
  contractor_name TEXT,
  contractor_cnpj TEXT,
  contractor_cpf TEXT,
  contractor_address TEXT,
  contractor_email TEXT,
  contractor_phone TEXT,
  contractor_responsible TEXT,
  
  contracted_name TEXT,
  contracted_cnpj TEXT,
  contracted_cpf TEXT,
  contracted_address TEXT,
  contracted_email TEXT,
  contracted_phone TEXT,
  contracted_responsible TEXT,
  
  -- Contract content
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  
  -- Pricing
  full_price NUMERIC(10,2),
  discounted_price NUMERIC(10,2),
  installments INTEGER DEFAULT 1,
  installment_value NUMERIC(10,2),
  payment_method TEXT,
  
  -- Execution
  execution_term_days INTEGER DEFAULT 30,
  start_date DATE,
  end_date DATE,
  
  -- Recurring specific
  is_recurring BOOLEAN DEFAULT false,
  billing_cycle TEXT DEFAULT 'monthly',
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Tracking
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  public_url TEXT,
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  -- Signature
  client_signature_name TEXT,
  client_signature_cpf TEXT,
  client_signed_at TIMESTAMPTZ,
  client_ip_address INET,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract templates table
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  contract_type public.contract_type NOT NULL DEFAULT 'single_optimization',
  
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract views tracking
CREATE TABLE public.contract_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  duration_seconds INTEGER
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_views ENABLE ROW LEVEL SECURITY;

-- RLS for contracts
CREATE POLICY "Users can view contracts from their agency"
ON public.contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contracts.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create contracts in their agency"
ON public.contracts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contracts.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update contracts in their agency"
ON public.contracts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contracts.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete contracts in their agency"
ON public.contracts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contracts.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

-- RLS for contract templates
CREATE POLICY "Users can view templates from their agency"
ON public.contract_templates FOR SELECT
USING (
  is_system = true OR
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contract_templates.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create templates in their agency"
ON public.contract_templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contract_templates.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update templates in their agency"
ON public.contract_templates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contract_templates.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete templates in their agency"
ON public.contract_templates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_members.agency_id = contract_templates.agency_id
    AND agency_members.user_id = auth.uid()
  )
);

-- RLS for contract views (public can insert for tracking)
CREATE POLICY "Anyone can record contract views"
ON public.contract_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view contract views from their agency"
ON public.contract_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.agency_members am ON am.agency_id = c.agency_id
    WHERE c.id = contract_views.contract_id
    AND am.user_id = auth.uid()
  )
);

-- Function to record contract view (public access)
CREATE OR REPLACE FUNCTION public.record_contract_view(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE public_token = p_token;
  
  IF v_contract IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
  END IF;
  
  -- Record view
  INSERT INTO public.contract_views (contract_id, ip_address)
  VALUES (v_contract.id, inet_client_addr());
  
  -- Update contract
  UPDATE public.contracts SET
    view_count = COALESCE(view_count, 0) + 1,
    last_viewed_at = now(),
    first_viewed_at = COALESCE(first_viewed_at, now()),
    status = CASE WHEN status = 'sent' THEN 'viewed'::public.contract_status ELSE status END
  WHERE id = v_contract.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'contract', row_to_json(v_contract)
  );
END;
$$;

-- Grant execute to anon for public access
GRANT EXECUTE ON FUNCTION public.record_contract_view(TEXT) TO anon, authenticated;

-- Function to sign contract
CREATE OR REPLACE FUNCTION public.sign_contract(
  p_token TEXT,
  p_signature_name TEXT,
  p_signature_cpf TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE public_token = p_token;
  
  IF v_contract IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
  END IF;
  
  IF v_contract.status = 'signed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract already signed');
  END IF;
  
  -- Update contract with signature
  UPDATE public.contracts SET
    status = 'signed'::public.contract_status,
    signed_at = now(),
    client_signature_name = p_signature_name,
    client_signature_cpf = p_signature_cpf,
    client_signed_at = now(),
    client_ip_address = inet_client_addr()
  WHERE id = v_contract.id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Contract signed successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.sign_contract(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Indexes
CREATE INDEX idx_contracts_agency ON public.contracts(agency_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_token ON public.contracts(public_token);
CREATE INDEX idx_contract_templates_agency ON public.contract_templates(agency_id);
CREATE INDEX idx_contract_views_contract ON public.contract_views(contract_id);