-- MASTER MIGRATION 2026: FIX ALL DEPENDENCIES
-- Ensures all tables, relationships, and buckets exist for Production

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create DEVELOPERS table (Construtoras) - Critical for Frontend Joins
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    description TEXT,
    cnpj TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure DEVELOPMENTS table exists with correct Foreign Keys
CREATE TABLE IF NOT EXISTS developments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    developer_id UUID REFERENCES developers(id), -- Critical FK
    price_min NUMERIC,
    price_max NUMERIC,
    address TEXT,
    city TEXT,
    state TEXT,
    neighborhood TEXT,
    images JSONB DEFAULT '{}', -- { main: '', gallery: [], floorPlans: [], videos: [] }
    features JSONB DEFAULT '[]',
    status TEXT DEFAULT 'launch', 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns from 002_imoveis_hub if not exist
ALTER TABLE developments ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'apartamento';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_comercial TEXT DEFAULT 'rascunho';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS leads_count INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;

-- 4. Create LEADS table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    development_id UUID REFERENCES developments(id), -- Connect lead to development
    status TEXT DEFAULT 'new', -- new, contacted, qualified, lost, won
    origin TEXT DEFAULT 'website', -- website, whatsapp, manual
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create CONTENT table (Blog/News)
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    cover_image TEXT,
    author_id UUID DEFAULT auth.uid(),
    status TEXT DEFAULT 'draft', -- draft, published
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create CONSULTATIONS table (Consultoria)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.1 Create APPRAISAL_REQUESTS table (Avaliações)
CREATE TABLE IF NOT EXISTS appraisal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    appraisal_type TEXT,
    property_type TEXT,
    city TEXT,
    address TEXT,
    timeline TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 EXECUTIVE REPORTS (from 1_FIX_TABLES.sql)
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    report_type TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary TEXT,
    metrics JSONB NOT NULL DEFAULT '{}',
    insights JSONB,
    recommendations JSONB,
    cost_breakdown JSONB,
    generated_by UUID,
    ai_request_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 TRACKED LINKS (from 002_imoveis_hub.sql)
CREATE TABLE IF NOT EXISTS tracked_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    short_code TEXT UNIQUE NOT NULL,
    clicks INT DEFAULT 0,
    leads_generated INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.4 DEVELOPMENT EVENTS (from 002_imoveis_hub.sql)
CREATE TABLE IF NOT EXISTS development_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 LEADS ENRICHMENT (from 1_FIX_TABLES.sql)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_priority TEXT DEFAULT 'medium';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualification JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action_deadline TIMESTAMPTZ;

-- 6.6 SCORE FUNCTION (from 002_imoveis_hub.sql)
CREATE OR REPLACE FUNCTION calculate_development_score(dev_id UUID)
RETURNS INT AS $$
DECLARE
    s INT := 0;
    dev RECORD;
BEGIN
    SELECT * INTO dev FROM developments WHERE id = dev_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    IF dev.name IS NOT NULL AND dev.name != '' THEN s := s + 10; END IF;
    IF dev.description IS NOT NULL AND dev.description != '' THEN s := s + 10; END IF;
    IF dev.images IS NOT NULL AND (dev.images->>'main') != '' THEN s := s + 15; END IF;
    RETURN LEAST(s, 100);
END;
$$ LANGUAGE plpgsql;

-- 7. Fix RLS Policies (Permissive for MVP Stabilization)
-- Allow Authenticated Users (Backoffice) to do EVERYTHING
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Backoffice Full Access Developers" ON developers;
DROP POLICY IF EXISTS "Backoffice Full Access Developments" ON developments;
DROP POLICY IF EXISTS "Backoffice Full Access Leads" ON leads;
DROP POLICY IF EXISTS "Backoffice Full Access Content" ON content;
DROP POLICY IF EXISTS "Backoffice Full Access Consultations" ON consultations;
DROP POLICY IF EXISTS "Backoffice Full Access Appraisals" ON appraisal_requests;
DROP POLICY IF EXISTS "Backoffice Full Access Reports" ON executive_reports;
DROP POLICY IF EXISTS "Backoffice Full Access Tracked Links" ON tracked_links;
DROP POLICY IF EXISTS "Backoffice Full Access Dev Events" ON development_events;

CREATE POLICY "Backoffice Full Access Developers" ON developers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Developments" ON developments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Leads" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Content" ON content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Consultations" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Appraisals" ON appraisal_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Reports" ON executive_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Tracked Links" ON tracked_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Backoffice Full Access Dev Events" ON development_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow Public READ Access where needed
DROP POLICY IF EXISTS "Public Read Developers" ON developers;
CREATE POLICY "Public Read Developers" ON developers FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read Developments" ON developments;
CREATE POLICY "Public Read Developments" ON developments FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read Content" ON content;
CREATE POLICY "Public Read Content" ON content FOR SELECT TO anon USING (status = 'published');

-- Leads/Consultations/Appraisals are WRITE ONLY for Public
DROP POLICY IF EXISTS "Public Insert Leads" ON leads;
CREATE POLICY "Public Insert Leads" ON leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Consultations" ON consultations;
CREATE POLICY "Public Insert Consultations" ON consultations FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Appraisals" ON appraisal_requests;
CREATE POLICY "Public Insert Appraisals" ON appraisal_requests FOR INSERT TO anon WITH CHECK (true);

-- 8. Storage Buckets (Upsert)
INSERT INTO storage.buckets (id, name, public) VALUES ('developments', 'developments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Storage (Allow Auth to Upload, Public to Read)
DROP POLICY IF EXISTS "Public Access Developments" ON storage.objects;
CREATE POLICY "Public Access Developments" ON storage.objects FOR SELECT USING (bucket_id = 'developments');

DROP POLICY IF EXISTS "Auth Upload Developments" ON storage.objects;
CREATE POLICY "Auth Upload Developments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'developments');

DROP POLICY IF EXISTS "Auth Delete Developments" ON storage.objects;
CREATE POLICY "Auth Delete Developments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'developments');

DROP POLICY IF EXISTS "Public Access Content" ON storage.objects;
CREATE POLICY "Public Access Content" ON storage.objects FOR SELECT USING (bucket_id = 'content');

DROP POLICY IF EXISTS "Auth Upload Content" ON storage.objects;
CREATE POLICY "Auth Upload Content" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content');

