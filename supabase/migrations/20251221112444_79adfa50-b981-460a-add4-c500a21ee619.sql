-- Tabela para rastrear histórico de mudanças de plano
CREATE TABLE public.agency_plan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Plano anterior
  previous_plan_id UUID REFERENCES public.plans(id),
  previous_plan_name TEXT,
  previous_plan_slug TEXT,
  previous_price NUMERIC(10,2),
  
  -- Novo plano
  new_plan_id UUID REFERENCES public.plans(id),
  new_plan_name TEXT,
  new_plan_slug TEXT,
  new_price NUMERIC(10,2),
  
  -- Tipo de mudança
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'activation', 'cancellation', 'trial_start', 'trial_end', 'renewal')),
  
  -- Metadados
  reason TEXT,
  initiated_by UUID,
  initiated_by_name TEXT,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_agency_plan_history_agency_id ON public.agency_plan_history(agency_id);
CREATE INDEX idx_agency_plan_history_change_type ON public.agency_plan_history(change_type);
CREATE INDEX idx_agency_plan_history_effective_at ON public.agency_plan_history(effective_at DESC);
CREATE INDEX idx_agency_plan_history_stripe_event ON public.agency_plan_history(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.agency_plan_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Owners/Admins podem ver histórico da agência
CREATE POLICY "Agency owners can view their plan history"
ON public.agency_plan_history
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.agency_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Sistema pode inserir (via service_role ou trigger)
CREATE POLICY "System can insert plan history"
ON public.agency_plan_history
FOR INSERT
WITH CHECK (true);

-- Função para registrar mudança de plano automaticamente
CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_plan RECORD;
  v_new_plan RECORD;
  v_change_type TEXT;
BEGIN
  -- Buscar plano anterior
  IF OLD.plan_id IS NOT NULL THEN
    SELECT name, slug, price_monthly INTO v_previous_plan
    FROM public.plans WHERE id = OLD.plan_id;
  END IF;
  
  -- Buscar novo plano
  IF NEW.plan_id IS NOT NULL THEN
    SELECT name, slug, price_monthly INTO v_new_plan
    FROM public.plans WHERE id = NEW.plan_id;
  END IF;
  
  -- Determinar tipo de mudança
  IF OLD.plan_id IS NULL AND NEW.plan_id IS NOT NULL THEN
    v_change_type := 'activation';
  ELSIF OLD.plan_id IS NOT NULL AND NEW.plan_id IS NULL THEN
    v_change_type := 'cancellation';
  ELSIF OLD.status = 'trial' AND NEW.status = 'active' THEN
    v_change_type := 'trial_end';
  ELSIF COALESCE(v_new_plan.price_monthly, 0) > COALESCE(v_previous_plan.price_monthly, 0) THEN
    v_change_type := 'upgrade';
  ELSIF COALESCE(v_new_plan.price_monthly, 0) < COALESCE(v_previous_plan.price_monthly, 0) THEN
    v_change_type := 'downgrade';
  ELSE
    v_change_type := 'renewal';
  END IF;
  
  -- Inserir registro de histórico
  INSERT INTO public.agency_plan_history (
    agency_id,
    subscription_id,
    previous_plan_id,
    previous_plan_name,
    previous_plan_slug,
    previous_price,
    new_plan_id,
    new_plan_name,
    new_plan_slug,
    new_price,
    change_type,
    metadata
  ) VALUES (
    NEW.agency_id,
    NEW.id,
    OLD.plan_id,
    v_previous_plan.name,
    v_previous_plan.slug,
    v_previous_plan.price_monthly,
    NEW.plan_id,
    v_new_plan.name,
    v_new_plan.slug,
    v_new_plan.price_monthly,
    v_change_type,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para registrar mudanças
CREATE TRIGGER trigger_log_plan_change
AFTER UPDATE OF plan_id, status ON public.subscriptions
FOR EACH ROW
WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_plan_change();