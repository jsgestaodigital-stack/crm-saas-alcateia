-- Fix search_path for record_proposal_view function
CREATE OR REPLACE FUNCTION public.record_proposal_view(
  _token TEXT,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _referrer TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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