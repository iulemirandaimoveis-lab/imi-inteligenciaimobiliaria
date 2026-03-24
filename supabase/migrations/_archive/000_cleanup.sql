-- ====================================================================
-- MIGRATION 000: CLEANUP - Preparação do banco
-- Executar ANTES de qualquer outra migration
-- ====================================================================

-- 1. Drop tabelas duplicadas/conflitantes se existirem
DROP TABLE IF EXISTS property_units CASCADE;
DROP TABLE IF EXISTS tracked_links CASCADE;
DROP TABLE IF EXISTS property_valuations CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS lead_interactions CASCADE;
DROP TABLE IF EXISTS property_events CASCADE;

-- 2. Drop functions conflitantes
DROP FUNCTION IF EXISTS update_property_units_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_short_code() CASCADE;
DROP FUNCTION IF EXISTS generate_valuation_reference() CASCADE;

-- 3. Verificar tabelas existentes que estão ok
-- (developments, development_units, leads, consultations, credit_requests, appraisal_requests)

-- 4. Garantir que as tabelas base tenham updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas existentes
DROP TRIGGER IF EXISTS update_developments_updated_at ON developments;
CREATE TRIGGER update_developments_updated_at
    BEFORE UPDATE ON developments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_requests_updated_at ON credit_requests;
CREATE TRIGGER update_credit_requests_updated_at
    BEFORE UPDATE ON credit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appraisal_requests_updated_at ON appraisal_requests;
CREATE TRIGGER update_appraisal_requests_updated_at
    BEFORE UPDATE ON appraisal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Confirmar estrutura atual
SELECT 
    'developments' as table_name, 
    COUNT(*) as record_count 
FROM developments
UNION ALL
SELECT 'development_units', COUNT(*) FROM development_units
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations
UNION ALL
SELECT 'credit_requests', COUNT(*) FROM credit_requests
UNION ALL
SELECT 'appraisal_requests', COUNT(*) FROM appraisal_requests;

-- Fim da limpeza
