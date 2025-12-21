-- Add instagram column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS instagram text;

-- Add index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_company_name_lower ON public.leads (LOWER(company_name));
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON public.leads (whatsapp) WHERE whatsapp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email) WHERE email IS NOT NULL;