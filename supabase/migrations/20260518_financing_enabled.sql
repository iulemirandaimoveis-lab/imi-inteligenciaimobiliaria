-- Add financing_enabled flag to developments
-- Allows backoffice to control per-property financing eligibility
ALTER TABLE public.developments
    ADD COLUMN IF NOT EXISTS financing_enabled BOOLEAN NOT NULL DEFAULT true;
