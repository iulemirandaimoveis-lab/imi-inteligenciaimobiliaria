-- =====================================================
-- IMI — Fix User Creation + Teams Schema
-- Date: 2026-04-14
-- Fixes:
--   1. handle_new_user() trigger wrapped in exception handler
--      → prevents "Database error creating new user"
--   2. auto_join_team_channels() trigger fault-tolerant
--   3. teams table: add missing columns (is_active, region,
--      specialty, commission_rules, leader_name, member_count,
--      active_listings, monthly_volume)
--   4. brokers table: add team_id FK column
-- =====================================================

-- ── 1. FAULT-TOLERANT handle_new_user TRIGGER ──────────────────────
-- Wrapping in EXCEPTION ensures user creation never fails due to
-- a profile-insert side effect (FK, constraint, RLS, etc.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        split_part(NEW.email, '@', 1)
      ),
      NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'corretor')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name  = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.email, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 2. FAULT-TOLERANT auto_join_team_channels TRIGGER ──────────────
CREATE OR REPLACE FUNCTION public.auto_join_team_channels()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.chat_members (channel_id, user_id, role)
    SELECT cc.id, NEW.id, 'member'
    FROM public.chat_channels cc
    WHERE cc.type = 'team'
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto_join_team_channels: insert failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_join_team_channels ON public.profiles;
CREATE TRIGGER trg_auto_join_team_channels
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_team_channels();

-- ── 3. TEAMS TABLE — add missing columns ───────────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN        DEFAULT true,
  ADD COLUMN IF NOT EXISTS region          TEXT,
  ADD COLUMN IF NOT EXISTS specialty       TEXT,
  ADD COLUMN IF NOT EXISTS commission_rules JSONB         DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS leader_name     TEXT,
  ADD COLUMN IF NOT EXISTS member_count    INTEGER        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_listings INTEGER        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_volume  DECIMAL(14,2)  DEFAULT 0;

-- Backfill is_active from status for existing rows
UPDATE public.teams
  SET is_active = (status = 'active')
  WHERE is_active IS NULL;

-- ── 4. BROKERS TABLE — add team_id FK ──────────────────────────────
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brokers_team_id ON public.brokers(team_id);

-- ── 5. TEAMS — sync leader_name for existing rows ──────────────────
UPDATE public.teams t
  SET leader_name = b.name
  FROM public.brokers b
  WHERE b.user_id = t.leader_id
    AND t.leader_name IS NULL
    AND t.leader_id IS NOT NULL;

-- ── 6. PROFILES — ensure is_active column exists ───────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
