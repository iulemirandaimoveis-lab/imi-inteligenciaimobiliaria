-- ====================================================================
-- MIGRAÇÃO 005: Módulo Conteúdos + IA
-- Sistema Operacional Comercial - Fase 2
-- Data: 2026-02-08
-- ====================================================================

-- 1. CONTENT CALENDAR (Planejamento Mensal)
-- ====================================================================
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Período
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2024),
    
    -- Brief Estruturado
    objectives TEXT[] DEFAULT '{}',
    offers JSONB DEFAULT '[]',
    strategic_dates JSONB DEFAULT '[]',
    legal_restrictions TEXT,
    custom_instructions TEXT,
    
    -- Planejamento Gerado pela IA
    ai_plan JSONB,
    ai_request_id UUID REFERENCES ai_requests(id),
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ai_generated', 'approved', 'active', 'archived')),
    
    -- Aprovação
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, month, year)
);

-- 2. CONTENT ITEMS (Posts Individuais)
-- ====================================================================
CREATE TABLE IF NOT EXISTS content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    calendar_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
    
    -- Identificação
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'video_script', 'carousel', 'reel')),
    
    -- Conteúdo Base
    base_copy TEXT,
    base_cta TEXT,
    hashtags TEXT[] DEFAULT '{}',
    tone TEXT,
    
    -- Mídia
    image_prompt TEXT,
    image_url TEXT,
    media_urls JSONB DEFAULT '[]',
    
    -- Agendamento
    scheduled_date DATE,
    scheduled_time TIME,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 
        'ai_generated', 
        'image_generating',
        'image_generated', 
        'approved', 
        'scheduled', 
        'published', 
        'failed',
        'archived'
    )),
    
    -- Aprovação
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Logs IA
    ai_request_ids UUID[] DEFAULT '{}',
    
    -- Métricas (preenchidas após publicação)
    performance_metrics JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTENT VARIANTS (Adaptações por Canal)
-- ====================================================================
CREATE TABLE IF NOT EXISTS content_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    
    -- Canal
    platform TEXT NOT NULL CHECK (platform IN (
        'instagram_feed', 
        'instagram_story', 
        'instagram_reel',
        'facebook', 
        'linkedin', 
        'tiktok', 
        'whatsapp',
        'twitter'
    )),
    
    -- Adaptações
    adapted_copy TEXT,
    adapted_cta TEXT,
    adapted_hashtags TEXT[] DEFAULT '{}',
    character_count INT,
    
    -- Mídia Específica
    media_url TEXT,
    aspect_ratio TEXT CHECK (aspect_ratio IN ('1:1', '4:5', '9:16', '16:9')),
    
    -- Gerado por IA
    ai_request_id UUID REFERENCES ai_requests(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_item_id, platform)
);

-- 4. RLS POLICIES
-- ====================================================================
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;

-- Políticas baseadas em tenant
CREATE POLICY "content_calendar_tenant_policy" ON content_calendar
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "content_items_tenant_policy" ON content_items
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "content_variants_tenant_policy" ON content_variants
    FOR ALL USING (
        content_item_id IN (
            SELECT id FROM content_items WHERE tenant_id IN (
                SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
            )
        )
    );

-- 5. ÍNDICES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_content_calendar_tenant ON content_calendar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_period ON content_calendar(year, month);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

CREATE INDEX IF NOT EXISTS idx_content_items_tenant ON content_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_items_calendar ON content_items(calendar_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_date, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_content_variants_item ON content_variants(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_variants_platform ON content_variants(platform);

-- 6. FUNÇÕES AUXILIARES
-- ====================================================================

-- Função para validar se data de agendamento é futura
CREATE OR REPLACE FUNCTION validate_scheduled_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Data de agendamento não pode ser no passado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_scheduled_date
    BEFORE INSERT OR UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_scheduled_date();

-- Comentários
COMMENT ON TABLE content_calendar IS 'Planejamento mensal de conteúdo gerado por IA';
COMMENT ON TABLE content_items IS 'Posts individuais com texto base e mídia';
COMMENT ON TABLE content_variants IS 'Adaptações automáticas por canal social';

-- ====================================================================
-- FIM MIGRAÇÃO 005
-- ====================================================================
