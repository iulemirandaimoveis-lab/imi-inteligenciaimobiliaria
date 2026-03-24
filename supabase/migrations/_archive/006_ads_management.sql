-- ============================================================================
-- Migration 006: Ads Management & Analytics
-- Descrição: Módulo de gestão e análise de anúncios Google Ads + Meta Ads
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- TABELA: ads_accounts
-- Descrição: Contas de anúncios conectadas (Google Ads, Meta Ads, etc)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'linkedin_ads', 'tiktok_ads')),
    account_id VARCHAR(255) NOT NULL, -- ID externo da conta
    account_name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Credenciais (criptografadas)
    access_token TEXT, -- Token OAuth
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Metadata
    account_metadata JSONB DEFAULT '{}', -- Dados adicionais da plataforma
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'expired')),
    last_sync_at TIMESTAMPTZ,
    sync_frequency_hours INTEGER DEFAULT 24,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(tenant_id, platform, account_id)
);

CREATE INDEX idx_ads_accounts_tenant ON ads_accounts(tenant_id);
CREATE INDEX idx_ads_accounts_status ON ads_accounts(status);
CREATE INDEX idx_ads_accounts_platform ON ads_accounts(platform);

-- ============================================================================
-- TABELA: ads_campaigns
-- Descrição: Campanhas sincronizadas das plataformas de anúncios
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ads_account_id UUID NOT NULL REFERENCES ads_accounts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identificação externa
    campaign_id VARCHAR(255) NOT NULL, -- ID na plataforma
    campaign_name VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    
    -- Configuração
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'deleted')),
    objective VARCHAR(100), -- 'conversions', 'leads', 'awareness', etc
    budget_type VARCHAR(50), -- 'daily', 'lifetime'
    budget_amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'BRL',
    
    -- Datas
    start_date DATE,
    end_date DATE,
    
    -- Metadata
    campaign_metadata JSONB DEFAULT '{}',
    
    -- Análise IA
    ai_analysis JSONB, -- Análise Claude da performance
    ai_recommendations TEXT[], -- Sugestões de otimização
    last_analyzed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(ads_account_id, campaign_id)
);

CREATE INDEX idx_ads_campaigns_account ON ads_campaigns(ads_account_id);
CREATE INDEX idx_ads_campaigns_tenant ON ads_campaigns(tenant_id);
CREATE INDEX idx_ads_campaigns_status ON ads_campaigns(status);
CREATE INDEX idx_ads_campaigns_platform ON ads_campaigns(platform);

-- ============================================================================
-- TABELA: ads_metrics
-- Descrição: Métricas diárias das campanhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES ads_campaigns(id) ON DELETE CASCADE,
    ads_account_id UUID NOT NULL REFERENCES ads_accounts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Período
    date DATE NOT NULL,
    
    -- Métricas de impressão
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(10,4) DEFAULT 0,
    
    -- Métricas de engajamento
    clicks BIGINT DEFAULT 0,
    ctr DECIMAL(10,4) DEFAULT 0, -- Click-through rate
    engagements BIGINT DEFAULT 0,
    
    -- Métricas de conversão
    conversions BIGINT DEFAULT 0,
    conversion_rate DECIMAL(10,4) DEFAULT 0,
    leads BIGINT DEFAULT 0,
    sales BIGINT DEFAULT 0,
    
    -- Métricas financeiras
    spend DECIMAL(12,2) DEFAULT 0,
    cpc DECIMAL(12,4) DEFAULT 0, -- Cost per click
    cpm DECIMAL(12,4) DEFAULT 0, -- Cost per mille (1000 impressions)
    cpa DECIMAL(12,4) DEFAULT 0, -- Cost per acquisition
    roas DECIMAL(10,4) DEFAULT 0, -- Return on ad spend
    revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    raw_data JSONB DEFAULT '{}', -- Dados brutos da plataforma
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, date)
);

CREATE INDEX idx_ads_metrics_campaign ON ads_metrics(campaign_id);
CREATE INDEX idx_ads_metrics_account ON ads_metrics(ads_account_id);
CREATE INDEX idx_ads_metrics_tenant ON ads_metrics(tenant_id);
CREATE INDEX idx_ads_metrics_date ON ads_metrics(date DESC);
CREATE INDEX idx_ads_metrics_spend ON ads_metrics(spend DESC);

-- ============================================================================
-- TABELA: ads_insights
-- Descrição: Insights e análises de IA sobre desperdícios e oportunidades
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   ads_account_id UUID REFERENCES ads_accounts(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ads_campaigns(id) ON DELETE CASCADE,
    
    -- Insight
    insight_type VARCHAR(100) NOT NULL CHECK (insight_type IN (
        'high_cpa', 'low_conversion', 'budget_waste', 'opportunity',
        'audience_fatigue', 'creative_decline', 'bid_optimization',
        'targeting_improvement', 'budget_reallocation'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Análise IA
    ai_analysis TEXT, -- Análise detalhada do Claude
    recommendations TEXT[], -- Lista de ações sugeridas
    estimated_impact DECIMAL(12,2), -- Economia ou ganho estimado (BRL)
    
    -- Métricas relacionadas
    current_metric_value DECIMAL(12,4),
    benchmark_metric_value DECIMAL(12,4),
    metric_name VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Período analisado
    analysis_start_date DATE,
    analysis_end_date DATE,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ai_request_id UUID REFERENCES ai_requests(id)
);

CREATE INDEX idx_ads_insights_tenant ON ads_insights(tenant_id);
CREATE INDEX idx_ads_insights_account ON ads_insights(ads_account_id);
CREATE INDEX idx_ads_insights_campaign ON ads_insights(campaign_id);
CREATE INDEX idx_ads_insights_type ON ads_insights(insight_type);
CREATE INDEX idx_ads_insights_severity ON ads_insights(severity);
CREATE INDEX idx_ads_insights_status ON ads_insights(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_insights ENABLE ROW LEVEL SECURITY;

-- Policies ads_accounts
CREATE POLICY "Users can view ads_accounts from their tenants"
    ON ads_accounts FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage ads_accounts from their tenants"
    ON ads_accounts FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    ));

-- Policies ads_campaigns
CREATE POLICY "Users can view ads_campaigns from their tenants"
    ON ads_campaigns FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage ads_campaigns from their tenants"
    ON ads_campaigns FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    ));

-- Policies ads_metrics
CREATE POLICY "Users can view ads_metrics from their tenants"
    ON ads_metrics FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

-- Policies ads_insights
CREATE POLICY "Users can view ads_insights from their tenants"
    ON ads_insights FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage ads_insights from their tenants"
    ON ads_insights FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_accounts_updated_at BEFORE UPDATE ON ads_accounts
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER ads_campaigns_updated_at BEFORE UPDATE ON ads_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER ads_metrics_updated_at BEFORE UPDATE ON ads_metrics
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER ads_insights_updated_at BEFORE UPDATE ON ads_insights
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Resumo consolidado por campanha (últimos 30 dias)
CREATE OR REPLACE VIEW ads_campaigns_summary AS
SELECT 
    c.id AS campaign_id,
    c.campaign_name,
    c.platform,
    c.status,
    c.tenant_id,
    COUNT(DISTINCT m.date) AS days_active,
    SUM(m.impressions) AS total_impressions,
    SUM(m.clicks) AS total_clicks,
    AVG(m.ctr) AS avg_ctr,
    SUM(m.conversions) AS total_conversions,
    SUM(m.spend) AS total_spend,
    AVG(m.cpc) AS avg_cpc,
    AVG(m.cpa) AS avg_cpa,
    AVG(m.roas) AS avg_roas,
    SUM(m.revenue) AS total_revenue,
    (SUM(m.revenue) - SUM(m.spend)) AS profit
FROM ads_campaigns c
LEFT JOIN ads_metrics m ON m.campaign_id = c.id 
    AND m.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.campaign_name, c.platform, c.status, c.tenant_id;

-- ============================================================================
-- DADOS INICIAIS (Exemplo para teste)
-- ============================================================================

-- Nenhum dado inicial necessário (contas serão conectadas via OAuth)

-- ============================================================================
-- FIM DA MIGRATION 006
-- ============================================================================
