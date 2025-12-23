-- Create appointments table for unified agenda across all funnels
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL DEFAULT '09:00',
  funnel_type TEXT NOT NULL DEFAULT 'delivery' CHECK (funnel_type IN ('delivery', 'sales', 'recurring')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments OR all agency appointments if admin
CREATE POLICY "Users can view own or team appointments" 
ON public.appointments 
FOR SELECT 
USING (
  agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_permissions 
      WHERE user_id = auth.uid() 
      AND (can_admin = true OR is_super_admin = true)
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- Users can create their own appointments
CREATE POLICY "Users can create own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
);

-- Users can update their own appointments
CREATE POLICY "Users can update own appointments" 
ON public.appointments 
FOR UPDATE 
USING (user_id = auth.uid());

-- Users can delete their own appointments
CREATE POLICY "Users can delete own appointments" 
ON public.appointments 
FOR DELETE 
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_appointments_user_agency ON public.appointments(user_id, agency_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_funnel ON public.appointments(funnel_type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();