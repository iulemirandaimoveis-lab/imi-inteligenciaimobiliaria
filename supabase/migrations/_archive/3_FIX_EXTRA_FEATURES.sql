-- PARTE 3: RECURSOS EXTRAS (Ads, IA, Conteúdo)
-- Execute este script para garantir que Dashboard e Relatórios funcionem plenamente.

-- Habilita extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AI REQUESTS (Registro de uso da IA)
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- References tenants(id)
    provider TEXT, -- 'anthropic', 'openai'
    model TEXT,
    prompt TEXT,
    response TEXT,
    tokens_input INT,
    tokens_output INT,
    tokens_total INT,
    cost_usd DECIMAL(10,6),
    status TEXT,
    request_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth AI Access" ON ai_requests;
CREATE POLICY "Auth AI Access" ON ai_requests FOR ALL USING (auth.role() = 'authenticated');

-- 2. ADS CAMPAIGNS (Campanhas de Anúncios)
CREATE TABLE IF NOT EXISTS ads_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    name TEXT,
    platform TEXT, -- 'meta', 'google'
    status TEXT DEFAULT 'active',
    budget_total DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Ads Campaigns" ON ads_campaigns;
CREATE POLICY "Auth Ads Campaigns" ON ads_campaigns FOR ALL USING (auth.role() = 'authenticated');

-- 3. ADS METRICS (Métricas Diárias)
CREATE TABLE IF NOT EXISTS ads_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
    tenant_id UUID,
    date DATE NOT NULL,
    spend DECIMAL(12,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ads_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Ads Metrics" ON ads_metrics;
CREATE POLICY "Auth Ads Metrics" ON ads_metrics FOR ALL USING (auth.role() = 'authenticated');

-- 4. CONTENT PUBLICATIONS (Blog Posts Published)
CREATE TABLE IF NOT EXISTS content_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    title TEXT,
    slug TEXT, -- Removido UNIQUE para evitar conflitos se tabela já existe
    published_content TEXT,
    published_image_urls TEXT[],
    status TEXT DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    impressions INT DEFAULT 0,
    engagement INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE content_publications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Publications" ON content_publications;
CREATE POLICY "Public Read Publications" ON content_publications FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Auth Manage Publications" ON content_publications;
CREATE POLICY "Auth Manage Publications" ON content_publications FOR ALL USING (auth.role() = 'authenticated');

-- 5. NICHE PLAYBOOKS (Opcional, mas referenciado em tenants)
CREATE TABLE IF NOT EXISTS niche_playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE,
    name TEXT,
    niche TEXT,
    default_language JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE niche_playbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Playbooks" ON niche_playbooks;
CREATE POLICY "Public Read Playbooks" ON niche_playbooks FOR SELECT USING (true);
