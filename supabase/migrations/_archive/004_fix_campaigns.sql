-- ====================================================================
-- MIGRATION 004_FIX: Sistema de Campanhas de Marketing
-- ====================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('google_ads', 'facebook_ads', 'instagram_ads', 'email', 'sms', 'whatsapp', 'organic', 'referral', 'event', 'other')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Vinculação
    development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
    
    -- Datas
    start_date DATE,
    end_date DATE,
    
    -- Orçamento
    budget NUMERIC(12,2),
    spent NUMERIC(12,2) DEFAULT 0,
    
    -- Métricas
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads_count INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Cálculos automáticos
    cpl NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE WHEN leads_count > 0 
        THEN spent / leads_count 
        ELSE 0 END
    ) STORED,
    
    cpc NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE WHEN clicks > 0 
        THEN spent / clicks 
        ELSE 0 END
    ) STORED,
    
    ctr NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 
        THEN (clicks::NUMERIC / impressions * 100) 
        ELSE 0 END
    ) STORED,
    
    conversion_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN leads_count > 0 
        THEN (conversions::NUMERIC / leads_count * 100) 
        ELSE 0 END
    ) STORED,
    
    -- UTM
    utm_params JSONB DEFAULT '{}'::jsonb,
    
    -- Meta
    description TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_campaigns" 
    ON campaigns FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Trigger
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_development ON campaigns(development_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- Vincular leads às campanhas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_leads_campaign ON leads(campaign_id);
    END IF;
END $$;

COMMENT ON TABLE campaigns IS 'Campanhas de marketing e geração de leads';
