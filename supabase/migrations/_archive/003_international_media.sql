-- ====================================================================
-- MIGRAÇÃO 003: Internacionalização e Mídia Rica
-- Autor: IMI Atlantis System
-- Data: 2026-02-08
-- Descrição: Adiciona suporte a países, vídeos e tours 360°
-- ====================================================================

-- 1. ADICIONAR CAMPO COUNTRY AO DEVELOPMENTS
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developments' AND column_name = 'country') THEN
        ALTER TABLE developments ADD COLUMN country TEXT DEFAULT 'Brasil';
    END IF;
END $$;

-- 2. ATUALIZAR REGION PARA ACEITAR 'internacional'
-- ====================================================================
-- Remover constraint antiga se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'developments_region_check' 
               AND table_name = 'developments') THEN
        ALTER TABLE developments DROP CONSTRAINT developments_region_check;
    END IF;
END $$;

-- Adicionar nova constraint com 'internacional'
ALTER TABLE developments ADD CONSTRAINT developments_region_check 
    CHECK (region IN ('paraiba', 'pernambuco', 'sao-paulo', 'internacional'));

-- 3. EXPANDIR SUPORTE A MÍDIA RICA
-- ====================================================================
-- O campo images já é JSONB e suporta:
-- {
--   "main": "url",
--   "gallery": ["url1", "url2"],
--   "videos": ["url1", "url2"],
--   "floorPlans": ["url1"],
--   "virtualTour": "url_tour_360"
-- }

-- Adicionar campo dedicado para tour virtual 360° (opcional, além do JSONB)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developments' AND column_name = 'virtual_tour_url') THEN
        ALTER TABLE developments ADD COLUMN virtual_tour_url TEXT;
    END IF;
END $$;

-- 4. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_developments_country ON developments(country);
CREATE INDEX IF NOT EXISTS idx_developments_region ON developments(region);

-- 5. ATUALIZAR DEVELOPMENTS EXISTENTES
-- ====================================================================
-- Garantir que todos os developments brasileiros tenham country = 'Brasil'
UPDATE developments 
SET country = 'Brasil' 
WHERE region IN ('paraiba', 'pernambuco', 'sao-paulo') 
  AND (country IS NULL OR country = '');

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ====================================================================
COMMENT ON COLUMN developments.country IS 'País do empreendimento (Brasil, Emirados Árabes Unidos, Estados Unidos, etc)';
COMMENT ON COLUMN developments.region IS 'Região para filtros: paraiba, pernambuco, sao-paulo ou internacional';
COMMENT ON COLUMN developments.virtual_tour_url IS 'URL do tour virtual 360° (Matterport, Kuula, etc)';
COMMENT ON COLUMN developments.images IS 'JSONB com main, gallery, videos, floorPlans e virtualTour';

-- ====================================================================
-- FIM DA MIGRAÇÃO 003
-- ====================================================================
