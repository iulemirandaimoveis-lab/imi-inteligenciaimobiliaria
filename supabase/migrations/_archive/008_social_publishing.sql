-- ============================================================================
-- Migration 008: Social Media Publishing Automation
-- Descrição: Publicação automática em redes sociais (Meta, LinkedIn, etc)
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- TABELA: social_accounts
-- Descrição: Contas de redes sociais conectadas (OAuth tokens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Plataforma
    platform VARCHAR(50) NOT NULL CHECK (platform IN (
        'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'
    )),
    
    -- Dados da conta
    account_id VARCHAR(255) NOT NULL, -- ID externo
    account_name VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    profile_url TEXT,
    profile_image_url TEXT,
    
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Permissões
    granted_permissions TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'error')),
    last_used_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Metadata
    account_metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    connected_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, platform, account_id)
);

CREATE INDEX idx_social_accounts_tenant ON social_accounts(tenant_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_status ON social_accounts(status);

-- ============================================================================
-- TABELA: content_publications
-- Descrição: Log de publicações realizadas (sucesso ou falha)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    content_variant_id UUID REFERENCES content_variants(id) ON DELETE SET NULL,
    social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Publicação
    platform VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
    )),
    
    -- Resultado
    external_post_id VARCHAR(500), -- ID do post na plataforma
    external_post_url TEXT,
    error_code VARCHAR(100),
    error_message TEXT,
    
    -- Conteúdo publicado
    published_content TEXT,
    published_image_urls TEXT[],
    published_video_url TEXT,
    
    -- Analytics (preenchido depois)
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    engagement BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    shares BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    
    -- Metadata
    publication_metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    published_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_publications_item ON content_publications(content_item_id);
CREATE INDEX idx_content_publications_account ON content_publications(social_account_id);
CREATE INDEX idx_content_publications_status ON content_publications(status);
CREATE INDEX idx_content_publications_scheduled ON content_publications(scheduled_for);
CREATE INDEX idx_content_publications_platform ON content_publications(platform);

-- ============================================================================
-- TABELA: publishing_queue
-- Descrição: Fila de posts agendados para publicação
-- ============================================================================

CREATE TABLE IF NOT EXISTS publishing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_publication_id UUID NOT NULL REFERENCES content_publications(id) ON DELETE CASCADE,
    
    -- Agendamento
    scheduled_for TIMESTAMPTZ NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN (
        'queued', 'processing', 'completed', 'failed', 'cancelled'
    )),
    
    -- Logs
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_logs JSONB DEFAULT '[]',
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publishing_queue_scheduled ON publishing_queue(scheduled_for);
CREATE INDEX idx_publishing_queue_status ON publishing_queue(status);
CREATE INDEX idx_publishing_queue_publication ON publishing_queue(content_publication_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;

-- Policies social_accounts
CREATE POLICY "Users can view social_accounts from their tenants"
    ON social_accounts FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage social_accounts from their tenants"
    ON social_accounts FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'owner')
    ));

-- Policies content_publications
CREATE POLICY "Users can view content_publications from their tenants"
    ON content_publications FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create content_publications from their tenants"
    ON content_publications FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update content_publications from their tenants"
    ON content_publications FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    ));

-- Policies publishing_queue
CREATE POLICY "Users can view publishing_queue from their publications"
    ON publishing_queue FOR SELECT
    USING (content_publication_id IN (
        SELECT id FROM content_publications
        WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger: Atualizar updated_at
CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER content_publications_updated_at BEFORE UPDATE ON content_publications
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER publishing_queue_updated_at BEFORE UPDATE ON publishing_queue
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

-- Function: Criar registro na fila quando publicação é agendada
CREATE OR REPLACE FUNCTION queue_scheduled_publication()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'scheduled' AND NEW.scheduled_for IS NOT NULL THEN
        INSERT INTO publishing_queue (
            content_publication_id,
            scheduled_for,
            status
        ) VALUES (
            NEW.id,
            NEW.scheduled_for,
            'queued'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_queue_publication
    AFTER INSERT OR UPDATE ON content_publications
    FOR EACH ROW
    WHEN (NEW.status = 'scheduled')
    EXECUTE FUNCTION queue_scheduled_publication();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Posts pendentes de publicação
CREATE OR REPLACE VIEW publications_pending AS
SELECT 
    cp.*,
    sa.platform AS account_platform,
    sa.account_name,
    ci.title AS content_title,
    pq.scheduled_for AS queue_scheduled_for,
    pq.retry_count,
    pq.status AS queue_status
FROM content_publications cp
JOIN social_accounts sa ON sa.id = cp.social_account_id
JOIN content_items ci ON ci.id = cp.content_item_id
LEFT JOIN publishing_queue pq ON pq.content_publication_id = cp.id
WHERE cp.status IN ('pending', 'scheduled')
ORDER BY cp.scheduled_for ASC NULLS LAST;

-- View: Analytics consolidado por post
CREATE OR REPLACE VIEW content_analytics AS
SELECT
    ci.id AS content_item_id,
    ci.title,
    ci.created_at AS content_created_at,
    COUNT(DISTINCT cp.id) AS total_publications,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'published') AS published_count,
    SUM(cp.impressions) AS total_impressions,
    SUM(cp.reach) AS total_reach,
    SUM(cp.engagement) AS total_engagement,
    SUM(cp.clicks) AS total_clicks,
    SUM(cp.likes) AS total_likes,
    SUM(cp.comments) AS total_comments,
    SUM(cp.shares) AS total_shares,
    ROUND(
        CASE 
            WHEN SUM(cp.impressions) > 0 THEN (SUM(cp.engagement)::DECIMAL / SUM(cp.impressions)) * 100
            ELSE 0
        END, 2
    ) AS engagement_rate
FROM content_items ci
LEFT JOIN content_publications cp ON cp.content_item_id = ci.id
GROUP BY ci.id, ci.title, ci.created_at;

-- ============================================================================
-- FIM DA MIGRATION 008
-- ============================================================================
