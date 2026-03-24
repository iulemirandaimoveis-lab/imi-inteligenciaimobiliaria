-- ====================================================================
-- MIGRAÇÃO 002: Módulos complementares do Backoffice
-- Autor: IMI Atlantis System
-- Data: 2026-02-07
-- ====================================================================

-- 1. CONSTRUTORAS (Developers) - Entidade separada
-- ====================================================================
CREATE TABLE IF NOT EXISTS developers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    legal_name TEXT,  -- Razão Social
    cnpj TEXT UNIQUE,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    description TEXT,
    
    -- Endereço
    address TEXT,
    city TEXT,
    state TEXT,
    
    -- Redes sociais
    instagram TEXT,
    linkedin TEXT,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTEÚDO INSTITUCIONAL (Páginas editáveis)
-- ====================================================================
CREATE TABLE IF NOT EXISTS pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    
    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    
    -- Conteúdo
    content TEXT,  -- Markdown ou HTML
    excerpt TEXT,  -- Resumo curto
    
    -- Mídia
    featured_image TEXT,
    
    -- Publicação
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    
    -- Categorização
    page_type TEXT DEFAULT 'page' CHECK (page_type IN ('page', 'service', 'faq', 'policy')),
    
    -- Ordenação
    display_order INT DEFAULT 0,
    
    -- Auditoria
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. UNIDADES DO EMPREENDIMENTO (Detalhamento)
-- ====================================================================
-- A tabela development_units já existe, vamos garantir que está completa
-- Vamos adicionar campos extras se necessário via ALTER
DO $$
BEGIN
    -- Adicionar campo de planta baixa se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'development_units' AND column_name = 'floor_plan_url') THEN
        ALTER TABLE development_units ADD COLUMN floor_plan_url TEXT;
    END IF;
    
    -- Adicionar campo de destaque
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'development_units' AND column_name = 'is_highlighted') THEN
        ALTER TABLE development_units ADD COLUMN is_highlighted BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar campo de observações
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'development_units' AND column_name = 'notes') THEN
        ALTER TABLE development_units ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 4. VINCULAR DEVELOPMENTS À TABELA DE DEVELOPERS
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'developments' AND column_name = 'developer_id') THEN
        ALTER TABLE developments ADD COLUMN developer_id UUID REFERENCES developers(id);
    END IF;
END $$;

-- 5. USUÁRIOS DO BACKOFFICE (Perfis e permissões)
-- ====================================================================
-- A tabela users já existe no Prisma, mas vamos garantir consistência
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'VIEWER' CHECK (role IN ('ADMIN', 'EDITOR', 'VIEWER')),
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- 6. LOG DE ATIVIDADES (Auditoria)
-- ====================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type TEXT,      -- development, lead, page, etc.
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ====================================================================
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total para usuários autenticados
CREATE POLICY "auth_all_developers" ON developers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_pages" ON pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_activity" ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir leitura pública de páginas publicadas
CREATE POLICY "public_read_pages" ON pages FOR SELECT TO anon USING (status = 'published');

-- ====================================================================
-- ÍNDICES DE PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);
CREATE INDEX IF NOT EXISTS idx_developers_active ON developers(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_developments_developer ON developments(developer_id);

-- ====================================================================
-- DADOS INICIAIS DE EXEMPLO
-- ====================================================================

-- Construtoras de exemplo (João Pessoa e região)
INSERT INTO developers (slug, name, legal_name, city, state, is_active, display_order) VALUES
    ('setai-grupo-gp', 'Setai Grupo GP', 'Setai Empreendimentos e Participações Ltda', 'João Pessoa', 'PB', true, 1),
    ('alliance', 'Alliance Incorporadora', 'Alliance Desenvolvimento Imobiliário S.A.', 'João Pessoa', 'PB', true, 2),
    ('rio-ave', 'Rio Ave Brasil', 'Rio Ave Investimentos Ltda', 'Recife', 'PE', true, 3),
    ('moura-dubeux', 'Moura Dubeux', 'Moura Dubeux Engenharia S.A.', 'Recife', 'PE', true, 4),
    ('cyrela', 'Cyrela Brazil Realty', 'Cyrela Brazil Realty S.A. Empreendimentos', 'São Paulo', 'SP', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Páginas institucionais iniciais
INSERT INTO pages (slug, title, page_type, status, content, excerpt) VALUES
    ('sobre', 'Sobre a IMI', 'page', 'published', '# Sobre a IMI\n\nA IMI – Inteligência Imobiliária é uma empresa especializada em avaliações técnicas, perícias e consultoria estratégica no mercado imobiliário.', 'Conheça a história e os valores da IMI'),
    ('servicos-avaliacoes', 'Avaliações Imobiliárias', 'service', 'published', '# Avaliações Técnicas\n\nServiços de avaliação conforme NBR 14653 para fins judiciais, bancários e patrimoniais.', 'Laudos técnicos com rigor normativo'),
    ('politica-privacidade', 'Política de Privacidade', 'policy', 'published', '# Política de Privacidade\n\nEsta política descreve como coletamos e tratamos seus dados pessoais.', 'Como tratamos seus dados'),
    ('termos-uso', 'Termos de Uso', 'policy', 'published', '# Termos de Uso\n\nAo utilizar nosso site, você concorda com estes termos.', 'Condições de uso do site')
ON CONFLICT (slug) DO NOTHING;

