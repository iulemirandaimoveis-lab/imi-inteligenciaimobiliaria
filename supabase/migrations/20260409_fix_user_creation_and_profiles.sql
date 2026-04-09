-- ============================================================
-- FIX: User creation trigger + profiles schema
-- 2026-04-09
--
-- Problems fixed:
-- 1. handle_new_user trigger had no EXCEPTION handling, causing any
--    trigger error to roll back the auth.users INSERT and return
--    "Database error creating new user" to the caller.
-- 2. Missing SET search_path on SECURITY DEFINER function.
-- 3. profiles table missing is_active column (used by backoffice API).
-- ============================================================

-- 1. Add is_active column to profiles if it doesn't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Rewrite handle_new_user with:
--    • SET search_path = public  (security + compatibility)
--    • ON CONFLICT DO UPDATE     (keeps profile in sync on re-signup)
--    • EXCEPTION WHEN OTHERS     (NEVER lets a trigger failure block user creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'corretor'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    name       = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but never fail — user creation must not be blocked by profile sync
    RAISE WARNING 'handle_new_user: failed to upsert profile for user %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Recreate trigger (ensures it points to the updated function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill is_active = true for existing profiles that have NULL
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
