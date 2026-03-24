-- ============================================================================
-- Migration 009: Playbooks Extended + Versionamento
-- Descrição: Extensão de playbooks para parametrização completa por nicho
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- EXTEND: niche_playbooks (adicionar campos)
-- ============================================================================

ALTER TABLE niche_playbooks ADD COLUMN IF NOT EXISTS content_guidelines JSONB DEFAULT '{}';
ALTER TABLE niche_playbooks ADD COLUMN IF NOT EXISTS crm_scripts JSONB DEFAULT '{}';
ALTER TABLE niche_playbooks ADD COLUMN IF NOT EXISTS whatsapp_templates JSONB DEFAULT '[]';
ALTER TABLE niche_playbooks ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT '[]';

-- ============================================================================
-- TABELA: playbook_versions
-- Descrição: Versionamento completo de playbooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS playbook_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES niche_playbooks(id) ON DELETE CASCADE,
    version INT NOT NULL,
    changes_summary TEXT,
    snapshot JSONB NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(playbook_id, version)
);

CREATE INDEX idx_playbook_versions_playbook ON playbook_versions(playbook_id);
CREATE INDEX idx_playbook_versions_created ON playbook_versions(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE playbook_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view playbook versions"
    ON playbook_versions FOR SELECT
    USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Criar versão automaticamente ao atualizar playbook
CREATE OR REPLACE FUNCTION create_playbook_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementa versão
    NEW.version = COALESCE(OLD.version, 1) + 1;
    
    -- Cria snapshot da versão anterior
    INSERT INTO playbook_versions (
        playbook_id,
        version,
        snapshot,
        changed_by
    ) VALUES (
        OLD.id,
        COALESCE(OLD.version, 1),
        row_to_json(OLD.*),
        auth.uid() -- Melhor forma de pegar o usuário no Supabase
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playbook_versioning
    BEFORE UPDATE ON niche_playbooks
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION create_playbook_version();


-- ============================================================================
-- DADOS: Atualizar playbook real_estate com novos campos
-- ============================================================================

UPDATE niche_playbooks
SET 
    content_guidelines = '{
        "forbidden_terms": [
            "garantia de lucro",
            "melhor investimento do mercado",
            "sem risco",
            "valorização garantida"
        ],
        "required_disclaimers": [
            "Consulte condições e documentação técnica",
            "Imagens meramente ilustrativas"
        ],
        "hashtag_strategy": "3-5 hashtags relevantes, mix de genéricas e específicas",
        "post_length_limits": {
            "instagram_feed": 2200,
            "instagram_story": 80,
            "facebook": 5000,
            "linkedin": 3000,
            "twitter": 280
        },
        "image_style": "profissional, clean, alta qualidade, foco no imóvel"
    }',
    crm_scripts = '{
        "qualification_questions": [
            "Qual o prazo que você tem em mente para a compra?",
            "Já tem um orçamento definido?",
            "É para morar ou investimento?",
            "Precisa vender algum imóvel antes?",
            "Já tem pré-aprovação de financiamento?"
        ],
        "objection_responses": {
            "price_high": "Entendo sua preocupação com o investimento. Vamos analisar tecnicamente o custo-benefício considerando localização, infraestrutura e potencial de valorização...",
            "location_far": "A localização é estratégica. Deixe-me detalhar os acessos, transporte público e a infraestrutura completa da região...",
            "need_time": "Sem problema! Vou enviar por email uma análise completa do imóvel e podemos conversar quando for melhor para você.",
            "comparing_options": "Excelente! Comparar é fundamental. Posso preparar um comparativo técnico detalhado entre as opções que você está considerando?"
        },
        "follow_up_sequences": [
            {
                "trigger": "no_response_24h",
                "channel": "whatsapp",
                "message": "Olá! Vi que você demonstrou interesse no {property_name}. Tem alguma dúvida que eu possa esclarecer?"
            },
            {
                "trigger": "no_response_7days",
                "channel": "email",
                "subject": "Novidades sobre {property_name}",
                "message": "Preparei uma análise completa do imóvel que você consultou..."
            }
        ]
    }',
    whatsapp_templates = '[
        {
            "name": "boas_vindas",
            "category": "greeting",
            "message": "Olá {{1}}! Obrigado pelo interesse. Como posso ajudar com sua busca por imóveis?"
        },
        {
            "name": "agendamento_visita",
            "category": "scheduling",
            "message": "Ótimo! Temos disponibilidade para visita ao {{1}} nos seguintes horários: {{2}}. Qual prefere?"
        },
        {
            "name": "follow_up_interesse",
            "category": "follow_up",
            "message": "Oi {{1}}! Vi que você consultou o {{2}}. Gostaria de agendar uma visita ou tem alguma dúvida?"
        }
    ]',
    email_templates = '[
        {
            "name": "analise_imovel",
            "subject": "Análise Completa: {property_name}",
            "category": "property_info",
            "body_html": "<h2>Análise Técnica do Imóvel</h2><p>Preparamos uma análise detalhada...</p>"
        },
        {
            "name": "comparativo_imoveis",
            "subject": "Comparativo Técnico: Opções Selecionadas",
            "category": "comparison",
            "body_html": "<h2>Comparativo Técnico</h2><table>...</table>"
        }
    ]'
WHERE slug = 'real_estate_brazil';

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE playbook_versions IS 'Versionamento completo de playbooks com snapshots';
COMMENT ON COLUMN niche_playbooks.content_guidelines IS 'Diretrizes de conteúdo: termos proibidos, disclaimers, estratégia hashtags';
COMMENT ON COLUMN niche_playbooks.crm_scripts IS 'Scripts de qualificação, respostas a objeções e sequências de follow-up';
COMMENT ON COLUMN niche_playbooks.whatsapp_templates IS 'Templates de mensagens WhatsApp aprovados';
COMMENT ON COLUMN niche_playbooks.email_templates IS 'Templates de emails para automação';

-- ============================================================================
-- FIM DA MIGRATION 009
-- ============================================================================
