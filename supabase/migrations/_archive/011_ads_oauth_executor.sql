-- ============================================================================
-- Migration 011: Ads OAuth + Executor
-- Descrição: OAuth real + execução de ações em campanhas
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- EXTEND: ads_accounts (adicionar campos OAuth)
-- ============================================================================

ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS scopes TEXT[];
ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS customer_id TEXT; -- Google Ads
ALTER TABLE ads_accounts ADD COLUMN IF NOT EXISTS ad_account_id TEXT; -- Meta Ads

-- ============================================================================
-- EXTEND: ads_campaigns (adicionar campos otimização)
-- ============================================================================

ALTER TABLE ads_campaigns ADD COLUMN IF NOT EXISTS auto_optimization_enabled BOOLEAN DEFAULT false;
ALTER TABLE ads_campaigns ADD COLUMN IF NOT EXISTS optimization_rules JSONB DEFAULT '[]';

-- ============================================================================
-- TABELA: ads_actions
-- Descrição: Log de todas ações executadas em campanhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES ads_campaigns(id) ON DELETE CASCADE,
    
    action_type TEXT NOT NULL CHECK (action_type IN (
        'pause', 'activate', 'adjust_bid', 'change_budget', 'change_audience', 'duplicate'
    )),
    
    action_params JSONB,
    reason TEXT, -- Recomendação IA que motivou
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    result JSONB,
    error_message TEXT,
    
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_actions_tenant ON ads_actions(tenant_id);
CREATE INDEX idx_ads_actions_campaign ON ads_actions(campaign_id);
CREATE INDEX idx_ads_actions_executed ON ads_actions(executed_at DESC);
CREATE INDEX idx_ads_actions_status ON ads_actions(status);

-- ============================================================================
-- TABELA: ads_sync_logs
-- Descrição: Log de sincronizações com APIs externas
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ads_account_id UUID NOT NULL REFERENCES ads_accounts(id) ON DELETE CASCADE,
    
    sync_type TEXT NOT NULL CHECK (sync_type IN ('campaigns', 'metrics', 'full')),
    
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
    
    campaigns_synced INT DEFAULT 0,
    metrics_synced INT DEFAULT 0,
    errors_count INT DEFAULT 0,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    error_details JSONB
);

CREATE INDEX idx_ads_sync_logs_account ON ads_sync_logs(ads_account_id);
CREATE INDEX idx_ads_sync_logs_started ON ads_sync_logs(started_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ads_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ads_actions from their tenants"
    ON ads_actions FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can create ads_actions from their tenants"
    ON ads_actions FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can view ads_sync_logs from their tenants"
    ON ads_sync_logs FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE ads_actions IS 'Log de todas ações executadas em campanhas (pausar, ajustar lance, etc)';
COMMENT ON TABLE ads_sync_logs IS 'Log de sincronizações com Google Ads e Meta Ads APIs';

-- ============================================================================
-- FIM DA MIGRATION 011
-- ============================================================================
