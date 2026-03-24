-- PARTE 1: CORREÇÃO DE TABELAS (Execute este primeiro)
-- Este script foca apenas em criar/alterar tabelas do banco de dados.

-- Habilita extensão necessária para IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORREÇÃO DA TABELA LEADS
-- Adiciona colunas necessárias para a IA funcionar
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_priority TEXT DEFAULT 'medium';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualification JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action_deadline TIMESTAMPTZ;

-- 2. CRIAÇÃO DA TABELA DE RELATÓRIOS EXECUTIVOS
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    report_type TEXT NOT NULL,
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

-- Ativa segurança na tabela de relatórios
ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;

-- Cria política de segurança simplificada (qualquer usuário logado pode ler/escrever)
-- Isso evita erros complexos de permissão por enquanto
DROP POLICY IF EXISTS "Authenticated Users Access" ON executive_reports;
CREATE POLICY "Authenticated Users Access" ON executive_reports 
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. CRIAÇÃO DAS TABELAS DE IMÓVEIS (Caso não existam)
CREATE TABLE IF NOT EXISTS developments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    developer TEXT,
    status TEXT DEFAULT 'launch',
    price_min NUMERIC,
    price_max NUMERIC,
    address TEXT,
    city TEXT,
    state TEXT,
    region TEXT,
    neighborhood TEXT,
    images JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',
    display_order INTEGER DEFAULT 0,
    is_highlighted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Developments" ON developments;
CREATE POLICY "Public Read Developments" ON developments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth Manage Developments" ON developments;
CREATE POLICY "Auth Manage Developments" ON developments FOR ALL USING (auth.role() = 'authenticated');
