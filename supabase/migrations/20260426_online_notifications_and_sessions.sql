-- ============================================================
-- Online Notifications & Session Tracking
-- ============================================================
-- Tracks backoffice user online presence and session duration
-- for admin monitoring (last login, time online, current status)
-- ============================================================

-- ── user_presence ────────────────────────────────────────────
-- Persistent presence record (updated by Supabase Realtime Presence hook)
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'offline'
                   CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT DEFAULT '',
  last_seen_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Admins/managers see everyone; users see themselves
CREATE POLICY "user_presence_select" ON public.user_presence
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.brokers
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'broker_manager')
        AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'owner')
    )
  );

CREATE POLICY "user_presence_upsert" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- ── user_backoffice_sessions ─────────────────────────────────
-- One row per login session in the backoffice.
-- Records when the user started and their last heartbeat,
-- allowing session duration calculation.
CREATE TABLE IF NOT EXISTS public.user_backoffice_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id         UUID        REFERENCES public.brokers(id) ON DELETE SET NULL,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ubs_user_id    ON public.user_backoffice_sessions (user_id);
CREATE INDEX idx_ubs_started_at ON public.user_backoffice_sessions (started_at DESC);

ALTER TABLE public.user_backoffice_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sessions
CREATE POLICY "ubs_insert_own" ON public.user_backoffice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update (heartbeat/end) their own sessions
CREATE POLICY "ubs_update_own" ON public.user_backoffice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own sessions; admins read all
CREATE POLICY "ubs_select" ON public.user_backoffice_sessions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.brokers
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'broker_manager')
        AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'owner')
    )
  );

-- ── Helper view for admin activity dashboard ──────────────────
CREATE OR REPLACE VIEW public.v_user_activity AS
SELECT
  b.id              AS broker_id,
  b.user_id,
  b.name,
  b.email,
  b.avatar_url,
  b.role,
  b.status          AS broker_status,
  b.last_login_at,
  up.status         AS presence_status,
  up.status_message,
  up.last_seen_at,
  -- Today's total session seconds (sum of all sessions started today)
  COALESCE((
    SELECT SUM(
      EXTRACT(EPOCH FROM (
        COALESCE(s.ended_at, s.last_heartbeat_at) - s.started_at
      ))::INTEGER
    )
    FROM public.user_backoffice_sessions s
    WHERE s.user_id = b.user_id
      AND s.started_at >= CURRENT_DATE
  ), 0) AS today_seconds,
  -- Total session seconds all-time
  COALESCE((
    SELECT SUM(
      EXTRACT(EPOCH FROM (
        COALESCE(s.ended_at, s.last_heartbeat_at) - s.started_at
      ))::INTEGER
    )
    FROM public.user_backoffice_sessions s
    WHERE s.user_id = b.user_id
  ), 0) AS total_seconds
FROM public.brokers b
LEFT JOIN public.user_presence up ON up.user_id = b.user_id
WHERE b.status = 'active'
ORDER BY
  CASE WHEN up.status = 'online' THEN 0
       WHEN up.status = 'away'   THEN 1
       WHEN up.status = 'busy'   THEN 2
       ELSE 3
  END,
  b.name;
