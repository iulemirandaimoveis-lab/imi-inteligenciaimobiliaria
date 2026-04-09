-- Add media columns to rental_properties to match imoveis venda module

ALTER TABLE public.rental_properties
  ADD COLUMN IF NOT EXISTS floor_plans TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brochure_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_short_url TEXT;
