-- Add is_active column to profiles (used by backoffice users API for ban/deactivate)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure email column is present (was optional in original migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for faster lookups by email (user creation checks for existing profile by email)
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
