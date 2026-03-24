-- ============================================================================
-- BPO Financeiro — IMI Financial Back-Office Processing
-- Migration: 20260323_bpo_financeiro.sql
-- ============================================================================

-- 1. bpo_empresas — companies managed by BPO
CREATE TABLE IF NOT EXISTS bpo_empresas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome           TEXT NOT NULL,
    cnpj           TEXT UNIQUE,
    regime_tributario TEXT DEFAULT 'simples_nacional', -- simples_nacional, lucro_presumido, lucro_real
    plano          TEXT DEFAULT 'essencial',           -- essencial, profissional, enterprise
    pluggy_api_key TEXT,
    pluggy_client_id TEXT,
    ativo          BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 2. bpo_categorias — chart of accounts categories
CREATE TABLE IF NOT EXISTS bpo_categorias (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id        UUID REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    nome              TEXT NOT NULL,
    tipo              TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'custo', 'investimento')),
    grupo             TEXT, -- grupo DRE: receita_bruta, deducoes, custos, despesas_operacionais, resultado_financeiro
    plano_contas_codigo TEXT, -- e.g. 3.1.01
    ativo             BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- 3. bpo_contas_bancarias — bank accounts connected via Open Finance
CREATE TABLE IF NOT EXISTS bpo_contas_bancarias (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id        UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    banco             TEXT NOT NULL,
    agencia           TEXT,
    conta             TEXT,
    tipo              TEXT DEFAULT 'corrente', -- corrente, poupanca, investimento
    pluggy_item_id    TEXT,
    pluggy_account_id TEXT,
    saldo             NUMERIC(15,2) DEFAULT 0,
    saldo_atualizado_em TIMESTAMPTZ,
    ativo             BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 4. bpo_transacoes — financial transactions
CREATE TABLE IF NOT EXISTS bpo_transacoes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    conta_id        UUID REFERENCES bpo_contas_bancarias(id) ON DELETE SET NULL,
    categoria_id    UUID REFERENCES bpo_categorias(id) ON DELETE SET NULL,
    data            DATE NOT NULL,
    descricao       TEXT,
    valor           NUMERIC(15,2) NOT NULL,
    tipo            TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    origem          TEXT DEFAULT 'manual', -- manual, open_finance, nfse, ocr
    conciliado      BOOLEAN DEFAULT false,
    comprovante_url TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. bpo_conciliacoes — bank reconciliation matches
CREATE TABLE IF NOT EXISTS bpo_conciliacoes (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id           UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    transacao_interna_id UUID REFERENCES bpo_transacoes(id) ON DELETE CASCADE,
    transacao_banco_id   TEXT, -- external bank transaction ID from Pluggy
    valor_interno        NUMERIC(15,2),
    valor_banco          NUMERIC(15,2),
    data_interno         DATE,
    data_banco           DATE,
    score_match          NUMERIC(5,2) DEFAULT 0, -- 0-100 confidence
    status               TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'auto_aprovado')),
    metodo_match         TEXT, -- exact_value, date_range, description_similarity, ml_prediction
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. bpo_notas_fiscais — issued invoices NFSe
CREATE TABLE IF NOT EXISTS bpo_notas_fiscais (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    transacao_id    UUID REFERENCES bpo_transacoes(id) ON DELETE SET NULL,
    numero          TEXT,
    serie           TEXT,
    status          TEXT DEFAULT 'emitida' CHECK (status IN ('rascunho', 'emitida', 'cancelada', 'rejeitada')),
    valor           NUMERIC(15,2) NOT NULL,
    tomador_nome    TEXT,
    tomador_cnpj    TEXT,
    tomador_email   TEXT,
    descricao_servico TEXT,
    xml_url         TEXT,
    pdf_url         TEXT,
    data_emissao    DATE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. bpo_regras_automacao — AI learning rules for categorization
CREATE TABLE IF NOT EXISTS bpo_regras_automacao (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    campo_match      TEXT NOT NULL, -- descricao, valor, origem, banco
    valor_match      TEXT NOT NULL, -- regex or exact match pattern
    categoria_destino UUID REFERENCES bpo_categorias(id) ON DELETE SET NULL,
    confianca        NUMERIC(5,2) DEFAULT 80, -- 0-100 confidence threshold
    vezes_aplicada   INTEGER DEFAULT 0,
    ativa            BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 8. bpo_dre_cache — cached DRE (income statement) reports
CREATE TABLE IF NOT EXISTS bpo_dre_cache (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id            UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    mes                   INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano                   INTEGER NOT NULL,
    receita_bruta         NUMERIC(15,2) DEFAULT 0,
    deducoes              NUMERIC(15,2) DEFAULT 0,
    receita_liquida       NUMERIC(15,2) DEFAULT 0,
    custos                NUMERIC(15,2) DEFAULT 0,
    lucro_bruto           NUMERIC(15,2) DEFAULT 0,
    despesas_operacionais NUMERIC(15,2) DEFAULT 0,
    lucro_operacional     NUMERIC(15,2) DEFAULT 0,
    resultado_financeiro  NUMERIC(15,2) DEFAULT 0,
    lucro_liquido         NUMERIC(15,2) DEFAULT 0,
    narrativa_ia          TEXT, -- AI-generated analysis
    gerado_em             TIMESTAMPTZ DEFAULT now(),
    created_at            TIMESTAMPTZ DEFAULT now(),
    UNIQUE(empresa_id, mes, ano)
);

-- 9. bpo_documentos — OCR processed documents
CREATE TABLE IF NOT EXISTS bpo_documentos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    transacao_id     UUID REFERENCES bpo_transacoes(id) ON DELETE SET NULL,
    tipo             TEXT DEFAULT 'comprovante', -- comprovante, nota_fiscal, contrato, boleto, recibo
    arquivo_url      TEXT,
    arquivo_nome     TEXT,
    ocr_texto        TEXT,
    classificacao_ia JSONB DEFAULT '{}', -- { tipo_documento, confianca, dados_extraidos }
    processado       BOOLEAN DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- 10. bpo_alertas — proactive alerts
CREATE TABLE IF NOT EXISTS bpo_alertas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID NOT NULL REFERENCES bpo_empresas(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL, -- conciliacao, vencimento, anomalia, meta, fiscal
    titulo      TEXT NOT NULL,
    mensagem    TEXT,
    severidade  TEXT DEFAULT 'info' CHECK (severidade IN ('info', 'warning', 'critical')),
    lido        BOOLEAN DEFAULT false,
    acao_url    TEXT, -- deep link to relevant page
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES — performance on empresa_id + date columns
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bpo_transacoes_empresa_data ON bpo_transacoes(empresa_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_bpo_transacoes_tipo ON bpo_transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_bpo_transacoes_conciliado ON bpo_transacoes(conciliado);
CREATE INDEX IF NOT EXISTS idx_bpo_conciliacoes_empresa ON bpo_conciliacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bpo_conciliacoes_status ON bpo_conciliacoes(status);
CREATE INDEX IF NOT EXISTS idx_bpo_notas_fiscais_empresa_data ON bpo_notas_fiscais(empresa_id, data_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_bpo_dre_cache_empresa_periodo ON bpo_dre_cache(empresa_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_bpo_alertas_empresa_lido ON bpo_alertas(empresa_id, lido);
CREATE INDEX IF NOT EXISTS idx_bpo_alertas_severidade ON bpo_alertas(severidade);
CREATE INDEX IF NOT EXISTS idx_bpo_documentos_empresa ON bpo_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bpo_categorias_empresa ON bpo_categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bpo_contas_bancarias_empresa ON bpo_contas_bancarias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bpo_regras_automacao_empresa ON bpo_regras_automacao(empresa_id);

-- ============================================================================
-- RLS — Row Level Security on all tables
-- ============================================================================
ALTER TABLE bpo_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_regras_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_dre_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpo_alertas ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write all BPO tables (admin-level backoffice access)
CREATE POLICY bpo_empresas_auth ON bpo_empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_categorias_auth ON bpo_categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_contas_bancarias_auth ON bpo_contas_bancarias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_transacoes_auth ON bpo_transacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_conciliacoes_auth ON bpo_conciliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_notas_fiscais_auth ON bpo_notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_regras_automacao_auth ON bpo_regras_automacao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_dre_cache_auth ON bpo_dre_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_documentos_auth ON bpo_documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY bpo_alertas_auth ON bpo_alertas FOR ALL TO authenticated USING (true) WITH CHECK (true);
