-- Fix security definer view by using security invoker
DROP VIEW IF EXISTS public.clients_v2_expanded;

CREATE VIEW public.clients_v2_expanded
WITH (security_invoker = true)
AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM public.client_recurring_history h WHERE h.client_id = c.id) AS recurring_count,
  (SELECT COUNT(*) FROM public.client_invoices i WHERE i.client_id = c.id) AS invoices_count
FROM public.clients_v2 c
WHERE c.deleted_at IS NULL;