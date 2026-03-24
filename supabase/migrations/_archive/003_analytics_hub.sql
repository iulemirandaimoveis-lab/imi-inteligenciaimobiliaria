
-- 003: Analytics & Marketing Intelligence
-- Este arquivo habilita a persistência para Ads, Reports e Logs de Leads.

-- 1. Campanhas de Anúncios (Marketing Center)
CREATE TABLE IF NOT EXISTS ads_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('google_ads', 'meta_ads', 'linkedin_ads', 'tiktok_ads')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    budget DECIMAL(12,2) DEFAULT 0,
    spend DECIMAL(12,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    cpa DECIMAL(10,2) DEFAULT 0,
    trend TEXT DEFAULT 'neutral',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_ads" ON ads_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Relatórios Executivos (IA Intelligence)
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT CHECK (report_type IN ('weekly', 'monthly')),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    summary TEXT,
    metrics JSONB DEFAULT '{}',
    insights TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_reports" ON executive_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Lead Qualification Logs
CREATE TABLE IF NOT EXISTS lead_qualifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    reasoning TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lead_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_qualifications" ON lead_qualifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Initial Data for Ads (Demonstration)
INSERT INTO ads_campaigns (name, platform, status, budget, spend, impressions, clicks, conversions, ctr, cpa, trend)
VALUES 
('Luxury Launch - Ocean View', 'meta_ads', 'active', 15000, 12450.50, 450000, 12420, 154, 2.76, 80.84, 'up'),
('Google Search - Alto Padrão PR', 'google_ads', 'active', 25000, 18200.00, 65000, 3890, 89, 5.98, 204.49, 'neutral'),
('Retargeting High Performance', 'meta_ads', 'paused', 5000, 4850.20, 120000, 2150, 42, 1.79, 115.48, 'down')
ON CONFLICT DO NOTHING;
