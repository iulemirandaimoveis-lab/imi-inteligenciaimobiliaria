-- Criar tabela lead_interactions se não existir
CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'visit', 'meeting', 'note')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    outcome TEXT,
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON lead_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_next_action ON lead_interactions(next_action_date) WHERE next_action_date IS NOT NULL;

-- RLS
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Admins podem tudo (policy genérica para authenticated por enquanto para garantir acesso)
CREATE POLICY "authenticated_all_interactions" ON lead_interactions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lead_interactions;

-- Função para atualizar last_interaction_at no lead
CREATE OR REPLACE FUNCTION update_lead_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET last_interaction_at = NEW.created_at
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_interaction ON lead_interactions;
CREATE TRIGGER trigger_update_lead_interaction
    AFTER INSERT ON lead_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_interaction();

-- Garantir que leads tem campo last_interaction_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_interaction_at') THEN
        ALTER TABLE leads ADD COLUMN last_interaction_at TIMESTAMPTZ;
    END IF;
END $$;

-- Adicionar índice
CREATE INDEX IF NOT EXISTS idx_leads_last_interaction ON leads(last_interaction_at DESC);
