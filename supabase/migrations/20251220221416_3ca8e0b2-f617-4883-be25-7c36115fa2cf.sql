-- Corrigir VIEW com SECURITY INVOKER para respeitar RLS do usuário
DROP VIEW IF EXISTS public.leads_expanded;

CREATE VIEW public.leads_expanded
WITH (security_invoker = true)
AS
SELECT
  l.*,
  (
    SELECT jsonb_object_agg(cf.field_key, fv.value)
    FROM public.lead_custom_fields cf
    JOIN public.lead_field_values fv ON fv.field_id = cf.id
    WHERE fv.lead_id = l.id
  ) AS custom_fields,
  (
    SELECT jsonb_agg(jsonb_build_object('name', t.name, 'color', t.color))
    FROM public.lead_tag_assignments ta
    JOIN public.lead_tags t ON t.id = ta.tag_id
    WHERE ta.lead_id = l.id
  ) AS tags
FROM public.leads l;

-- Permissões
GRANT SELECT ON public.leads_expanded TO authenticated;