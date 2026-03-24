-- ============================================================
-- Migration 051: Fix tracking tables — add missing columns
-- and functions needed by /l/[shortCode] and /api/qr/* routes
-- ============================================================

-- ── tracked_links — add all columns that routes expect ───────

ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS short_code       TEXT UNIQUE;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT true;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS title            TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS label            TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS broker_id        UUID;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS team_label       TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS unique_clicks    INTEGER DEFAULT 0;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS last_click_at    TIMESTAMPTZ;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS utm_source       TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS utm_medium       TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS utm_campaign     TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS utm_content      TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS utm_term         TEXT;
-- Some migrations used "url" instead of "original_url" — ensure both exist
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS original_url     TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS url              TEXT;
ALTER TABLE tracked_links ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();

-- Back-fill url from original_url and vice-versa so the redirect handler works
UPDATE tracked_links SET url = original_url WHERE url IS NULL AND original_url IS NOT NULL;
UPDATE tracked_links SET original_url = url WHERE original_url IS NULL AND url IS NOT NULL;

-- Backfill is_active for any rows that existed before
UPDATE tracked_links SET is_active = true WHERE is_active IS NULL;

-- Index on short_code for fast redirect lookups
CREATE INDEX IF NOT EXISTS idx_tracked_links_short_code  ON tracked_links(short_code);
CREATE INDEX IF NOT EXISTS idx_tracked_links_active      ON tracked_links(is_active);
CREATE INDEX IF NOT EXISTS idx_tracked_links_user        ON tracked_links(created_by);

-- ── link_events — add columns that /l/[shortCode] inserts ────

ALTER TABLE link_events ADD COLUMN IF NOT EXISTS browser     TEXT;
ALTER TABLE link_events ADD COLUMN IF NOT EXISTS os          TEXT;
ALTER TABLE link_events ADD COLUMN IF NOT EXISTS referrer    TEXT;

-- ── increment_link_clicks — atomic counter used by /l/[shortCode] ──

CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tracked_links
  SET
    clicks       = COALESCE(clicks, 0) + 1,
    last_click_at = NOW(),
    updated_at   = NOW()
  WHERE id = link_id;
END;
$$;

-- ── increment_qr_scans — used by legacy /api/track/[id] route ──

CREATE OR REPLACE FUNCTION public.increment_qr_scans(link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tracked_links
  SET
    clicks       = COALESCE(clicks, 0) + 1,
    last_click_at = NOW(),
    updated_at   = NOW()
  WHERE id = link_id;
END;
$$;

-- ── qr_links — legacy table used by /api/track/[id] (create if missing) ──
-- This table was referenced in /api/track/[id] route; we create it as an
-- alias backed by tracked_links where possible, or as a standalone table.

CREATE TABLE IF NOT EXISTS public.qr_links (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_url TEXT NOT NULL,
  property_id     UUID,
  source          TEXT,
  campaign_name   TEXT,
  scan_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.qr_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_manage_qr_links" ON public.qr_links;
CREATE POLICY "authenticated_manage_qr_links"
  ON public.qr_links FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── qr_scans — used by /api/track/[id] ───────────────────────

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_link_id      UUID REFERENCES public.qr_links(id) ON DELETE CASCADE,
  property_id     UUID,
  source          TEXT,
  campaign_name   TEXT,
  user_agent      TEXT,
  referer         TEXT,
  ip_address      TEXT,
  is_mobile       BOOLEAN,
  country         TEXT,
  city            TEXT,
  scanned_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_manage_qr_scans" ON public.qr_scans;
CREATE POLICY "authenticated_manage_qr_scans"
  ON public.qr_scans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- anon insert so the redirect route (no session) can write scans
DROP POLICY IF EXISTS "anon_insert_qr_scans" ON public.qr_scans;
CREATE POLICY "anon_insert_qr_scans"
  ON public.qr_scans FOR INSERT TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_qr_scans_link     ON public.qr_scans(qr_link_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned  ON public.qr_scans(scanned_at DESC);
