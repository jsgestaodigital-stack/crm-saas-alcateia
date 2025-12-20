-- =============================================
-- ETAPA 5.2 – CAMPOS CUSTOMIZADOS E TAGS
-- =============================================

-- 1. Tabela de definição de campos customizados
CREATE TABLE IF NOT EXISTS public.lead_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select, boolean
  options TEXT[], -- usado para tipo select
  is_required BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, field_key)
);

-- 2. Tabela de valores dos campos customizados
CREATE TABLE IF NOT EXISTS public.lead_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.lead_custom_fields(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, field_id)
);

-- 3. Tabela de tags
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)
);

-- 4. Tabela de atribuição de tags aos leads
CREATE TABLE IF NOT EXISTS public.lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_custom_fields_agency ON public.lead_custom_fields(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_field_values_lead ON public.lead_field_values(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_field_values_field ON public.lead_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_agency ON public.lead_tags(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead ON public.lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag ON public.lead_tag_assignments(tag_id);

-- 6. Habilitar RLS
ALTER TABLE public.lead_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lead_custom_fields FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_field_values FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments FORCE ROW LEVEL SECURITY;

-- 7. Políticas RLS

-- lead_custom_fields
CREATE POLICY "Agency members can view custom fields"
  ON public.lead_custom_fields FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Agency admins can manage custom fields"
  ON public.lead_custom_fields FOR ALL
  USING (
    agency_id = public.current_agency_id()
    AND (public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()))
  );

-- lead_field_values
CREATE POLICY "Agency members can view field values"
  ON public.lead_field_values FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Agency members can manage field values"
  ON public.lead_field_values FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "Agency members can update field values"
  ON public.lead_field_values FOR UPDATE
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Agency members can delete field values"
  ON public.lead_field_values FOR DELETE
  USING (agency_id = public.current_agency_id());

-- lead_tags
CREATE POLICY "Agency members can view tags"
  ON public.lead_tags FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Agency admins can manage tags"
  ON public.lead_tags FOR ALL
  USING (
    agency_id = public.current_agency_id()
    AND (public.can_access_admin(auth.uid()) OR public.is_admin(auth.uid()) OR public.can_access_sales(auth.uid()))
  );

-- lead_tag_assignments
CREATE POLICY "Agency members can view tag assignments"
  ON public.lead_tag_assignments FOR SELECT
  USING (agency_id = public.current_agency_id());

CREATE POLICY "Agency members can manage tag assignments"
  ON public.lead_tag_assignments FOR INSERT
  WITH CHECK (agency_id = public.current_agency_id());

CREATE POLICY "Agency members can delete tag assignments"
  ON public.lead_tag_assignments FOR DELETE
  USING (agency_id = public.current_agency_id());

-- 8. Triggers para set agency_id automaticamente
CREATE OR REPLACE FUNCTION public.lead_field_values_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency UUID;
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    SELECT agency_id INTO v_agency
    FROM public.leads
    WHERE id = NEW.lead_id
    LIMIT 1;
    
    IF v_agency IS NOT NULL THEN
      NEW.agency_id := v_agency;
    END IF;
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found for field value';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_field_values_set_agency_id_trigger
  BEFORE INSERT ON public.lead_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_field_values_set_agency_id();

CREATE OR REPLACE FUNCTION public.lead_tag_assignments_set_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency UUID;
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    SELECT agency_id INTO v_agency
    FROM public.leads
    WHERE id = NEW.lead_id
    LIMIT 1;
    
    IF v_agency IS NOT NULL THEN
      NEW.agency_id := v_agency;
    END IF;
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := public.current_agency_id();
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found for tag assignment';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_tag_assignments_set_agency_id_trigger
  BEFORE INSERT ON public.lead_tag_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_tag_assignments_set_agency_id();

CREATE OR REPLACE FUNCTION public.lead_custom_fields_set_agency_id()
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
    RAISE EXCEPTION 'No agency found for custom field';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_custom_fields_set_agency_id_trigger
  BEFORE INSERT ON public.lead_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_custom_fields_set_agency_id();

CREATE OR REPLACE FUNCTION public.lead_tags_set_agency_id()
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
    RAISE EXCEPTION 'No agency found for tag';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_tags_set_agency_id_trigger
  BEFORE INSERT ON public.lead_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.lead_tags_set_agency_id();

-- 9. Triggers de updated_at
CREATE TRIGGER update_lead_custom_fields_updated_at
  BEFORE UPDATE ON public.lead_custom_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_field_values_updated_at
  BEFORE UPDATE ON public.lead_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();