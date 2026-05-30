-- IMI Spatial: Digital Twin, Rooms, Inspection Sessions, Issues
-- One scan → portal, vistoria, avaliação. No duplicated capture.

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE IF NOT EXISTS public.spatial_provider_kind AS ENUM (
  'matterport', 'luma', 'polycam', 'scaniverse', 'custom'
);

CREATE TYPE IF NOT EXISTS public.twin_status AS ENUM (
  'processing', 'ready', 'error', 'archived'
);

CREATE TYPE IF NOT EXISTS public.room_kind AS ENUM (
  'bedroom', 'suite', 'living', 'dining', 'kitchen',
  'bathroom', 'lavatory', 'laundry', 'garage', 'balcony',
  'office', 'closet', 'storage', 'common_area', 'other'
);

CREATE TYPE IF NOT EXISTS public.inspection_kind AS ENUM (
  'entry', 'exit', 'periodic', 'evaluation', 'pre_delivery'
);

CREATE TYPE IF NOT EXISTS public.inspection_status AS ENUM (
  'open', 'in_progress', 'completed', 'signed', 'cancelled'
);

CREATE TYPE IF NOT EXISTS public.issue_kind AS ENUM (
  'damage', 'wear', 'missing', 'dirt', 'stain',
  'structural', 'electrical', 'plumbing', 'finishing', 'other'
);

CREATE TYPE IF NOT EXISTS public.issue_severity AS ENUM (
  'low', 'medium', 'high', 'critical'
);

-- ─── PROPERTY TWINS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.property_twins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id     UUID REFERENCES public.imi_properties(id) ON DELETE SET NULL,
  development_id  UUID REFERENCES public.developments(id) ON DELETE SET NULL,

  status          public.twin_status NOT NULL DEFAULT 'processing',
  provider        public.spatial_provider_kind NOT NULL DEFAULT 'custom',

  -- Raw scan artefacts
  external_id     VARCHAR(200),
  mesh_url        TEXT,
  point_cloud_url TEXT,
  panorama_urls   JSONB NOT NULL DEFAULT '[]',
  preview_image_url TEXT,
  captured_at     TIMESTAMPTZ,

  -- Derived spatial data
  measurements    JSONB NOT NULL DEFAULT '{}',
  floor_plan      JSONB NOT NULL DEFAULT '{}',

  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twins_property  ON public.property_twins(property_id);
CREATE INDEX IF NOT EXISTS idx_twins_dev       ON public.property_twins(development_id);
CREATE INDEX IF NOT EXISTS idx_twins_status    ON public.property_twins(status);

ALTER TABLE public.property_twins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "twins_public_read" ON public.property_twins
  FOR SELECT USING (status = 'ready' AND published_at IS NOT NULL);

CREATE POLICY "twins_auth_write" ON public.property_twins
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── TWIN ROOMS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.twin_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id         UUID NOT NULL REFERENCES public.property_twins(id) ON DELETE CASCADE,

  name            VARCHAR(100) NOT NULL,
  kind            public.room_kind NOT NULL DEFAULT 'other',
  area_m2         DECIMAL(8,2),
  ceiling_height_m DECIMAL(5,2),
  floor_level     SMALLINT,

  bounding_box    JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_rooms_twin ON public.twin_rooms(twin_id);

ALTER TABLE public.twin_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_read_via_twin" ON public.twin_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.property_twins t
      WHERE t.id = twin_id AND t.status = 'ready' AND t.published_at IS NOT NULL
    )
  );

CREATE POLICY "rooms_auth_write" ON public.twin_rooms
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── INSPECTION SESSIONS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inspection_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  twin_id         UUID REFERENCES public.property_twins(id) ON DELETE SET NULL,
  property_id     UUID REFERENCES public.imi_properties(id) ON DELETE SET NULL,

  kind            public.inspection_kind NOT NULL,
  status          public.inspection_status NOT NULL DEFAULT 'open',

  inspector_user_id UUID,
  participants    JSONB NOT NULL DEFAULT '[]',

  captures        JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,

  report_url      TEXT,
  signed_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_property ON public.inspection_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_sessions_twin     ON public.inspection_sessions(twin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status   ON public.inspection_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_inspector ON public.inspection_sessions(inspector_user_id);

ALTER TABLE public.inspection_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_auth_all" ON public.inspection_sessions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── INSPECTION ISSUES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inspection_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.inspection_sessions(id) ON DELETE CASCADE,

  kind            public.issue_kind NOT NULL DEFAULT 'other',
  severity        public.issue_severity NOT NULL DEFAULT 'medium',
  description     TEXT NOT NULL,
  room_id         UUID REFERENCES public.twin_rooms(id) ON DELETE SET NULL,

  photo_urls      JSONB NOT NULL DEFAULT '[]',
  position        JSONB,

  notes           TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_session  ON public.inspection_issues(session_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON public.inspection_issues(severity);

ALTER TABLE public.inspection_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issues_auth_all" ON public.inspection_issues
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── SPATIAL VALUATIONS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.spatial_valuations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id           UUID REFERENCES public.imi_properties(id) ON DELETE SET NULL,
  twin_id               UUID REFERENCES public.property_twins(id) ON DELETE SET NULL,

  market_value          DECIMAL(14,2) NOT NULL,
  rental_value          DECIMAL(14,2),
  confidence            DECIMAL(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  currency              VARCHAR(3) NOT NULL DEFAULT 'BRL',

  method                VARCHAR(30) NOT NULL DEFAULT 'ai_spatial',
  detected_features     JSONB NOT NULL DEFAULT '[]',
  comparable_ids        JSONB NOT NULL DEFAULT '[]',

  notes                 TEXT,
  generated_at          TIMESTAMPTZ DEFAULT NOW(),
  valid_until           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_valuations_property ON public.spatial_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_valuations_twin     ON public.spatial_valuations(twin_id);

ALTER TABLE public.spatial_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "valuations_auth_all" ON public.spatial_valuations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER twins_updated_at
  BEFORE UPDATE ON public.property_twins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.inspection_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
