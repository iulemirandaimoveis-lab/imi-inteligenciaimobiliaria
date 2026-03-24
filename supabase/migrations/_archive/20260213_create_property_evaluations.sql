-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS property_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Dados do imóvel
    property_address TEXT NOT NULL,
    property_type TEXT NOT NULL, -- apartment, house, commercial, land
    property_area DECIMAL(10,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    city TEXT,
    state TEXT,
    
    -- Cliente
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    
    -- Avaliação
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'draft', 'completed', 'archived')),
    draft_content TEXT, -- Laudo gerado pela IA
    final_content TEXT, -- Laudo revisado
    
    -- Documentos
    documents JSONB DEFAULT '[]'::jsonb, -- Array de { url, name, type }
    
    -- Valor estimado
    estimated_value_min DECIMAL(15,2),
    estimated_value_max DECIMAL(15,2),
    
    -- Metadata
    generated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON property_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created ON property_evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_client ON property_evaluations(client_email);

-- RLS
ALTER TABLE property_evaluations ENABLE ROW LEVEL SECURITY;

-- Admins podem tudo
CREATE POLICY "admins_all_evaluations" ON property_evaluations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evaluations_updated_at ON property_evaluations;
CREATE TRIGGER trigger_update_evaluations_updated_at
    BEFORE UPDATE ON property_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluations_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE property_evaluations;
