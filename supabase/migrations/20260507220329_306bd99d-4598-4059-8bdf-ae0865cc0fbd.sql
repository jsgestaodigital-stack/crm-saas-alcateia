ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alcateia_member boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alcateia_member_since timestamptz;