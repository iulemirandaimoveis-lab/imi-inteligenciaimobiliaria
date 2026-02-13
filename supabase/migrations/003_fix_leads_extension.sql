-- ====================================================================
-- MIGRATION 003_FIX: Estender sistema de Leads
-- ====================================================================

-- Adicionar campos em leads
DO $$
BEGIN
    -- Score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'score'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100);
    END IF;
    
    -- Tags
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Usuário atribuído
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Última interação
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'last_interaction_at'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN last_interaction_at TIMESTAMPTZ;
    END IF;
    
    -- Origem detalhada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'utm_source'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN utm_source TEXT,
        ADD COLUMN utm_medium TEXT,
        ADD COLUMN utm_campaign TEXT,
        ADD COLUMN utm_content TEXT,
        ADD COLUMN utm_term TEXT;
    END IF;
END $$;

-- Criar tabela de interações
CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'whatsapp', 'visit', 'meeting', 'note', 'task')),
    title TEXT,
    description TEXT,
    outcome TEXT,
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_interactions" 
    ON lead_interactions FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON lead_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON lead_interactions(created_at DESC);

-- Trigger para atualizar last_interaction_at
CREATE OR REPLACE FUNCTION update_lead_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET last_interaction_at = NOW() 
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_interaction ON lead_interactions;
CREATE TRIGGER trigger_update_lead_interaction
    AFTER INSERT ON lead_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_interaction();

COMMENT ON TABLE lead_interactions IS 'Histórico de interações com leads';
