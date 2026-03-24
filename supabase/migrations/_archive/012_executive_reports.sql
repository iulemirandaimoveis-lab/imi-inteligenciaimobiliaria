-- ============================================================================
-- Migration 012: Executive Reports
-- Descrição: Relatórios executivos semanais/mensais com IA
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- TABELA: executive_reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly')),
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Resumo executivo (gerado por Claude)
    summary TEXT,
    
    -- Métricas consolidadas
    metrics JSONB NOT NULL,
    
    -- Insights da IA
    insights JSONB,
    
    -- Recomendações
    recommendations JSONB,
    
    -- Breakdown de custos
    cost_breakdown JSONB,
    
    -- Metadata
    generated_by UUID REFERENCES auth.users(id),
    ai_request_id UUID REFERENCES ai_requests(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_executive_reports_tenant ON executive_reports(tenant_id);
CREATE INDEX idx_executive_reports_period ON executive_reports(period_start, period_end);
CREATE INDEX idx_executive_reports_type ON executive_reports(report_type);
CREATE INDEX idx_executive_reports_created ON executive_reports(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executive_reports from their tenants"
    ON executive_reports FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can create executive_reports from their tenants"
    ON executive_reports FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- ============================================================================
-- VIEW: analytics_consolidated
-- Descrição: Métricas consolidadas para facilitar geração de relatórios
-- ============================================================================

CREATE OR REPLACE VIEW analytics_consolidated AS
SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    
    -- Conteúdos
    COUNT(DISTINCT ci.id) AS total_posts_created,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'published') AS total_posts_published,
    COALESCE(SUM(cp.impressions), 0) AS total_impressions,
    COALESCE(SUM(cp.engagement), 0) AS total_engagement,
    
    -- Ads
    COUNT(DISTINCT ac.id) AS total_campaigns,
    COALESCE(SUM(am.spend), 0) AS total_ad_spend,
    COALESCE(SUM(am.conversions), 0) AS total_conversions,
    
    -- CRM
    COUNT(DISTINCT l.id) AS total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.ai_score >= 80) AS high_quality_leads,
    AVG(l.ai_score) AS avg_lead_score,
    
    -- IA
    COUNT(DISTINCT air.id) AS total_ai_requests,
    COALESCE(SUM(air.cost_usd), 0) AS total_ai_cost

FROM tenants t
LEFT JOIN content_items ci ON ci.tenant_id = t.id
LEFT JOIN content_publications cp ON cp.tenant_id = t.id
LEFT JOIN ads_campaigns ac ON ac.tenant_id = t.id
LEFT JOIN ads_metrics am ON am.campaign_id = ac.id
LEFT JOIN leads l ON l.tenant_id = t.id
LEFT JOIN ai_requests air ON air.tenant_id = t.id


GROUP BY t.id, t.name;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE executive_reports IS 'Relatórios executivos semanais/mensais gerados com análise Claude';
COMMENT ON VIEW analytics_consolidated IS 'Métricas consolidadas de todos módulos por tenant';

-- ============================================================================
-- FIM DA MIGRATION 012
-- ============================================================================
