-- ============================================================================
-- Migration 007: CRM Prescritivo com IA
-- Descrição: Qualificação automática de leads, scoring e sugestões de follow-up
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- EXTEND: leads table (adicionar campos de IA)
-- ============================================================================

-- Adiciona colunas para IA no leads existente
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualification JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_priority VARCHAR(20) DEFAULT 'medium' CHECK (ai_priority IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_recommendations TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action_deadline TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_request_id UUID REFERENCES ai_requests(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ai_priority ON leads(ai_priority);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_deadline ON leads(ai_next_action_deadline);

-- ============================================================================
-- TABELA: lead_interactions
-- Descrição: Histórico de interações com leads (calls, emails, whatsapp, etc)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Tipo de interação
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'call', 'email', 'whatsapp', 'meeting', 'site_visit',
        'proposal_sent', 'contract_signed', 'objection', 'follow_up', 'other'
    )),
    
    -- Direção
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    
    -- Conteúdo
    subject VARCHAR(500),
    notes TEXT,
    outcome VARCHAR(100), -- 'interested', 'not_interested', 'callback', 'no_answer', etc
    
    -- Metadata
    duration_seconds INTEGER, -- Para calls/meetings
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- IA
    ai_sentiment VARCHAR(20) CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    ai_summary TEXT, -- Resumo gerado por IA
    ai_extracted_intent VARCHAR(200), -- Intenção detectada
    
    -- Auditoria
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_type ON lead_interactions(interaction_type);
CREATE INDEX idx_lead_interactions_date ON lead_interactions(created_at DESC);

-- ============================================================================
-- TABELA: lead_follow_ups
-- Descrição: Follow-ups sugeridos pela IA e agendados
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Follow-up
    suggested_action VARCHAR(500) NOT NULL,
    suggested_message TEXT,
    suggested_channel VARCHAR(50) CHECK (suggested_channel IN ('call', 'email', 'whatsapp', 'meeting')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'cancelled')),
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    completion_notes TEXT,
    
    -- IA
    ai_rationale TEXT, -- Por que a IA sugeriu isso
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1), -- 0.0 a 1.0
    ai_request_id UUID REFERENCES ai_requests(id),
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_follow_ups_lead ON lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_status ON lead_follow_ups(status);
CREATE INDEX idx_lead_follow_ups_scheduled ON lead_follow_ups(scheduled_for);

-- ============================================================================
-- TABELA: lead_scoring_history
-- Descrição: Histórico de mudanças no score do lead (para tracking de evolução)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_scoring_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Score
    previous_score INTEGER,
    new_score INTEGER NOT NULL,
    score_change INTEGER, -- Calculado: new - previous
    
    -- Razão da mudança
    change_reason VARCHAR(200),
    change_factors JSONB, -- Fatores que influenciaram
    
    -- IA
    ai_analysis TEXT,
    ai_request_id UUID REFERENCES ai_requests(id),
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_scoring_history_lead ON lead_scoring_history(lead_id);
CREATE INDEX idx_lead_scoring_history_date ON lead_scoring_history(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_history ENABLE ROW LEVEL SECURITY;

-- Policies lead_interactions
CREATE POLICY "Users can view lead_interactions from their leads"
    ON lead_interactions FOR SELECT
    USING (lead_id IN (
        SELECT id FROM leads WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage lead_interactions from their leads"
    ON lead_interactions FOR ALL
    USING (lead_id IN (
        SELECT id FROM leads WHERE user_id = auth.uid()
    ));

-- Policies lead_follow_ups
CREATE POLICY "Users can view lead_follow_ups from their leads"
    ON lead_follow_ups FOR SELECT
    USING (lead_id IN (
        SELECT id FROM leads WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage lead_follow_ups from their leads"
    ON lead_follow_ups FOR ALL
    USING (lead_id IN (
        SELECT id FROM leads WHERE user_id = auth.uid()
    ));

-- Policies lead_scoring_history
CREATE POLICY "Users can view lead_scoring_history from their leads"
    ON lead_scoring_history FOR SELECT
    USING (lead_id IN (
        SELECT id FROM leads WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger: Atualizar updated_at
CREATE TRIGGER lead_interactions_updated_at BEFORE UPDATE ON lead_interactions
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER lead_follow_ups_updated_at BEFORE UPDATE ON lead_follow_ups
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

-- Function: Registrar mudança de score
CREATE OR REPLACE FUNCTION log_lead_score_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.ai_score IS DISTINCT FROM NEW.ai_score THEN
        INSERT INTO lead_scoring_history (
            lead_id,
            previous_score,
            new_score,
            score_change,
            change_reason
        ) VALUES (
            NEW.id,
            COALESCE(OLD.ai_score, 0),
            NEW.ai_score,
            NEW.ai_score - COALESCE(OLD.ai_score, 0),
            'Score updated by AI analysis'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_lead_score_changes
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_score_change();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Leads prioritários (score alto + deadline próximo)
CREATE OR REPLACE VIEW leads_priority AS
SELECT 
    l.*,
    COUNT(DISTINCT li.id) AS interaction_count,
    MAX(li.created_at) AS last_interaction_at,
    COUNT(DISTINCT lf.id) FILTER (WHERE lf.status = 'pending') AS pending_follow_ups,
    MIN(lf.scheduled_for) FILTER (WHERE lf.status = 'pending') AS next_follow_up_at
FROM leads l
LEFT JOIN lead_interactions li ON li.lead_id = l.id
LEFT JOIN lead_follow_ups lf ON lf.lead_id = l.id
GROUP BY l.id
ORDER BY 
    CASE l.ai_priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    l.ai_score DESC,
    l.ai_next_action_deadline NULLS LAST;

-- ============================================================================
-- FIM DA MIGRATION 007
-- ============================================================================
