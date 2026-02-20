-- =============================================================
-- IMI Atlantis — SQL B5: Módulo Avaliações Completo
-- Execute no Supabase SQL Editor após os scripts anteriores
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Extensão para UUID
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------
-- 2. Tabela: avaliacoes (principal — NBR 14653)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo       TEXT UNIQUE NOT NULL DEFAULT ('AVL-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('avaliacoes_seq')::text, 3, '0')),

  -- Imóvel
  tipo_imovel     TEXT NOT NULL,
  endereco        TEXT NOT NULL,
  complemento     TEXT,
  bairro          TEXT NOT NULL,
  cidade          TEXT NOT NULL DEFAULT 'Recife',
  estado          TEXT NOT NULL DEFAULT 'PE',
  cep             TEXT,
  area_privativa  NUMERIC(10,2),
  area_total      NUMERIC(10,2),
  quartos         SMALLINT,
  banheiros       SMALLINT,
  vagas           SMALLINT,
  andar           SMALLINT,
  ano_construcao  SMALLINT,
  padrao          TEXT CHECK (padrao IN ('Baixo','Normal','Alto','Luxo')),
  estado_conservacao TEXT,
  caracteristicas TEXT[] DEFAULT '{}',

  -- Solicitante
  cliente_nome    TEXT NOT NULL,
  cliente_email   TEXT,
  cliente_telefone TEXT,
  cliente_cpf_cnpj TEXT,
  cliente_tipo    TEXT CHECK (cliente_tipo IN ('PF','PJ')) DEFAULT 'PF',
  solicitante_instituicao TEXT,

  -- Avaliação
  finalidade      TEXT NOT NULL,
  metodologia     TEXT NOT NULL DEFAULT 'comparativo',
  grau_fundamentacao TEXT DEFAULT 'II',
  grau_precisao   TEXT DEFAULT 'II',
  prazo_entrega   DATE,
  observacoes     TEXT,

  -- Financeiro
  honorarios      NUMERIC(12,2),
  forma_pagamento TEXT,
  honorarios_status TEXT DEFAULT 'pendente' CHECK (honorarios_status IN ('pendente','parcial','pago')),

  -- Resultado
  valor_estimado  NUMERIC(12,2),
  valor_minimo    NUMERIC(12,2),
  valor_maximo    NUMERIC(12,2),
  valor_m2        NUMERIC(10,2),

  -- Status e controle
  status          TEXT DEFAULT 'aguardando_docs' CHECK (status IN ('aguardando_docs','em_andamento','concluida','cancelada')),
  laudo_url       TEXT,  -- URL do laudo PDF no Storage
  avaliador_id    UUID REFERENCES auth.users(id),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence para número sequencial do protocolo
CREATE SEQUENCE IF NOT EXISTS avaliacoes_seq START 1;

-- ---------------------------------------------------------------
-- 3. Tabela: avaliacoes_comparaveis (amostras de mercado)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes_comparaveis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id    UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,

  endereco        TEXT NOT NULL,
  tipo_imovel     TEXT,
  area            NUMERIC(10,2),
  quartos         SMALLINT,
  banheiros       SMALLINT,
  vagas           SMALLINT,
  padrao          TEXT,
  estado          TEXT,
  valor_venda     NUMERIC(12,2) NOT NULL,
  valor_m2        NUMERIC(10,2) GENERATED ALWAYS AS (CASE WHEN area > 0 THEN valor_venda / area ELSE NULL END) STORED,
  fonte_dado      TEXT,
  data_coleta     DATE,
  distancia_km    NUMERIC(5,2),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 4. Tabela: email_interpretacoes (histórico do interpretador)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_interpretacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_raw       TEXT NOT NULL,
  solicitante     TEXT,
  tipo_entidade   TEXT,
  finalidade      TEXT,
  metodologia     TEXT,
  tipo_imovel     TEXT,
  bairro          TEXT,
  cidade          TEXT,
  urgencia        TEXT,
  prazo_sugerido  TEXT,
  complexidade    TEXT,
  laudo_tipo      TEXT,
  honorarios_min  NUMERIC(12,2),
  honorarios_rec  NUMERIC(12,2),
  honorarios_max  NUMERIC(12,2),
  draft_response  TEXT,
  avaliacao_id    UUID REFERENCES avaliacoes(id),  -- se virou avaliação
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 5. Tabela: exercicios_score (progresso de treino)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercicios_score (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  exercicio_id    TEXT NOT NULL,
  categoria       TEXT,
  nivel           TEXT,
  correta         BOOLEAN NOT NULL,
  streak          SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 6. RLS Policies
-- ---------------------------------------------------------------
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_comparaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_interpretacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios_score ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "avaliacoes_all_auth" ON avaliacoes FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "comparaveis_all_auth" ON avaliacoes_comparaveis FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "emails_all_auth" ON email_interpretacoes FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "score_own" ON exercicios_score FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------
-- 7. Índices de performance
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_created ON avaliacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_comparaveis_avaliacao ON avaliacoes_comparaveis(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_exercicios_user ON exercicios_score(user_id, categoria);

-- ---------------------------------------------------------------
-- 8. Função: estatísticas de avaliações para dashboard
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_avaliacoes_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'concluidas', COUNT(*) FILTER (WHERE status = 'concluida'),
    'em_andamento', COUNT(*) FILTER (WHERE status = 'em_andamento'),
    'aguardando_docs', COUNT(*) FILTER (WHERE status = 'aguardando_docs'),
    'honorarios_recebidos', COALESCE(SUM(honorarios) FILTER (WHERE honorarios_status = 'pago'), 0),
    'honorarios_pendentes', COALESCE(SUM(honorarios) FILTER (WHERE honorarios_status != 'pago'), 0),
    'valor_total_avaliado', COALESCE(SUM(valor_estimado), 0)
  )
  FROM avaliacoes;
$$;

-- ---------------------------------------------------------------
-- 9. Mock data de demonstração
-- ---------------------------------------------------------------
INSERT INTO avaliacoes (
  protocolo, tipo_imovel, endereco, bairro, cidade, estado,
  area_privativa, quartos, banheiros, vagas, andar, padrao, estado_conservacao,
  cliente_nome, cliente_email, cliente_telefone,
  finalidade, metodologia, grau_fundamentacao, grau_precisao,
  honorarios, honorarios_status, valor_estimado, valor_minimo, valor_maximo, valor_m2,
  status
) VALUES
  ('AVL-2026-001', 'Apartamento', 'Av. Boa Viagem, 3456 - Apto 802', 'Boa Viagem', 'Recife', 'PE',
   85, 3, 2, 2, 8, 'Alto', 'Novo',
   'Maria Santos Silva', 'maria.santos@gmail.com', '(81) 99845-3421',
   'compra_venda', 'comparativo', 'II', 'II',
   1800, 'pago', 580000, 550000, 610000, 6824,
   'concluida'),

  ('AVL-2026-002', 'Casa', 'Rua da Aurora, 456', 'Graças', 'Recife', 'PE',
   320, 4, 4, 3, 0, 'Luxo', 'Novo',
   'TJ-PE — Processo 0001234', 'secretaria@tjpe.jus.br', NULL,
   'partilha', 'evolutivo', 'III', 'II',
   4500, 'parcial', NULL, NULL, NULL, NULL,
   'em_andamento'),

  ('AVL-2026-003', 'Apartamento', 'Av. Conselheiro Aguiar, 2200', 'Pina', 'Recife', 'PE',
   68, 2, 2, 1, 5, 'Normal', 'Novo',
   'Banco Bradesco', 'avaliacoes@bradesco.com.br', NULL,
   'financiamento', 'comparativo', 'II', 'II',
   1500, 'pendente', NULL, NULL, NULL, NULL,
   'aguardando_docs')

ON CONFLICT (protocolo) DO NOTHING;

-- ---------------------------------------------------------------
-- 10. Trigger: atualiza updated_at automaticamente
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER avaliacoes_updated_at
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
