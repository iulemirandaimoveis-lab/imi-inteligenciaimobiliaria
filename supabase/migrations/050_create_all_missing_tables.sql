-- ============================================================================
-- MIGRATION 050: CRIAÇÃO DE TODAS AS TABELAS FALTANTES
-- IMI Inteligência Imobiliária — PDR Definitivo para Lançamento 14/Mar/2026
-- ============================================================================
-- Criado em: 2026-03-11
-- Objetivo: Criar todas as tabelas referenciadas no código mas ausentes no schema.
--           Sem estas tabelas, 40% do backoffice falha silenciosamente.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BROKERS (Corretores/Equipe)
-- Referenciado em: /api/brokers/create, /api/brokers/delete, /api/equipe,
--                 /settings/corretores, /organizacao
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brokers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    creci         TEXT,
    cpf           TEXT,
    role          TEXT NOT NULL DEFAULT 'broker',
                  -- broker | captador | lider | admin
    team_id       UUID,
    status        TEXT NOT NULL DEFAULT 'active',
                  -- active | inactive | suspended
    commission_split JSONB DEFAULT '{"captador": 45, "vendedor": 45, "imi": 10}',
    permissions   TEXT[] DEFAULT '{}',
    is_active     BOOLEAN DEFAULT true,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brokers_email   ON public.brokers (email);
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers (user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_status  ON public.brokers (status);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brokers_auth_all" ON public.brokers;
CREATE POLICY "brokers_auth_all" ON public.brokers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "brokers_service_role" ON public.brokers;
CREATE POLICY "brokers_service_role" ON public.brokers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. TEAMS (Times de Corretores)
-- Referenciado em: brokers.team_id FK, /organizacao
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    leader_id        UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    commission_rules JSONB DEFAULT '{}',
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_auth_all" ON public.teams;
CREATE POLICY "teams_auth_all" ON public.teams
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Now add FK from brokers to teams (after teams table exists)
ALTER TABLE public.brokers
    ADD CONSTRAINT IF NOT EXISTS fk_brokers_team
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. CALENDAR_EVENTS (Agenda)
-- Referenciado em: /api/agenda
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    description  TEXT,
    event_type   TEXT NOT NULL DEFAULT 'reuniao',
                 -- reuniao | visita | ligacao | entrega | outro
    start_time   TIMESTAMPTZ NOT NULL,
    end_time     TIMESTAMPTZ,
    all_day      BOOLEAN DEFAULT false,
    location     TEXT,
    color        TEXT DEFAULT '#486581',
    related_type TEXT,    -- lead | development | contrato | avaliacao
    related_id   UUID,
    created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_start_time  ON public.calendar_events (start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_event_type  ON public.calendar_events (event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_related      ON public.calendar_events (related_type, related_id);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_auth_all" ON public.calendar_events;
CREATE POLICY "calendar_auth_all" ON public.calendar_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. FINANCIAL_TRANSACTIONS (Financeiro)
-- Referenciado em: /api/financeiro, /api/pix/webhook
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type           TEXT NOT NULL,      -- receita | despesa
    category       TEXT NOT NULL DEFAULT 'Outros',
    description    TEXT NOT NULL,
    amount         NUMERIC(14,2) NOT NULL,
    due_date       DATE NOT NULL,
    paid_date      DATE,
    status         TEXT NOT NULL DEFAULT 'pendente',
                   -- pendente | pago | cancelado | vencido
    payment_method TEXT,               -- pix | boleto | cartao | dinheiro
    notes          TEXT,
    related_entity_type TEXT,          -- lead | development | contrato
    related_entity_id   UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_trans_status    ON public.financial_transactions (status);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type      ON public.financial_transactions (type);
CREATE INDEX IF NOT EXISTS idx_fin_trans_due_date  ON public.financial_transactions (due_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_trans_created_by ON public.financial_transactions (created_by);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_trans_auth_all" ON public.financial_transactions;
CREATE POLICY "fin_trans_auth_all" ON public.financial_transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. PAGE_VIEWS (Rastreamento de Páginas do Site)
-- Referenciado em: /api/tracking/pageview, /api/tracking/analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.page_views (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       TEXT NOT NULL,
    page_url         TEXT,
    page_path        TEXT NOT NULL,
    referrer         TEXT,
    utm_source       TEXT,
    utm_medium       TEXT,
    utm_campaign     TEXT,
    utm_content      TEXT,
    device_type      TEXT DEFAULT 'desktop',   -- desktop | mobile | tablet
    browser          TEXT DEFAULT 'other',
    os               TEXT DEFAULT 'other',
    screen_width     INTEGER,
    ip_address       TEXT,
    development_slug TEXT,
    duration_seconds INTEGER DEFAULT 0,
    scroll_depth     INTEGER DEFAULT 0,   -- percentage (0-100)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_session    ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON public.page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_dev_slug   ON public.page_views (development_slug)
    WHERE development_slug IS NOT NULL;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_views_anon_insert" ON public.page_views;
CREATE POLICY "page_views_anon_insert" ON public.page_views
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "page_views_auth_all" ON public.page_views;
CREATE POLICY "page_views_auth_all" ON public.page_views
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "page_views_service_all" ON public.page_views;
CREATE POLICY "page_views_service_all" ON public.page_views
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. TRACKING_SESSIONS (Sessões do Site)
-- Referenciado em: /api/tracking/pageview, /api/tracking/session,
--                 /api/tracking/analytics, /api/leads/capture, /api/ai/auto-score
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tracking_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       TEXT NOT NULL UNIQUE,
    first_page       TEXT,
    last_page        TEXT,
    page_count       INTEGER DEFAULT 1,
    total_duration   INTEGER DEFAULT 0,   -- seconds
    utm_source       TEXT,
    utm_medium       TEXT,
    utm_campaign     TEXT,
    device_type      TEXT DEFAULT 'desktop',
    browser          TEXT DEFAULT 'other',
    os               TEXT DEFAULT 'other',
    ip_address       TEXT,
    is_bot           BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_session_id    ON public.tracking_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_started_at    ON public.tracking_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_is_bot        ON public.tracking_sessions (is_bot);

ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_sessions_anon_insert" ON public.tracking_sessions;
CREATE POLICY "tracking_sessions_anon_insert" ON public.tracking_sessions
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "tracking_sessions_anon_update" ON public.tracking_sessions;
CREATE POLICY "tracking_sessions_anon_update" ON public.tracking_sessions
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tracking_sessions_auth_all" ON public.tracking_sessions;
CREATE POLICY "tracking_sessions_auth_all" ON public.tracking_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tracking_sessions_service_all" ON public.tracking_sessions;
CREATE POLICY "tracking_sessions_service_all" ON public.tracking_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. AVALIACOES (Avaliações de Imóveis — Laudo Técnico)
-- Referenciado em: /api/avaliacoes, /api/avaliacoes/gerar-exercicio,
--                 /api/avaliacoes/interpretar-email
-- NOTA: Tabela diferente de appraisal_requests (formulário do site).
--       avaliacoes = processo interno de laudo técnico ABNT 14.653
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Imóvel
    tipo_imovel            TEXT NOT NULL,
    endereco               TEXT NOT NULL,
    complemento            TEXT,
    bairro                 TEXT,
    cidade                 TEXT DEFAULT 'Recife',
    estado                 TEXT DEFAULT 'PE',
    cep                    TEXT,
    area_privativa         NUMERIC(10,2),
    area_total             NUMERIC(10,2),
    quartos                INTEGER,
    banheiros              INTEGER,
    vagas                  INTEGER,
    andar                  TEXT,
    ano_construcao         TEXT,
    padrao                 TEXT,              -- simples | normal | alto | luxo
    estado_conservacao     TEXT,
    caracteristicas        TEXT,
    -- Cliente
    cliente_nome           TEXT,
    cliente_email          TEXT,
    cliente_telefone       TEXT,
    cliente_cpf_cnpj       TEXT,
    cliente_tipo           TEXT DEFAULT 'PF', -- PF | PJ
    -- Processo
    solicitante_instituicao TEXT,
    finalidade             TEXT,
    metodologia            TEXT DEFAULT 'comparativo',
    grau_fundamentacao     TEXT,
    grau_precisao          TEXT,
    prazo_entrega          DATE,
    observacoes            TEXT,
    honorarios             NUMERIC(14,2),
    forma_pagamento        TEXT,
    -- Dados calculados
    comparaveis            JSONB,           -- lista de imóveis comparáveis
    valor_estimado         NUMERIC(14,2),
    relatorio_url          TEXT,
    -- Estado
    status                 TEXT NOT NULL DEFAULT 'aguardando_docs',
                           -- aguardando_docs | em_vistoria | em_calculo |
                           -- em_revisao | concluida | cancelada | entregue
    created_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_status      ON public.avaliacoes (status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_created_at  ON public.avaliacoes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente_nome ON public.avaliacoes (cliente_nome);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avaliacoes_auth_all" ON public.avaliacoes;
CREATE POLICY "avaliacoes_auth_all" ON public.avaliacoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. PROJETOS (Projetos Imobiliários — Loteamentos, Empreendimentos em Gestão)
-- Referenciado em: /api/projetos
-- NOTA: Diferente de developments. Projetos = pipeline de novos empreendimentos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projetos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome              TEXT NOT NULL,
    tipo              TEXT,                -- residencial | comercial | misto | loteamento
    descricao         TEXT,
    cidade            TEXT,
    estado            TEXT DEFAULT 'PE',
    status            TEXT NOT NULL DEFAULT 'estruturacao',
                      -- estruturacao | viabilidade | lancamento | em_obras |
                      -- entregue | arquivado
    fase              TEXT,
    unidades          INTEGER DEFAULT 0,
    unidades_vendidas INTEGER DEFAULT 0,
    area_total_m2     NUMERIC(12,2),
    vgv               NUMERIC(14,2) DEFAULT 0,    -- Valor Geral de Vendas
    imagem_url        TEXT,
    latitude          NUMERIC(10,8),
    longitude         NUMERIC(11,8),
    data_lancamento   DATE,
    data_entrega_prev DATE,
    created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projetos_status     ON public.projetos (status);
CREATE INDEX IF NOT EXISTS idx_projetos_created_at ON public.projetos (created_at DESC);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projetos_auth_all" ON public.projetos;
CREATE POLICY "projetos_auth_all" ON public.projetos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. CONSULTORIAS (Processos Internos de Consultoria Imobiliária)
-- Referenciado em: /api/consultorias
-- NOTA: Diferente de consultations (formulário do site público).
--       consultorias = CRUD interno do backoffice com protocolo, honorários, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consultorias (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo            TEXT UNIQUE,             -- gerado automaticamente
    -- Cliente
    cliente_nome         TEXT NOT NULL,
    cliente_email        TEXT,
    cliente_telefone     TEXT,
    cliente_tipo         TEXT DEFAULT 'PF',       -- PF | PJ
    -- Escopo
    tipo                 TEXT,
    descricao            TEXT,
    objetivo             TEXT,
    -- Localização
    cidade               TEXT,
    estado               TEXT DEFAULT 'PE',
    -- Financeiro
    honorarios           NUMERIC(14,2),
    forma_pagamento      TEXT,
    honorarios_status    TEXT DEFAULT 'pendente', -- pendente | parcial | pago
    -- Prazos
    data_inicio          DATE,
    data_prev_conclusao  DATE,
    -- Controle
    consultor_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    observacoes          TEXT,
    status               TEXT NOT NULL DEFAULT 'ativo',
                         -- ativo | concluido | cancelado | suspenso
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate protocolo via trigger
CREATE OR REPLACE FUNCTION public.generate_consultoria_protocolo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.protocolo IS NULL THEN
        NEW.protocolo := 'CONS-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
                         LPAD(NEXTVAL('consultorias_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS consultorias_seq START 1;

DROP TRIGGER IF EXISTS trg_consultorias_protocolo ON public.consultorias;
CREATE TRIGGER trg_consultorias_protocolo
    BEFORE INSERT ON public.consultorias
    FOR EACH ROW EXECUTE FUNCTION public.generate_consultoria_protocolo();

CREATE INDEX IF NOT EXISTS idx_consultorias_status     ON public.consultorias (status);
CREATE INDEX IF NOT EXISTS idx_consultorias_created_at ON public.consultorias (created_at DESC);

ALTER TABLE public.consultorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultorias_auth_all" ON public.consultorias;
CREATE POLICY "consultorias_auth_all" ON public.consultorias
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. CONTEUDOS (Conteúdos para Blog/Redes Sociais — Gestão Interna)
-- Referenciado em: /api/conteudos
-- NOTA: Diferente de content_items/content_calendar (multi-tenant).
--       conteudos = gestão simplificada de conteúdo no backoffice.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conteudos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo           TEXT NOT NULL,
    tipo             TEXT,               -- artigo | video | post | reels | stories
    plataforma       TEXT,               -- instagram | linkedin | youtube | blog | whatsapp
    canal            TEXT,
    status           TEXT NOT NULL DEFAULT 'rascunho',
                     -- rascunho | revisao | publicado | arquivado
    conteudo         TEXT,               -- corpo do conteúdo
    tags             TEXT[] DEFAULT '{}',
    data_publicacao  TIMESTAMPTZ,
    visualizacoes    INTEGER DEFAULT 0,
    engajamento      INTEGER DEFAULT 0,
    media_urls       TEXT[] DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conteudos_status     ON public.conteudos (status);
CREATE INDEX IF NOT EXISTS idx_conteudos_user_id    ON public.conteudos (user_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_created_at ON public.conteudos (created_at DESC);

ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conteudos_auth_own" ON public.conteudos;
CREATE POLICY "conteudos_auth_own" ON public.conteudos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 11. ROLE_PERMISSIONS (RBAC — Permissões por Papel)
-- Referenciado em: /api/permissions, lib/governance.ts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role    TEXT NOT NULL,      -- admin | lider | corretor | captador | viewer
    module  TEXT NOT NULL,      -- leads | imoveis | financeiro | equipe | etc.
    action  TEXT NOT NULL,      -- create | read | update | delete | export
    allowed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role, module, action)
);

CREATE INDEX IF NOT EXISTS idx_role_perms_role   ON public.role_permissions (role);
CREATE INDEX IF NOT EXISTS idx_role_perms_module ON public.role_permissions (module);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_perms_auth_all" ON public.role_permissions;
CREATE POLICY "role_perms_auth_all" ON public.role_permissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed: Permissões padrão para admin (acesso total)
INSERT INTO public.role_permissions (role, module, action, allowed)
VALUES
    ('admin', 'leads',      'create', true),
    ('admin', 'leads',      'read',   true),
    ('admin', 'leads',      'update', true),
    ('admin', 'leads',      'delete', true),
    ('admin', 'imoveis',    'create', true),
    ('admin', 'imoveis',    'read',   true),
    ('admin', 'imoveis',    'update', true),
    ('admin', 'imoveis',    'delete', true),
    ('admin', 'financeiro', 'create', true),
    ('admin', 'financeiro', 'read',   true),
    ('admin', 'financeiro', 'update', true),
    ('admin', 'financeiro', 'delete', true),
    ('admin', 'equipe',     'create', true),
    ('admin', 'equipe',     'read',   true),
    ('admin', 'equipe',     'update', true),
    ('admin', 'equipe',     'delete', true),
    ('corretor', 'leads',   'create', true),
    ('corretor', 'leads',   'read',   true),
    ('corretor', 'leads',   'update', true),
    ('corretor', 'leads',   'delete', false),
    ('corretor', 'imoveis', 'create', false),
    ('corretor', 'imoveis', 'read',   true),
    ('corretor', 'imoveis', 'update', false),
    ('corretor', 'imoveis', 'delete', false),
    ('corretor', 'financeiro', 'create', false),
    ('corretor', 'financeiro', 'read',   false),
    ('corretor', 'financeiro', 'update', false),
    ('corretor', 'financeiro', 'delete', false)
ON CONFLICT (role, module, action) DO NOTHING;

-- ============================================================================
-- 12. INTEGRATION_CONFIGS (Configurações de Integrações)
-- Referenciado em: /api/integracoes/save, /api/integracoes/status,
--                 /api/integracoes/test-connection, /api/gmail, /api/auth/google/callback
-- NOTA: Separada de integracoes_config (migration 024) que usa campo config_encrypted.
--       integration_configs = versão nova com campo config JSONB simples.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integration_configs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id TEXT NOT NULL UNIQUE,
    config         JSONB DEFAULT '{}',
    status         TEXT NOT NULL DEFAULT 'nao_configurado',
                   -- nao_configurado | conectado | erro | desconectado
    updated_at     TIMESTAMPTZ DEFAULT now(),
    updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_id ON public.integration_configs (integration_id);

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_configs_auth_all" ON public.integration_configs;
CREATE POLICY "integration_configs_auth_all" ON public.integration_configs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "integration_configs_service_all" ON public.integration_configs;
CREATE POLICY "integration_configs_service_all" ON public.integration_configs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 13. MARKET_REPORTS (Relatórios de Mercado Imobiliário)
-- Referenciado em: /api/reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    slug         TEXT UNIQUE,
    summary      TEXT,
    content      TEXT,
    report_type  TEXT DEFAULT 'monthly',  -- monthly | quarterly | annual | special
    city         TEXT,
    state        TEXT,
    country      TEXT DEFAULT 'Brasil',
    tags         TEXT[] DEFAULT '{}',
    metrics      JSONB DEFAULT '{}',
    cover_image  TEXT,
    pdf_url      TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_reports_published ON public.market_reports (is_published);
CREATE INDEX IF NOT EXISTS idx_market_reports_pub_at    ON public.market_reports (published_at DESC);

ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_reports_public_read" ON public.market_reports;
CREATE POLICY "market_reports_public_read" ON public.market_reports
    FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "market_reports_auth_all" ON public.market_reports;
CREATE POLICY "market_reports_auth_all" ON public.market_reports
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 14. PIX_CHARGES (Cobranças PIX)
-- Referenciado em: /api/pix, /api/pix/webhook, /api/abacate-pay
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pix_charges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_id UUID,          -- FK para financial_transactions (opcional)
    external_id    TEXT,          -- ID na API do provedor (AbacatePay/Asaas)
    txid           TEXT NOT NULL, -- ID de transação EMV (25 chars)
    amount         NUMERIC(14,2) NOT NULL,
    description    TEXT,
    debtor_name    TEXT,
    status         TEXT NOT NULL DEFAULT 'active',
                   -- active | paid | expired | cancelled
    pix_key        TEXT,
    pix_copy_paste TEXT,          -- EMV payload completo
    qr_code_base64 TEXT,          -- imagem QR em base64
    provider       TEXT DEFAULT 'local',  -- local | abacatepay | asaas
    expires_at     TIMESTAMPTZ,
    paid_at        TIMESTAMPTZ,
    raw_response   JSONB DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pix_charges_user_id    ON public.pix_charges (user_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_status     ON public.pix_charges (status);
CREATE INDEX IF NOT EXISTS idx_pix_charges_txid       ON public.pix_charges (txid);
CREATE INDEX IF NOT EXISTS idx_pix_charges_external   ON public.pix_charges (external_id)
    WHERE external_id IS NOT NULL;

ALTER TABLE public.pix_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pix_charges_auth_all" ON public.pix_charges;
CREATE POLICY "pix_charges_auth_all" ON public.pix_charges
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pix_charges_service_all" ON public.pix_charges;
CREATE POLICY "pix_charges_service_all" ON public.pix_charges
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 15. PROFILES (Perfis de Usuário — complemento ao auth.users)
-- Referenciado em: /api/tracking/pageview, perfil de admin
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT,
    email      TEXT,
    role       TEXT DEFAULT 'admin',  -- admin | corretor | viewer
    avatar_url TEXT,
    company_logo_url TEXT,
    company_name     TEXT,
    phone      TEXT,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_auth_all" ON public.profiles;
CREATE POLICY "profiles_auth_all" ON public.profiles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
CREATE POLICY "profiles_service_all" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 16. FINANCIAL_GOALS (Metas Financeiras)
-- Referenciado em: backoffice/financeiro/metas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    category      TEXT,
    target_amount NUMERIC(14,2) NOT NULL,
    current_amount NUMERIC(14,2) DEFAULT 0,
    period_type   TEXT DEFAULT 'monthly',  -- monthly | quarterly | annual
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    status        TEXT DEFAULT 'ativa',   -- ativa | concluida | cancelada
    notes         TEXT,
    created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_goals_auth_all" ON public.financial_goals;
CREATE POLICY "fin_goals_auth_all" ON public.financial_goals
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 17. BANK_ACCOUNTS (Contas Bancárias)
-- Referenciado em: backoffice/financeiro/contas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name      TEXT NOT NULL,
    account_type   TEXT DEFAULT 'corrente',  -- corrente | poupanca | investimento
    account_number TEXT,
    agency         TEXT,
    balance        NUMERIC(14,2) DEFAULT 0,
    pix_key        TEXT,
    pix_key_type   TEXT,  -- cpf | cnpj | email | telefone | aleatoria
    is_active      BOOLEAN DEFAULT true,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_auth_all" ON public.bank_accounts;
CREATE POLICY "bank_accounts_auth_all" ON public.bank_accounts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 18. TRANSACTIONS (Transações Gerais — usado pelo webhook PIX)
-- Referenciado em: /api/pix/webhook
-- NOTA: Diferente de financial_transactions. Transactions = registro bruto de
--       movimentações financeiras de qualquer origem.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL,      -- credit | debit
    amount          NUMERIC(14,2) NOT NULL,
    currency        TEXT DEFAULT 'BRL',
    description     TEXT,
    external_id     TEXT,              -- ID no provedor externo
    status          TEXT DEFAULT 'pending',
    payment_method  TEXT,              -- pix | boleto | cartao
    pix_charge_id   UUID REFERENCES public.pix_charges(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_auth_all" ON public.transactions;
CREATE POLICY "transactions_auth_all" ON public.transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_service_all" ON public.transactions;
CREATE POLICY "transactions_service_all" ON public.transactions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 19. MARKET_INDICES (Índices de Mercado — IPCA, Selic, FipeZAP)
-- Referenciado em: backoffice/inteligencia/indices, website/inteligencia
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_indices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,   -- IPCA | SELIC | INCC | FIPEZAP_SP
    value       NUMERIC(10,4) NOT NULL,
    period      DATE NOT NULL,          -- período de referência
    unit        TEXT DEFAULT '%',       -- % | R$/m² | pontos
    source      TEXT,                   -- BCB | IBGE | FipeZAP | Yahoo
    country     TEXT DEFAULT 'Brasil',
    segment     TEXT,  -- residencial | comercial | geral
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_indices_code   ON public.market_indices (code);
CREATE INDEX IF NOT EXISTS idx_market_indices_period ON public.market_indices (period DESC);

ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_indices_public_read" ON public.market_indices;
CREATE POLICY "market_indices_public_read" ON public.market_indices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "market_indices_auth_write" ON public.market_indices;
CREATE POLICY "market_indices_auth_write" ON public.market_indices
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "market_indices_auth_update" ON public.market_indices;
CREATE POLICY "market_indices_auth_update" ON public.market_indices
    FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- 20. MARKET_INDICATORS (Indicadores de Mercado por Cidade/Segmento)
-- Referenciado em: backoffice/inteligencia/indicadores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_indicators (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    indicator_type TEXT NOT NULL,  -- preco_m2 | vgv | lancamentos | vendas
    value        NUMERIC(14,2) NOT NULL,
    variation    NUMERIC(8,4),     -- variação percentual
    period       DATE NOT NULL,
    city         TEXT,
    state        TEXT,
    segment      TEXT DEFAULT 'residencial',
    source       TEXT,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_indicators_type   ON public.market_indicators (indicator_type);
CREATE INDEX IF NOT EXISTS idx_market_indicators_period ON public.market_indicators (period DESC);

ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_indicators_public_read" ON public.market_indicators;
CREATE POLICY "market_indicators_public_read" ON public.market_indicators
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "market_indicators_auth_write" ON public.market_indicators;
CREATE POLICY "market_indicators_auth_write" ON public.market_indicators
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 21. VALUATION_REQUESTS (Solicitações de Avaliação via Site)
-- Referenciado em: /api/appraisal
-- NOTA: Diferente de avaliacoes (processo interno). valuation_requests = lead
--       do site público solicitando avaliação.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.valuation_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    property_type   TEXT,
    property_address TEXT,
    city            TEXT,
    state           TEXT,
    area_m2         NUMERIC(10,2),
    objective       TEXT,           -- venda | locacao | financiamento | inventario
    timeline        TEXT,
    message         TEXT,
    status          TEXT DEFAULT 'novo',  -- novo | em_analise | concluido | cancelado
    source          TEXT DEFAULT 'site',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.valuation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "valuation_requests_anon_insert" ON public.valuation_requests;
CREATE POLICY "valuation_requests_anon_insert" ON public.valuation_requests
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "valuation_requests_auth_all" ON public.valuation_requests;
CREATE POLICY "valuation_requests_auth_all" ON public.valuation_requests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 22. EBOOKS (Módulo de Inteligência — E-books e Conteúdos Premium)
-- Referenciado em: backoffice/inteligencia/ebooks, /api/ai/write-ebook
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ebooks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    slug         TEXT UNIQUE,
    description  TEXT,
    content      TEXT,           -- markdown content
    cover_image  TEXT,
    pdf_url      TEXT,
    category     TEXT,           -- mercado | investimento | legislacao | guia
    tags         TEXT[] DEFAULT '{}',
    target_audience TEXT,
    is_published BOOLEAN DEFAULT false,
    is_free      BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ebooks_public_read" ON public.ebooks;
CREATE POLICY "ebooks_public_read" ON public.ebooks
    FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "ebooks_auth_all" ON public.ebooks;
CREATE POLICY "ebooks_auth_all" ON public.ebooks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 23. SMART_LINKS (Links Inteligentes com Analytics — QR + UTM)
-- Referenciado em: backoffice/tracking/links
-- NOTA: Extensão de tracked_links com mais analytics e AI insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.smart_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_id  UUID REFERENCES public.developments(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    short_code      TEXT NOT NULL UNIQUE,
    destination_url TEXT NOT NULL,
    channel         TEXT,             -- instagram | whatsapp | google | email
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    utm_content     TEXT,
    qr_code_url     TEXT,
    click_count     INTEGER DEFAULT 0,
    lead_count      INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    expires_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_links_short_code    ON public.smart_links (short_code);
CREATE INDEX IF NOT EXISTS idx_smart_links_development   ON public.smart_links (development_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_active        ON public.smart_links (is_active);

ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "smart_links_auth_all" ON public.smart_links;
CREATE POLICY "smart_links_auth_all" ON public.smart_links
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "smart_links_anon_read" ON public.smart_links;
CREATE POLICY "smart_links_anon_read" ON public.smart_links
    FOR SELECT TO anon USING (is_active = true);

-- ============================================================================
-- 24. SMART_LINK_EVENTS (Eventos de Cliques em Smart Links)
-- Referenciado em: backoffice/tracking/links analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.smart_link_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smart_link_id UUID REFERENCES public.smart_links(id) ON DELETE CASCADE,
    short_code   TEXT NOT NULL,
    ip_address   TEXT,
    user_agent   TEXT,
    referrer     TEXT,
    device_type  TEXT,
    browser      TEXT,
    os           TEXT,
    country      TEXT,
    city         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_link_events_link_id    ON public.smart_link_events (smart_link_id);
CREATE INDEX IF NOT EXISTS idx_smart_link_events_created_at ON public.smart_link_events (created_at DESC);

ALTER TABLE public.smart_link_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "smart_link_events_anon_insert" ON public.smart_link_events;
CREATE POLICY "smart_link_events_anon_insert" ON public.smart_link_events
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "smart_link_events_service_all" ON public.smart_link_events;
CREATE POLICY "smart_link_events_service_all" ON public.smart_link_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "smart_link_events_auth_read" ON public.smart_link_events;
CREATE POLICY "smart_link_events_auth_read" ON public.smart_link_events
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 25. MEDIA (Registro de Mídias Enviadas ao Storage)
-- Referenciado em: /api/upload, /api/health
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name    TEXT NOT NULL,
    file_path    TEXT NOT NULL,
    file_url     TEXT NOT NULL,
    file_size    INTEGER,
    mime_type    TEXT,
    bucket       TEXT NOT NULL DEFAULT 'developments',
    entity_type  TEXT,       -- development | developer | broker | content
    entity_id    UUID,
    uploaded_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media (entity_type, entity_id);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_auth_all" ON public.media;
CREATE POLICY "media_auth_all" ON public.media
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 26. DAILY_SALES_STATS (View — Estatísticas de Vendas por Dia)
-- Referenciado em: backoffice/relatorios, analytics/dashboard
-- ============================================================================

CREATE OR REPLACE VIEW public.daily_sales_stats AS
SELECT
    DATE(ft.created_at) AS day,
    SUM(CASE WHEN ft.type = 'receita' THEN ft.amount ELSE 0 END) AS total_receita,
    SUM(CASE WHEN ft.type = 'despesa' THEN ft.amount ELSE 0 END) AS total_despesa,
    SUM(CASE WHEN ft.type = 'receita' THEN ft.amount ELSE -ft.amount END) AS saldo,
    COUNT(CASE WHEN ft.type = 'receita' THEN 1 END) AS num_receitas,
    COUNT(CASE WHEN ft.type = 'despesa' THEN 1 END) AS num_despesas
FROM public.financial_transactions ft
WHERE ft.status != 'cancelado'
GROUP BY DATE(ft.created_at)
ORDER BY day DESC;

-- ============================================================================
-- 27. ADS_CAMPAIGNS_SUMMARY (View — Resumo de Campanhas de Anúncios)
-- Referenciado em: backoffice/ads, analytics
-- ============================================================================

CREATE OR REPLACE VIEW public.ads_campaigns_summary AS
SELECT
    c.id,
    c.name,
    c.platform,
    c.status,
    c.budget_total,
    c.created_at,
    COALESCE(SUM(m.spend), 0)       AS total_spend,
    COALESCE(SUM(m.impressions), 0) AS total_impressions,
    COALESCE(SUM(m.clicks), 0)      AS total_clicks,
    COALESCE(SUM(m.conversions), 0) AS total_conversions,
    CASE WHEN COALESCE(SUM(m.impressions), 0) > 0
         THEN ROUND(COALESCE(SUM(m.clicks), 0)::NUMERIC / SUM(m.impressions) * 100, 2)
         ELSE 0
    END AS ctr,
    CASE WHEN COALESCE(SUM(m.clicks), 0) > 0
         THEN ROUND(COALESCE(SUM(m.spend), 0) / SUM(m.clicks), 2)
         ELSE 0
    END AS cpc
FROM public.ads_campaigns c
LEFT JOIN public.ads_metrics m ON m.campaign_id = c.id
GROUP BY c.id, c.name, c.platform, c.status, c.budget_total, c.created_at;

-- ============================================================================
-- PART 2: FIXES TO EXISTING TABLES
-- ============================================================================

-- Fix contratos: modelo_id e modelo_nome devem ser nullable (API envia null)
ALTER TABLE public.contratos ALTER COLUMN modelo_id DROP NOT NULL;
ALTER TABLE public.contratos ALTER COLUMN modelo_nome DROP NOT NULL;

-- Fix niche_playbooks: adicionar colunas usadas pela API /api/playbooks
ALTER TABLE public.niche_playbooks
    ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS version        INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS typical_audiences   JSONB,
    ADD COLUMN IF NOT EXISTS legal_restrictions  JSONB,
    ADD COLUMN IF NOT EXISTS campaign_templates  JSONB,
    ADD COLUMN IF NOT EXISTS content_guidelines  JSONB,
    ADD COLUMN IF NOT EXISTS crm_scripts         JSONB,
    ADD COLUMN IF NOT EXISTS whatsapp_templates  JSONB,
    ADD COLUMN IF NOT EXISTS email_templates     JSONB,
    ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

-- Fix tracked_links: adicionar campaign_name se não existir
ALTER TABLE public.tracked_links
    ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Fix developments: garantir coluna price_from (referenciada no dashboard)
ALTER TABLE public.developments
    ADD COLUMN IF NOT EXISTS price_from    NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS price_to      NUMERIC(14,2),
    ADD COLUMN IF NOT EXISTS inventory_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS video_url     TEXT,
    ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
    ADD COLUMN IF NOT EXISTS floor_plans   TEXT[],
    ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Fix leads: garantir colunas de UTM e source (referenciadas em tracking)
ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'site',
    ADD COLUMN IF NOT EXISTS utm_source   TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
    ADD COLUMN IF NOT EXISTS utm_content  TEXT,
    ADD COLUMN IF NOT EXISTS temperature  TEXT DEFAULT 'cold',
    ADD COLUMN IF NOT EXISTS tenant_id    UUID;

-- ============================================================================
-- PART 3: STORAGE BUCKET — MEDIA
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800,  -- 50MB
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'video/mp4', 'video/webm',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_bucket_public_read" ON storage.objects;
CREATE POLICY "media_bucket_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_bucket_auth_upload" ON storage.objects;
CREATE POLICY "media_bucket_auth_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_bucket_auth_delete" ON storage.objects;
CREATE POLICY "media_bucket_auth_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_bucket_auth_update" ON storage.objects;
CREATE POLICY "media_bucket_auth_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'media');

-- ============================================================================
-- FIM DA MIGRATION 050
-- Executar no Supabase Dashboard > SQL Editor > Run
-- Verificar: zero erros de "relation does not exist" após execução
-- ============================================================================
