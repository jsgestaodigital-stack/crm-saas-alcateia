-- Add Autentique integration fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS autentique_document_id TEXT,
ADD COLUMN IF NOT EXISTS autentique_document_url TEXT,
ADD COLUMN IF NOT EXISTS autentique_sign_url TEXT,
ADD COLUMN IF NOT EXISTS autentique_status TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create contract_events table for tracking events
CREATE TABLE IF NOT EXISTS public.contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contract_events
ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contract_events
CREATE POLICY "Agency members can view contract events"
ON public.contract_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.agency_members am ON am.agency_id = c.agency_id
    WHERE c.id = contract_events.contract_id
    AND am.user_id = auth.uid()
  )
);

CREATE POLICY "Agency members can insert contract events"
ON public.contract_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.agency_members am ON am.agency_id = c.agency_id
    WHERE c.id = contract_events.contract_id
    AND am.user_id = auth.uid()
  )
);

-- Allow public insert for webhook events (from Autentique)
CREATE POLICY "Allow public insert for webhook events"
ON public.contract_events
FOR INSERT
WITH CHECK (event_type LIKE 'autentique.%');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_events_contract_id ON public.contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_autentique_document_id ON public.contracts(autentique_document_id);