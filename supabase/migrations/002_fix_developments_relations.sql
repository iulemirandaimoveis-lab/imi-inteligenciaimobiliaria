-- ====================================================================
-- MIGRATION 002_FIX: Vincular Developments com Developers
-- ====================================================================

-- Adicionar coluna developer_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developments' 
        AND column_name = 'developer_id'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN developer_id UUID REFERENCES developers(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_developments_developer ON developments(developer_id);
    END IF;
END $$;

-- Adicionar campos extras em developments
DO $$
BEGIN
    -- Tipo de empreendimento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developments' 
        AND column_name = 'property_type'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN property_type TEXT DEFAULT 'apartment' 
        CHECK (property_type IN ('apartment', 'house', 'commercial', 'land', 'mixed'));
    END IF;
    
    -- Destaque
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developments' 
        AND column_name = 'featured'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;
    
    -- Contadores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developments' 
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN views_count INTEGER DEFAULT 0,
        ADD COLUMN leads_count INTEGER DEFAULT 0;
    END IF;
    
    -- URL tour virtual
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'developments' 
        AND column_name = 'virtual_tour_url'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN virtual_tour_url TEXT;
    END IF;
END $$;

COMMENT ON COLUMN developments.developer_id IS 'FK para tabela developers';
COMMENT ON COLUMN developments.property_type IS 'Tipo: apartment, house, commercial, land, mixed';
COMMENT ON COLUMN developments.featured IS 'Empreendimento em destaque';
COMMENT ON COLUMN developments.views_count IS 'Contador de visualizações';
COMMENT ON COLUMN developments.leads_count IS 'Contador de leads gerados';
