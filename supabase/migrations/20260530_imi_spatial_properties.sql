-- IMI Spatial Properties: unified table for lots, apartments, units
-- Supports all development types: loteamentos, prédios, lançamentos

CREATE TYPE IF NOT EXISTS public.imi_availability_status AS ENUM (
  'available', 'reserved', 'sold', 'blocked', 'launching', 'hidden'
);

CREATE TYPE IF NOT EXISTS public.imi_property_kind AS ENUM (
  'lot', 'apartment', 'commercial_room', 'house', 'parking', 'common_area'
);

CREATE TABLE IF NOT EXISTS public.imi_properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id  UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  kind            public.imi_property_kind NOT NULL DEFAULT 'apartment',

  code            VARCHAR(50) NOT NULL,
  title           VARCHAR(200),

  block           VARCHAR(20),
  lot_number      VARCHAR(20),
  tower           VARCHAR(20),
  floor           INTEGER,
  unit_number     VARCHAR(20),

  private_area_m2 DECIMAL(10,2),
  total_area_m2   DECIMAL(10,2),
  bedrooms        SMALLINT,
  suites          SMALLINT,
  bathrooms       SMALLINT,
  parking_spaces  SMALLINT,

  status          public.imi_availability_status NOT NULL DEFAULT 'available',

  price           DECIMAL(14,2),
  price_visible   BOOLEAN NOT NULL DEFAULT false,

  scene_node_id   VARCHAR(100),

  media           JSONB NOT NULL DEFAULT '{}',
  commercial      JSONB NOT NULL DEFAULT '{"leadCaptureEnabled": true}',
  metadata        JSONB NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (development_id, code)
);

CREATE INDEX IF NOT EXISTS idx_imi_props_development ON public.imi_properties(development_id);
CREATE INDEX IF NOT EXISTS idx_imi_props_status ON public.imi_properties(status);
CREATE INDEX IF NOT EXISTS idx_imi_props_tower_floor ON public.imi_properties(development_id, tower, floor);
CREATE INDEX IF NOT EXISTS idx_imi_props_kind ON public.imi_properties(development_id, kind);

ALTER TABLE public.imi_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imi_properties_public_read" ON public.imi_properties
  FOR SELECT USING (status != 'hidden');

CREATE POLICY "imi_properties_auth_write" ON public.imi_properties
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.imi_properties_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER imi_properties_updated_at
  BEFORE UPDATE ON public.imi_properties
  FOR EACH ROW EXECUTE FUNCTION public.imi_properties_set_updated_at();

-- ─── Jazz Boulevard: seed data ──────────────────────────────────────────────
-- Upsert the development (if it doesn't exist yet)
INSERT INTO public.developments (
  name, slug, type, status_commercial,
  description, city, state, country,
  neighborhood,
  price_min, price_max,
  area_from
)
VALUES (
  'Jazz Boulevard',
  'jazz-boulevard',
  'lançamento',
  'published',
  'Empreendimento residencial urbano com dois tipos de planta, alto padrão construtivo e localização estratégica em Garanhuns.',
  'Garanhuns',
  'PE',
  'Brasil',
  'Centro',
  380000.00,
  900000.00,
  58.00
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Jazz Boulevard units after development exists
DO $$
DECLARE
  dev_id UUID;
  t TEXT;
  f INTEGER;
  u INTEGER;
  unit_code TEXT;
  plan_type TEXT;
  unit_bedrooms SMALLINT;
  unit_suites SMALLINT;
  unit_bathrooms SMALLINT;
  unit_area DECIMAL(10,2);
  unit_price DECIMAL(14,2);
BEGIN
  SELECT id INTO dev_id FROM public.developments WHERE slug = 'jazz-boulevard';
  IF dev_id IS NULL THEN RETURN; END IF;

  FOREACH t IN ARRAY ARRAY['A', 'B'] LOOP
    FOR f IN 1..12 LOOP
      FOR u IN 1..4 LOOP
        unit_code := t || '-' || LPAD(f::TEXT, 2, '0') || LPAD(u::TEXT, 2, '0');

        -- Assign plan type by unit position
        IF f = 12 THEN
          plan_type := 'Cobertura';
          unit_bedrooms := 3; unit_suites := 2; unit_bathrooms := 3;
          unit_area := 148.50; unit_price := 850000.00;
        ELSIF u IN (1, 2) THEN
          plan_type := 'Planta Tipo A';
          unit_bedrooms := 2; unit_suites := 1; unit_bathrooms := 2;
          unit_area := 74.50; unit_price := 420000.00 + (f * 3000);
        ELSE
          plan_type := 'Planta Tipo B';
          unit_bedrooms := 3; unit_suites := 2; unit_bathrooms := 2;
          unit_area := 98.00; unit_price := 580000.00 + (f * 4000);
        END IF;

        INSERT INTO public.imi_properties (
          development_id, kind, code, title,
          tower, floor, unit_number,
          private_area_m2, total_area_m2,
          bedrooms, suites, bathrooms, parking_spaces,
          status, price, price_visible,
          scene_node_id,
          media, commercial, metadata
        ) VALUES (
          dev_id,
          'apartment',
          unit_code,
          'Apartamento ' || unit_code,
          t, f, LPAD(f::TEXT, 0, '') || LPAD(u::TEXT, 2, '0'),
          unit_area, unit_area + 12.00,
          unit_bedrooms, unit_suites, unit_bathrooms, 1,
          'available',
          unit_price, true,
          'node-jazz-' || LOWER(unit_code),
          jsonb_build_object(
            'floorPlanImage', '/jazz/plants/' || LOWER(REPLACE(plan_type, ' ', '-')) || '.png',
            'gallery', jsonb_build_array()
          ),
          '{"leadCaptureEnabled": true}'::JSONB,
          jsonb_build_object('planType', plan_type)
        )
        ON CONFLICT (development_id, code) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;
