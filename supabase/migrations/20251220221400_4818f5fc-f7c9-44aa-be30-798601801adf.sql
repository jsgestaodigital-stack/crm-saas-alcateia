-- =============================================
-- ETAPA 5.3 – FILTROS E VISUALIZAÇÃO AVANÇADA
-- =============================================

-- 1. VIEW: leads_expanded com campos customizados
CREATE OR REPLACE VIEW public.leads_expanded AS
SELECT
  l.*,
  (
    SELECT jsonb_object_agg(cf.field_key, fv.value)
    FROM public.lead_custom_fields cf
    JOIN public.lead_field_values fv ON fv.field_id = cf.id
    WHERE fv.lead_id = l.id
  ) AS custom_fields,
  (
    SELECT jsonb_agg(t.name)
    FROM public.lead_tag_assignments ta
    JOIN public.lead_tags t ON t.id = ta.tag_id
    WHERE ta.lead_id = l.id
  ) AS tags
FROM public.leads l;

-- 2. FUNÇÃO: Buscar leads com filtros
CREATE OR REPLACE FUNCTION public.search_leads(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _tags TEXT[] DEFAULT NULL,
  _custom_field_filters JSONB DEFAULT NULL,
  _pipeline_stage TEXT DEFAULT NULL,
  _temperature TEXT DEFAULT NULL,
  _responsible TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 100,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  status lead_status,
  pipeline_stage lead_pipeline_stage,
  temperature lead_temperature,
  responsible TEXT,
  estimated_value NUMERIC,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  custom_fields JSONB,
  tags JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.company_name,
    l.contact_name,
    l.email,
    l.phone,
    l.whatsapp,
    l.status,
    l.pipeline_stage,
    l.temperature,
    l.responsible,
    l.estimated_value,
    l.next_action,
    l.next_action_date,
    l.created_at,
    l.updated_at,
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
  FROM public.leads l
  WHERE l.agency_id = public.current_agency_id()
    AND (_search IS NULL OR _search = '' OR 
         l.company_name ILIKE '%' || _search || '%' OR 
         l.contact_name ILIKE '%' || _search || '%' OR
         l.email ILIKE '%' || _search || '%' OR
         l.phone ILIKE '%' || _search || '%')
    AND (_status IS NULL OR l.status::TEXT = _status)
    AND (_pipeline_stage IS NULL OR l.pipeline_stage::TEXT = _pipeline_stage)
    AND (_temperature IS NULL OR l.temperature::TEXT = _temperature)
    AND (_responsible IS NULL OR _responsible = '' OR l.responsible ILIKE '%' || _responsible || '%')
    AND (
      _tags IS NULL OR array_length(_tags, 1) IS NULL OR EXISTS (
        SELECT 1 FROM public.lead_tag_assignments ta
        JOIN public.lead_tags t ON t.id = ta.tag_id
        WHERE ta.lead_id = l.id AND t.name = ANY(_tags)
      )
    )
    AND (
      _custom_field_filters IS NULL OR _custom_field_filters = '{}'::jsonb OR NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(_custom_field_filters) AS f(k, v)
        LEFT JOIN public.lead_custom_fields cf ON cf.field_key = f.k AND cf.agency_id = l.agency_id
        LEFT JOIN public.lead_field_values fv ON fv.lead_id = l.id AND fv.field_id = cf.id
        WHERE fv.value IS DISTINCT FROM f.v
      )
    )
  ORDER BY l.updated_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- 3. FUNÇÃO: Contar leads com filtros (para paginação)
CREATE OR REPLACE FUNCTION public.count_leads(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _tags TEXT[] DEFAULT NULL,
  _custom_field_filters JSONB DEFAULT NULL,
  _pipeline_stage TEXT DEFAULT NULL,
  _temperature TEXT DEFAULT NULL,
  _responsible TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.leads l
  WHERE l.agency_id = public.current_agency_id()
    AND (_search IS NULL OR _search = '' OR 
         l.company_name ILIKE '%' || _search || '%' OR 
         l.contact_name ILIKE '%' || _search || '%' OR
         l.email ILIKE '%' || _search || '%' OR
         l.phone ILIKE '%' || _search || '%')
    AND (_status IS NULL OR l.status::TEXT = _status)
    AND (_pipeline_stage IS NULL OR l.pipeline_stage::TEXT = _pipeline_stage)
    AND (_temperature IS NULL OR l.temperature::TEXT = _temperature)
    AND (_responsible IS NULL OR _responsible = '' OR l.responsible ILIKE '%' || _responsible || '%')
    AND (
      _tags IS NULL OR array_length(_tags, 1) IS NULL OR EXISTS (
        SELECT 1 FROM public.lead_tag_assignments ta
        JOIN public.lead_tags t ON t.id = ta.tag_id
        WHERE ta.lead_id = l.id AND t.name = ANY(_tags)
      )
    )
    AND (
      _custom_field_filters IS NULL OR _custom_field_filters = '{}'::jsonb OR NOT EXISTS (
        SELECT 1
        FROM jsonb_each_text(_custom_field_filters) AS f(k, v)
        LEFT JOIN public.lead_custom_fields cf ON cf.field_key = f.k AND cf.agency_id = l.agency_id
        LEFT JOIN public.lead_field_values fv ON fv.lead_id = l.id AND fv.field_id = cf.id
        WHERE fv.value IS DISTINCT FROM f.v
      )
    );
  
  RETURN v_count;
END;
$$;

-- 4. FUNÇÃO: Exportação de leads como JSON (para CSV no frontend)
CREATE OR REPLACE FUNCTION public.export_leads(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _tags TEXT[] DEFAULT NULL,
  _pipeline_stage TEXT DEFAULT NULL,
  _temperature TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  status TEXT,
  pipeline_stage TEXT,
  temperature TEXT,
  responsible TEXT,
  estimated_value NUMERIC,
  city TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  custom_fields JSONB,
  tags TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log export action
  PERFORM public.log_action(
    'export',
    'leads',
    NULL,
    NULL,
    NULL,
    jsonb_build_object(
      'filters', jsonb_build_object(
        'search', _search,
        'status', _status,
        'tags', _tags,
        'pipeline_stage', _pipeline_stage,
        'temperature', _temperature
      )
    ),
    NULL
  );

  RETURN QUERY
  SELECT
    l.id,
    l.company_name,
    l.contact_name,
    l.email,
    l.phone,
    l.whatsapp,
    l.status::TEXT,
    l.pipeline_stage::TEXT,
    l.temperature::TEXT,
    l.responsible,
    l.estimated_value,
    l.city,
    l.notes,
    TO_CHAR(l.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
    TO_CHAR(l.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at,
    (
      SELECT jsonb_object_agg(cf.field_key, fv.value)
      FROM public.lead_custom_fields cf
      JOIN public.lead_field_values fv ON fv.field_id = cf.id
      WHERE fv.lead_id = l.id
    ) AS custom_fields,
    (
      SELECT string_agg(t.name, ', ')
      FROM public.lead_tag_assignments ta
      JOIN public.lead_tags t ON t.id = ta.tag_id
      WHERE ta.lead_id = l.id
    ) AS tags
  FROM public.leads l
  WHERE l.agency_id = public.current_agency_id()
    AND (_search IS NULL OR _search = '' OR 
         l.company_name ILIKE '%' || _search || '%' OR 
         l.contact_name ILIKE '%' || _search || '%' OR
         l.email ILIKE '%' || _search || '%')
    AND (_status IS NULL OR l.status::TEXT = _status)
    AND (_pipeline_stage IS NULL OR l.pipeline_stage::TEXT = _pipeline_stage)
    AND (_temperature IS NULL OR l.temperature::TEXT = _temperature)
    AND (
      _tags IS NULL OR array_length(_tags, 1) IS NULL OR EXISTS (
        SELECT 1 FROM public.lead_tag_assignments ta
        JOIN public.lead_tags t ON t.id = ta.tag_id
        WHERE ta.lead_id = l.id AND t.name = ANY(_tags)
      )
    )
  ORDER BY l.updated_at DESC;
END;
$$;

-- 5. Permissões de acesso à view
GRANT SELECT ON public.leads_expanded TO authenticated;