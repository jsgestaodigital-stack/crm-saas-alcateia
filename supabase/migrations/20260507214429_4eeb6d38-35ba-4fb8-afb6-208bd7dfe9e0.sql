
DROP VIEW IF EXISTS public.leads_expanded;
DROP VIEW IF EXISTS public.lead_metrics_by_stage;

ALTER TABLE public.leads ALTER COLUMN pipeline_stage DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN pipeline_stage TYPE text USING pipeline_stage::text;
ALTER TABLE public.leads ALTER COLUMN pipeline_stage SET DEFAULT 'cold';

CREATE VIEW public.leads_expanded AS
SELECT id, company_name, contact_name, whatsapp, phone, email, city, main_category,
  source_id, source_custom, pipeline_stage, temperature, probability, estimated_value,
  next_action, next_action_date, proposal_url, proposal_status, proposal_notes, status,
  lost_reason_id, lost_notes, converted_client_id, converted_at, notes, responsible,
  created_by, created_at, updated_at, last_activity_at, agency_id,
  ( SELECT jsonb_object_agg(cf.field_key, fv.value)
      FROM lead_custom_fields cf
      JOIN lead_field_values fv ON fv.field_id = cf.id
      WHERE fv.lead_id = l.id) AS custom_fields,
  ( SELECT jsonb_agg(jsonb_build_object('name', t.name, 'color', t.color))
      FROM lead_tag_assignments ta
      JOIN lead_tags t ON t.id = ta.tag_id
      WHERE ta.lead_id = l.id) AS tags
FROM public.leads l;

CREATE VIEW public.lead_metrics_by_stage AS
SELECT pipeline_stage,
  count(*) AS total_leads,
  sum(CASE WHEN temperature = 'hot'::lead_temperature THEN 1 ELSE 0 END) AS hot_leads,
  sum(CASE WHEN temperature = 'warm'::lead_temperature THEN 1 ELSE 0 END) AS warm_leads,
  sum(CASE WHEN temperature = 'cold'::lead_temperature THEN 1 ELSE 0 END) AS cold_leads,
  sum(estimated_value) AS total_value
FROM public.leads
WHERE agency_id = current_agency_id()
GROUP BY pipeline_stage;

ALTER TABLE public.leads REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leads';
  END IF;
END $$;
