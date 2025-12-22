-- Add is_alcateia flag to pending_registrations
ALTER TABLE public.pending_registrations 
ADD COLUMN IF NOT EXISTS is_alcateia boolean DEFAULT false NOT NULL;

-- Add password_hash column to store password temporarily (encrypted in transit)
ALTER TABLE public.pending_registrations 
ADD COLUMN IF NOT EXISTS temp_password_hash text;

-- Add source column to track where registration came from
ALTER TABLE public.pending_registrations 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'register' NOT NULL;

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON public.pending_registrations(status);

-- Create index for is_alcateia
CREATE INDEX IF NOT EXISTS idx_pending_registrations_is_alcateia ON public.pending_registrations(is_alcateia);

-- Add comment for documentation
COMMENT ON COLUMN public.pending_registrations.is_alcateia IS 'True for Alcateia lifetime access registrations';