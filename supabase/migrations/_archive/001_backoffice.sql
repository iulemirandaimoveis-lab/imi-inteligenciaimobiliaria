-- Developments (empreendimentos do site)
CREATE TABLE IF NOT EXISTS developments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    developer TEXT NOT NULL,
    developer_logo TEXT,
    status TEXT NOT NULL DEFAULT 'launch' CHECK (status IN ('launch', 'ready', 'under_construction')),
    region TEXT NOT NULL DEFAULT 'paraiba' CHECK (region IN ('paraiba', 'pernambuco', 'sao-paulo')),
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    delivery_date TEXT,
    registration_number TEXT,
    description TEXT,
    short_description TEXT,
    features JSONB DEFAULT '[]',
    specs JSONB DEFAULT '{}',
    price_min BIGINT,
    price_max BIGINT,
    images JSONB DEFAULT '{"main":"","gallery":[],"videos":[],"floorPlans":[]}',
    video_url TEXT,
    external_links JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    display_order INT DEFAULT 0,
    is_highlighted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Development Units
CREATE TABLE IF NOT EXISTS development_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    area DOUBLE PRECISION,
    position TEXT,
    tower TEXT,
    bedrooms INT,
    bathrooms INT,
    parking_spots INT,
    total_price BIGINT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (contatos do site)
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'website',
    interest TEXT,
    development_id UUID REFERENCES developments(id),
    message TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations (solicitações de consultoria)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    consultation_type TEXT,
    city_interest TEXT,
    investment_profile TEXT,
    budget_range TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Requests (solicitações de crédito)
CREATE TABLE IF NOT EXISTS credit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    credit_type TEXT DEFAULT 'consorcio',
    desired_value BIGINT,
    income_range TEXT,
    has_fgts BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'approved', 'denied')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appraisal Requests (solicitações de avaliação)
CREATE TABLE IF NOT EXISTS appraisal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    appraisal_type TEXT,
    property_type TEXT,
    city TEXT,
    address TEXT,
    timeline TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "auth_all_developments" ON developments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_units" ON development_units FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_leads" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_consultations" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_credit" ON credit_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_appraisals" ON appraisal_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon INSERT for public forms
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_consultations" ON consultations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_credit" ON credit_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_appraisals" ON appraisal_requests FOR INSERT TO anon WITH CHECK (true);

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "auth_upload_media" ON storage.objects;
CREATE POLICY "auth_upload_media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "public_read_media" ON storage.objects;
CREATE POLICY "public_read_media" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'media');

DROP POLICY IF EXISTS "auth_delete_media" ON storage.objects;
CREATE POLICY "auth_delete_media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
