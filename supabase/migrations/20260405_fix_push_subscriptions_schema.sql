-- Fix push_subscriptions schema: migrate from separate p256dh/auth TEXT columns
-- to a single keys JSONB column, which is what the application code expects.
-- Safe to re-run: all operations are conditional (IF EXISTS / IF NOT EXISTS).

DO $$
BEGIN
  -- Step 1: Add keys column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'push_subscriptions'
      AND column_name  = 'keys'
  ) THEN
    ALTER TABLE public.push_subscriptions ADD COLUMN keys JSONB;
  END IF;

  -- Step 2: Migrate data from old p256dh + auth columns (if they still exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'push_subscriptions'
      AND column_name  = 'p256dh'
  ) THEN
    UPDATE public.push_subscriptions
    SET keys = jsonb_build_object('p256dh', p256dh, 'auth', auth)
    WHERE keys IS NULL;

    ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS p256dh;
    ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS auth;
  END IF;

  -- Step 3: Enforce NOT NULL on keys (after migration all rows should have a value)
  UPDATE public.push_subscriptions SET keys = '{}'::jsonb WHERE keys IS NULL;
  ALTER TABLE public.push_subscriptions ALTER COLUMN keys SET NOT NULL;

  -- Step 4: Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'push_subscriptions'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
