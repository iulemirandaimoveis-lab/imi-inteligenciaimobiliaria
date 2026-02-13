-- ============================================================================
-- MIGRATION DE CORREÇÃO FINAL - BACKOFFICE COMPLETO
-- Cole este script no SQL Editor do Supabase Dashboard e clique em RUN.
-- ============================================================================

-- 1. CORREÇÃO DA TABELA LEADS (Colunas de IA e Tags)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_priority TEXT DEFAULT 'medium'; -- critical, high, medium, low
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualification JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action_deadline TIMESTAMPTZ;

-- 2. HABILITAÇÃO DE UPLOAD DE IMAGENS (Storage Policies para bucket 'developments')
-- Permite leitura pública (para o site exibir imagens)
DROP POLICY IF EXISTS "Public Access Developments" ON storage.objects;
CREATE POLICY "Public Access Developments"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'developments' );

-- Permite upload/edição apenas para usuários logados (Backoffice)
DROP POLICY IF EXISTS "Auth Insert Developments" ON storage.objects;
CREATE POLICY "Auth Insert Developments"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'developments' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update Developments" ON storage.objects;
CREATE POLICY "Auth Update Developments"
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'developments' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Delete Developments" ON storage.objects;
CREATE POLICY "Auth Delete Developments"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'developments' AND auth.role() = 'authenticated' );

-- Repete o mesmo para bucket 'content' (Blog Posts)
DROP POLICY IF EXISTS "Public Access Content" ON storage.objects;
CREATE POLICY "Public Access Content"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'content' );

DROP POLICY IF EXISTS "Auth Manage Content" ON storage.objects;
CREATE POLICY "Auth Manage Content"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'content' AND auth.role() = 'authenticated' );

-- 3. CRIAÇÃO DA TABELA DE RELATÓRIOS EXECUTIVOS (Com IA)
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Referência ao tenant
    report_type TEXT NOT NULL, -- weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary TEXT,
    metrics JSONB NOT NULL DEFAULT '{}',
    insights JSONB,
    recommendations JSONB,
    cost_breakdown JSONB,
    generated_by UUID,
    ai_request_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS básico para Reports
ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON executive_reports;
CREATE POLICY "Enable read/write for authenticated users" ON executive_reports 
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. VIEW CONSOLIDADA (Opcional, mas útil para debug)
DROP VIEW IF EXISTS analytics_consolidated;
CREATE OR REPLACE VIEW analytics_consolidated AS
SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    (SELECT COUNT(*) FROM leads l WHERE l.tenant_id = t.id) AS total_leads,
    (SELECT COUNT(*) FROM developments d WHERE d.tenant_id = t.id) AS total_developments,
    (SELECT COUNT(*) FROM content_publications cp WHERE cp.tenant_id = t.id AND cp.status = 'published') AS published_posts
FROM tenants t;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
