-- Tables already created partially, drop and recreate
DROP TABLE IF EXISTS public.proposal_views CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.proposal_templates CASCADE;
DROP TYPE IF EXISTS public.full_proposal_status CASCADE;

-- Create full proposal status enum
CREATE TYPE public.full_proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city TEXT,
  
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  
  full_price NUMERIC(10,2),
  discounted_price NUMERIC(10,2),
  installments INTEGER,
  installment_value NUMERIC(10,2),
  payment_method TEXT,
  discount_reason TEXT,
  
  valid_until DATE,
  
  status public.full_proposal_status NOT NULL DEFAULT 'draft',
  
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  public_url TEXT,
  
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proposal templates table
CREATE TABLE public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proposal views tracking table
CREATE TABLE public.proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  duration_seconds INTEGER
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for proposals using existing pattern with agency_members
CREATE POLICY "Users can view proposals from their agency" ON public.proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposals.agency_id
    )
  );

CREATE POLICY "Users can create proposals in their agency" ON public.proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposals.agency_id
    )
  );

CREATE POLICY "Users can update proposals in their agency" ON public.proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposals.agency_id
    )
  );

CREATE POLICY "Users can delete proposals in their agency" ON public.proposals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposals.agency_id
    )
  );

-- RLS policies for proposal templates
CREATE POLICY "Users can view templates from their agency" ON public.proposal_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposal_templates.agency_id
    )
  );

CREATE POLICY "Users can create templates in their agency" ON public.proposal_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposal_templates.agency_id
    )
  );

CREATE POLICY "Users can update templates in their agency" ON public.proposal_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposal_templates.agency_id
    )
  );

CREATE POLICY "Users can delete templates in their agency" ON public.proposal_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am 
      WHERE am.user_id = auth.uid() AND am.agency_id = proposal_templates.agency_id
    )
  );

-- RLS policies for proposal views
CREATE POLICY "Agency members can view proposal views" ON public.proposal_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.proposals p 
      JOIN public.agency_members am ON am.agency_id = p.agency_id
      WHERE p.id = proposal_views.proposal_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can log a view for public proposals" ON public.proposal_views
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_proposals_agency_id ON public.proposals(agency_id);
CREATE INDEX idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_public_token ON public.proposals(public_token);
CREATE INDEX idx_proposal_templates_agency_id ON public.proposal_templates(agency_id);
CREATE INDEX idx_proposal_views_proposal_id ON public.proposal_views(proposal_id);

-- Update trigger for proposals
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for templates
CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to record proposal view
CREATE OR REPLACE FUNCTION public.record_proposal_view(
  _token TEXT,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _referrer TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _proposal RECORD;
BEGIN
  SELECT * INTO _proposal FROM public.proposals WHERE public_token = _token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
  END IF;
  
  IF _proposal.valid_until IS NOT NULL AND _proposal.valid_until < CURRENT_DATE THEN
    UPDATE public.proposals SET status = 'expired' WHERE id = _proposal.id;
    RETURN jsonb_build_object('success', false, 'error', 'Proposal expired');
  END IF;
  
  INSERT INTO public.proposal_views (proposal_id, ip_address, user_agent, referrer)
  VALUES (_proposal.id, _ip::inet, _user_agent, _referrer);
  
  UPDATE public.proposals
  SET 
    view_count = view_count + 1,
    last_viewed_at = now(),
    first_viewed_at = COALESCE(first_viewed_at, now()),
    status = CASE WHEN status = 'sent' THEN 'viewed'::public.full_proposal_status ELSE status END
  WHERE id = _proposal.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'proposal', jsonb_build_object(
      'id', _proposal.id,
      'title', _proposal.title,
      'client_name', _proposal.client_name,
      'company_name', _proposal.company_name,
      'blocks', _proposal.blocks,
      'full_price', _proposal.full_price,
      'discounted_price', _proposal.discounted_price,
      'installments', _proposal.installments,
      'installment_value', _proposal.installment_value,
      'payment_method', _proposal.payment_method,
      'discount_reason', _proposal.discount_reason,
      'valid_until', _proposal.valid_until,
      'status', _proposal.status
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_proposal_view(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_proposal_view(TEXT, TEXT, TEXT, TEXT) TO authenticated;