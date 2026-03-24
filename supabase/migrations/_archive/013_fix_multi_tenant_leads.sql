-- ============================================================================
-- Migration 013: Fix Multi-Tenancy on Legacy Tables
-- Descrição: Adição de tenant_id a tabelas criadas no início do projeto
-- Data: 2026-02-08
-- ============================================================================

-- 1. Adicionar tenant_id às tabelas legadas
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE credit_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE appraisal_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_developments_tenant ON developments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consultations_tenant ON consultations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_tenant ON credit_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_requests_tenant ON appraisal_requests(tenant_id);

-- 3. Mock data: Vincular dados órfãos ao primeiro tenant (opcional, apenas para ambiente de dev)
DO $$
DECLARE
    first_tenant_id UUID;
BEGIN
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    IF first_tenant_id IS NOT NULL THEN
        UPDATE leads SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
        UPDATE developments SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
        UPDATE consultations SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
        UPDATE credit_requests SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
        UPDATE appraisal_requests SET tenant_id = first_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- 4. RLS para leads (atualizar)
DROP POLICY IF EXISTS "auth_all_leads" ON leads;
CREATE POLICY "Users can manage leads from their tenants"
    ON leads FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Repetir para outras tabelas conforme necessário
