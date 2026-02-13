-- ====================================================================
-- MIGRATION 005_FIX: Sistema Completo de Avaliações (NBR 14653)
-- ====================================================================

CREATE TABLE IF NOT EXISTS property_valuations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    
    -- Tipo de imóvel
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'land', 'industrial', 'rural')),
    
    -- Localização
    address TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PE',
    cep TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    
    -- Características
    private_area NUMERIC(10,2) NOT NULL,
    total_area NUMERIC(10,2) NOT NULL,
    bedrooms INTEGER,
    suites INTEGER,
    bathrooms INTEGER,
    parking_spaces INTEGER,
    age_years INTEGER,
    condition TEXT CHECK (condition IN ('new', 'excellent', 'good', 'regular', 'poor', 'needs_renovation')),
    
    -- Metodologia NBR 14653
    methodology TEXT NOT NULL CHECK (methodology IN ('comparison', 'income', 'cost', 'mixed')),
    nbr_precision TEXT CHECK (nbr_precision IN ('I', 'II', 'III')),
    
    -- Finalidade
    purpose TEXT NOT NULL, -- Ex: 'financing', 'sale', 'judicial', 'insurance'
    
    -- Cliente
    client_name TEXT NOT NULL,
    client_cpf_cnpj TEXT,
    client_email TEXT,
    client_phone TEXT,
    
    -- Status e Datas
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'delivered', 'archived')),
    valuation_date DATE,
    inspection_date DATE,
    delivery_date DATE,
    
    -- Valores
    estimated_value NUMERIC(12,2),
    minimum_value NUMERIC(12,2),
    maximum_value NUMERIC(12,2),
    unit_value NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE WHEN private_area > 0 
        THEN estimated_value / private_area 
        ELSE 0 END
    ) STORED,
    
    -- Comparáveis e Ajustes
    comparable_properties JSONB DEFAULT '[]'::jsonb,
    adjustments JSONB DEFAULT '[]'::jsonb,
    
    -- Mídia
    photos JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Observações
    notes TEXT,
    technical_report_url TEXT,
    
    -- Responsável
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_valuations" ON property_valuations;
CREATE POLICY "auth_all_valuations" 
    ON property_valuations FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Trigger
DROP TRIGGER IF EXISTS update_valuations_updated_at ON property_valuations;
CREATE TRIGGER update_valuations_updated_at
    BEFORE UPDATE ON property_valuations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_valuations_reference ON property_valuations(reference_number);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON property_valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_type ON property_valuations(property_type);
CREATE INDEX IF NOT EXISTS idx_valuations_city ON property_valuations(city);
CREATE INDEX IF NOT EXISTS idx_valuations_assigned ON property_valuations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON property_valuations(valuation_date DESC);

-- Função para gerar número de referência automático
CREATE OR REPLACE FUNCTION generate_valuation_reference()
RETURNS TEXT AS $$
DECLARE
    year TEXT := TO_CHAR(NOW(), 'YYYY');
    count INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO count 
    FROM property_valuations 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    RETURN 'AV-' || year || '-' || LPAD(count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar referência automática
CREATE OR REPLACE FUNCTION set_valuation_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := generate_valuation_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_valuation_reference ON property_valuations;
CREATE TRIGGER trigger_set_valuation_reference
    BEFORE INSERT ON property_valuations
    FOR EACH ROW
    EXECUTE FUNCTION set_valuation_reference();

COMMENT ON TABLE property_valuations IS 'Sistema completo de avaliações imobiliárias NBR 14653';
