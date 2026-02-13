-- ====================================================================
-- MIGRATION 001_FIX: Tabela Developers (Construtoras)
-- ====================================================================

CREATE TABLE IF NOT EXISTS developers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    legal_name TEXT,
    cnpj TEXT UNIQUE,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    description TEXT,
    
    -- Endereço
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'PE',
    
    -- Redes sociais
    instagram TEXT,
    linkedin TEXT,
    facebook TEXT,
    
    -- Métricas
    rating NUMERIC(3,2),
    total_developments INTEGER DEFAULT 0,
    total_units_delivered INTEGER DEFAULT 0,
    years_in_market INTEGER,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_developers" ON developers;
CREATE POLICY "auth_all_developers" 
    ON developers FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_developers" ON developers;
CREATE POLICY "public_read_developers" 
    ON developers FOR SELECT 
    TO anon 
    USING (is_active = true);

-- Trigger
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
    BEFORE UPDATE ON developers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);
CREATE INDEX IF NOT EXISTS idx_developers_active ON developers(is_active);

COMMENT ON TABLE developers IS 'Construtoras e incorporadoras';
