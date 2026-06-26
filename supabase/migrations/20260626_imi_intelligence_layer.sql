-- ============================================================================
-- IMI INTELLIGENCE LAYER — Event Engine + Metrics + Insights
-- Date: 2026-06-26 (complements the IMI auth ecosystem)
-- ----------------------------------------------------------------------------
-- Adds the analytics foundation under the isolated `imi` schema:
--   • imi.events            — append-only event stream (event engine)
--   • imi.metric_snapshots  — periodic computed metrics (warehouse-lite)
--   • imi.insights          — generated intelligence (IMI Insights)
--
-- Event-driven, prepared for a future migration to ClickHouse / Kafka / Spark:
-- events are append-only with a typed `event_type`, a JSONB payload, and an
-- `occurred_at` so they can be replayed/streamed. Zero collision with public.*.
--
-- Idempotent. Run AFTER 20260626_imi_auth_ecosystem.sql.
-- ============================================================================

-- ── Event type enum ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imi_event_type') THEN
    CREATE TYPE imi.imi_event_type AS ENUM (
      'LeadCreated',
      'ProposalCreated',
      'ProposalApproved',
      'ProposalRejected',
      'LotReserved',
      'LotSold',
      'BrokerLogin',
      'BrokerActivity',
      'PropertyView',
      'ClientInteraction'
    );
  END IF;
END$$;

-- ── 1. events (append-only stream) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imi.events (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type     imi.imi_event_type NOT NULL,
  project_id     UUID REFERENCES imi.projects(id) ON DELETE SET NULL,
  actor_user_id  UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  entity         TEXT,            -- e.g. 'proposal', 'lot', 'lead'
  entity_id      TEXT,            -- loose link (unit code, proposal id, ...)
  amount         NUMERIC(14,2),   -- monetary value when relevant (sale, proposal)
  payload        JSONB NOT NULL DEFAULT '{}',
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_events_type ON imi.events(event_type);
CREATE INDEX IF NOT EXISTS idx_imi_events_project ON imi.events(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_events_actor ON imi.events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_imi_events_occurred ON imi.events(occurred_at DESC);

-- ── 2. metric_snapshots (warehouse-lite) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS imi.metric_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES imi.projects(id) ON DELETE CASCADE,
  metric_key  TEXT NOT NULL,           -- e.g. 'sales.count.7d', 'vgv.total'
  value       NUMERIC(18,4) NOT NULL,
  window      TEXT,                    -- e.g. '7d', '30d', 'all'
  dims        JSONB NOT NULL DEFAULT '{}',  -- e.g. {"broker":"Lucas"}
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_metric_project_key ON imi.metric_snapshots(project_id, metric_key);
CREATE INDEX IF NOT EXISTS idx_imi_metric_captured ON imi.metric_snapshots(captured_at DESC);

-- ── 3. insights (IMI Insights) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imi.insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES imi.projects(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'observation'
              CHECK (kind IN ('observation', 'trend', 'risk', 'opportunity', 'forecast', 'recommendation')),
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'positive', 'warning', 'critical')),
  title       TEXT NOT NULL,
  body        TEXT,
  confidence  NUMERIC(4,3) DEFAULT 0.800,   -- 0..1 confidence score
  metric_key  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_imi_insights_project ON imi.insights(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_insights_created ON imi.insights(created_at DESC);

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE imi.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.insights         ENABLE ROW LEVEL SECURITY;

-- events: any authenticated user can append their own actions; reads gated on
-- metrics.read OR project membership (so a broker sees their project feed).
DROP POLICY IF EXISTS "events_insert" ON imi.events;
CREATE POLICY "events_insert" ON imi.events FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "events_read" ON imi.events;
CREATE POLICY "events_read" ON imi.events FOR SELECT TO authenticated
  USING (
    imi.has_permission('metrics.read')
    OR actor_user_id = imi.current_user_id()
    OR EXISTS (
      SELECT 1 FROM imi.project_users pu
      WHERE pu.project_id = events.project_id AND pu.user_id = imi.current_user_id()
    )
  );

DROP POLICY IF EXISTS "metrics_read" ON imi.metric_snapshots;
CREATE POLICY "metrics_read" ON imi.metric_snapshots FOR SELECT TO authenticated
  USING (imi.has_permission('metrics.read'));
DROP POLICY IF EXISTS "metrics_write" ON imi.metric_snapshots;
CREATE POLICY "metrics_write" ON imi.metric_snapshots FOR ALL TO authenticated
  USING (imi.has_permission('metrics.read')) WITH CHECK (imi.has_permission('metrics.read'));

DROP POLICY IF EXISTS "insights_read" ON imi.insights;
CREATE POLICY "insights_read" ON imi.insights FOR SELECT TO authenticated
  USING (
    imi.has_permission('metrics.read')
    OR EXISTS (
      SELECT 1 FROM imi.project_users pu
      WHERE pu.project_id = insights.project_id AND pu.user_id = imi.current_user_id()
    )
  );
DROP POLICY IF EXISTS "insights_write" ON imi.insights;
CREATE POLICY "insights_write" ON imi.insights FOR ALL TO authenticated
  USING (imi.has_permission('metrics.read')) WITH CHECK (imi.has_permission('metrics.read'));

-- ── 5. emit_event helper (append + return id) ───────────────────────────────
CREATE OR REPLACE FUNCTION imi.emit_event(
  p_event_type TEXT,
  p_project_id UUID DEFAULT NULL,
  p_actor      UUID DEFAULT NULL,
  p_entity     TEXT DEFAULT NULL,
  p_entity_id  TEXT DEFAULT NULL,
  p_amount     NUMERIC DEFAULT NULL,
  p_payload    JSONB DEFAULT '{}'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = imi, public
AS $$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO imi.events (event_type, project_id, actor_user_id, entity, entity_id, amount, payload)
  VALUES (p_event_type::imi.imi_event_type, p_project_id,
          COALESCE(p_actor, imi.current_user_id()), p_entity, p_entity_id, p_amount, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION imi.emit_event(TEXT, UUID, UUID, TEXT, TEXT, NUMERIC, JSONB) TO authenticated;

-- ============================================================================
-- DONE. The analytics engine (src/lib/imi-intelligence) reads these tables
-- when present and degrades to representative analytics otherwise, so the
-- Intelligence dashboard renders before the event stream is populated.
-- ============================================================================
