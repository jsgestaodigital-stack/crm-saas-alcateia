-- Add useful_links column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS useful_links jsonb DEFAULT '[]'::jsonb;