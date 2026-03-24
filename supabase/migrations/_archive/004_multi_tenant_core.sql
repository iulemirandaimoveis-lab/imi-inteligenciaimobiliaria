-- ====================================================================
-- MIGRAÇÃO 004: Multi-Tenancy Core + IA Infrastructure
-- Sistema Operacional Comercial - Fase 1
-- Data: 2026-02-08
-- ====================================================================

-- 1. TENANTS (Workspaces Multi-Tenant)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    
    -- Nicho
    niche TEXT NOT NULL,
    playbook_id UUID,  -- FK será adicionada após criar niche_playbooks
    
    -- Identidade Visual
    brand_colors JSONB DEFAULT '{"primary":"#1a202c", "secondary":"#9a7147", "accent":"#3b82f6"}',
    brand_fonts JSONB DEFAULT '{"heading":"Playfair Display", "body":"Inter"}',
    brand_logo_url TEXT,
    
    -- Tom de Voz
    tone_of_voice TEXT DEFAULT 'profissional, educador, confiável',
    
    -- Público
    target_audience JSONB DEFAULT '[]',
    
    -- Configurações de IA
    ai_provider TEXT DEFAULT 'anthropic' CHECK (ai_provider IN ('anthropic', 'openai', 'google')),
    ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
    ai_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (ai_temperature BETWEEN 0 AND 1),
    ai_max_tokens INT DEFAULT 4096,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    subscription_tier TEXT DEFAULT 'professional' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NICHE PLAYBOOKS (Templates Reutilizáveis)
-- ====================================================================
CREATE TABLE IF NOT EXISTS niche_playbooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    
    -- Linguagem Padrão
    default_language JSONB DEFAULT '{}',
    
    -- Públicos Típicos
    typical_audiences JSONB DEFAULT '[]',
    
    -- Restrições Legais
    legal_restrictions TEXT,
    
    -- Templates de Campanhas
    campaign_templates JSONB DEFAULT '[]',
    
    -- Versão
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FK agora que a tabela existe
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_playbook 
    FOREIGN KEY (playbook_id) REFERENCES niche_playbooks(id);

-- 3. TENANT USERS (Vínculo Multi-Tenant)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'operator' CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

-- 4. AI REQUESTS (Infraestrutura de Logs IA)
-- ====================================================================
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Provider
    provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'google', 'openai')),
    model TEXT NOT NULL,
    
    -- Request
    prompt TEXT NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3,2),
    max_tokens INT,
    
    -- Response
    response TEXT,
    raw_response JSONB,
    
    -- Uso
    tokens_input INT,
    tokens_output INT,
    tokens_total INT,
    cost_usd DECIMAL(10,6),
    
    -- Performance
    latency_ms INT,
    
    -- Status
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    
    -- Contexto
    request_type TEXT,  -- 'generate_calendar', 'generate_content', 'analyze_ads', etc
    related_entity_type TEXT,
    related_entity_id UUID,
    
    -- Usuário que iniciou
    requested_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS POLICIES
-- ====================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

-- Tenants: usuário vê apenas seus tenants
CREATE POLICY "users_see_own_tenants" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

CREATE POLICY "admins_update_own_tenants" ON tenants
    FOR UPDATE USING (
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Playbooks: todos podem ver, apenas admins editam
CREATE POLICY "public_read_playbooks" ON niche_playbooks
    FOR SELECT USING (is_active = true);

CREATE POLICY "auth_all_playbooks" ON niche_playbooks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tenant Users: vê apenas do próprio tenant
CREATE POLICY "tenant_users_policy" ON tenant_users
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- AI Requests: vê apenas do próprio tenant
CREATE POLICY "ai_requests_policy" ON ai_requests
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    );

-- 6. ÍNDICES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_niche ON tenants(niche);
CREATE INDEX IF NOT EXISTS idx_playbooks_slug ON niche_playbooks(slug);
CREATE INDEX IF NOT EXISTS idx_playbooks_niche ON niche_playbooks(niche);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_tenant ON ai_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created ON ai_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_requests_type ON ai_requests(request_type);

-- 7. DADOS INICIAIS
-- ====================================================================

-- Playbook Real Estate Brasil
INSERT INTO niche_playbooks (slug, name, niche, default_language, typical_audiences, legal_restrictions, campaign_templates) VALUES
(
    'real_estate_brazil',
    'Mercado Imobiliário Brasil',
    'real_estate',
    '{
        "greetings": ["Olá! Ficou interessado(a) no imóvel?", "Oi! Como posso ajudar com sua busca?"],
        "objections_handling": {
            "price_high": "Entendo sua preocupação com o investimento. Vamos analisar tecnicamente o custo-benefício e a valorização da região...",
            "location_far": "A localização é estratégica. Vou detalhar a infraestrutura e os acessos disponíveis...",
            "need_time": "Sem problema! Vou enviar mais informações por email e podemos conversar quando for melhor para você."
        },
        "CTAs": [
            "Agende sua visita técnica",
            "Fale com um especialista",
            "Baixe a apresentação completa",
            "Simule seu financiamento",
            "Receba análise de investimento"
        ]
    }',
    '["investidores", "compradores_primeira_casa", "upgrade_residencial", "investidores_internacionais"]',
    'Lei 8.078/90 CDC: não prometer ROI garantido. Evitar termos como "garantia de lucro", "melhor investimento", "sem risco". CRECI obrigatório. NBR 14653 para avaliações. Informar claramente prazos de entrega e especificações técnicas.',
    '[
        {
            "type": "lancamento_empreendimento",
            "objective": "conversions",
            "platforms": ["meta_ads", "google_ads"],
            "budget_range": {"min": 5000, "max": 20000},
            "duration_days": 30,
            "suggested_audiences": ["investidores", "primeira_casa"]
        },
        {
            "type": "captacao_leads",
            "objective": "lead_generation",
            "platforms": ["meta_ads"],
            "budget_range": {"min": 2000, "max": 8000},
            "duration_days": 15
        }
    ]'
)
ON CONFLICT (slug) DO NOTHING;

-- Tenant IMI (Cliente Referência)
INSERT INTO tenants (slug, name, niche, tone_of_voice, target_audience, brand_colors) VALUES
(
    'imi-inteligencia-imobiliaria',
    'IMI - Inteligência Imobiliária',
    'real_estate',
    'técnico, autoridade, educador, confiável',
    '["investidores_qualificados", "compradores_alto_padrao", "investidores_internacionais"]',
    '{"primary": "#1a202c", "secondary": "#9a7147", "accent": "#3b82f6", "background": "#ffffff"}'
)
ON CONFLICT (slug) DO NOTHING;

-- Vincular playbook ao tenant IMI
UPDATE tenants 
SET playbook_id = (SELECT id FROM niche_playbooks WHERE slug = 'real_estate_brazil')
WHERE slug = 'imi-inteligencia-imobiliaria';

-- Comentários
COMMENT ON TABLE tenants IS 'Workspaces multi-tenant. Cada cliente Connectar = 1 tenant.';
COMMENT ON TABLE niche_playbooks IS 'Templates parametrizáveis por nicho de mercado.';
COMMENT ON TABLE ai_requests IS 'Log completo de todas chamadas às APIs de IA (Claude, Gemini).';

-- ====================================================================
-- FIM MIGRAÇÃO 004
-- ====================================================================
