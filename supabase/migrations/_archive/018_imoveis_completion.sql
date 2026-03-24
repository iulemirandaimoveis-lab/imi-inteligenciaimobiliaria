-- 018: Imoveis Completion - Finishing incomplete features
-- EXECUTE THIS IN SUPABASE SQL EDITOR

-- 1. Ensure developments table has all required columns
ALTER TABLE developments 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_score INTEGER;

-- 2. Create property_units table if not exists
CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES developments(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  type TEXT NOT NULL, -- e.g. T1, T2, Studio
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'available', -- available, reserved, sold
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tracked_links table if not exists
CREATE TABLE IF NOT EXISTS tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES developments(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  last_click_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create property_events table if not exists
CREATE TABLE IF NOT EXISTS property_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES developments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- creation, update, lead, view, unit_sold
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Auth users full access units" ON property_units;
CREATE POLICY "Auth users full access units" ON property_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users full access links" ON tracked_links;
CREATE POLICY "Auth users full access links" ON tracked_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users full access events" ON property_events;
CREATE POLICY "Auth users full access events" ON property_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Storage Bucket for developments
-- This part usually needs to be run in the SQL editor or via dashboard if migrations don't have permission to create buckets directly depending on setup.
-- Assuming standard setup:
INSERT INTO storage.buckets (id, name, public)
VALUES ('developments', 'developments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage (if not exists)
CREATE POLICY "Authenticated users can upload developments media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'developments');

CREATE POLICY "Public can view developments media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'developments');

CREATE POLICY "Authenticated users can update developments media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'developments');

CREATE POLICY "Authenticated users can delete developments media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'developments');
