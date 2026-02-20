-- ============================================================
-- IMI Atlantis — B6 SQL
-- Dashboard stats function + Consultorias + Projetos tables
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── 1. CONSULTORIAS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultorias (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo             TEXT UNIQUE NOT NULL DEFAULT '',
  cliente_nome          TEXT NOT NULL,
  cliente_email         TEXT,
  cliente_telefone      TEXT,
  cliente_tipo          TEXT NOT NULL DEFAULT 'PF' CHECK (cliente_tipo IN ('PF', 'PJ')),
  tipo                  TEXT NOT NULL CHECK (tipo IN ('estrategica', 'tributaria', 'patrimonial', 'mercado', 'juridica')),
  descricao             TEXT,
  objetivo              TEXT,
  cidade                TEXT,
  estado                TEXT DEFAULT 'PE',
  honorarios            NUMERIC(12, 2),
  forma_pagamento       TEXT DEFAULT 'a_vista',
  honorarios_status     TEXT DEFAULT 'pendente' CHECK (honorarios_status IN ('pago', 'parcial', 'pendente')),
  status                TEXT DEFAULT 'proposta' CHECK (status IN ('proposta', 'em_andamento', 'concluida', 'cancelada')),
  data_inicio           DATE,
  data_prev_conclusao   DATE,
  observacoes           TEXT,
  consultor_id          UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Auto protocolo
CREATE SEQUENCE IF NOT EXISTS consultorias_seq START 1;

CREATE OR REPLACE FUNCTION generate_consultoria_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocolo = '' THEN
    NEW.protocolo := 'CON-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('consultorias_seq')::TEXT, 3, '0');
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consultoria_protocolo ON public.consultorias;
CREATE TRIGGER trg_consultoria_protocolo
  BEFORE INSERT OR UPDATE ON public.consultorias
  FOR EACH ROW EXECUTE FUNCTION generate_consultoria_protocolo();

-- ── 2. PROJETOS / EMPREENDIMENTOS TABLE ─────────────────────
CREATE TABLE IF NOT EXISTS public.projetos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT NOT NULL,
  tipo                  TEXT,
  descricao             TEXT,
  cidade                TEXT,
  estado                TEXT DEFAULT 'PE',
  status                TEXT DEFAULT 'estruturacao' CHECK (status IN ('estruturacao', 'lancamento', 'obras', 'pronto', 'encerrado')),
  fase                  TEXT,
  unidades              INTEGER DEFAULT 0,
  unidades_vendidas     INTEGER DEFAULT 0,
  area_total_m2         NUMERIC(12, 2),
  vgv                   NUMERIC(15, 2),
  imagem_url            TEXT,
  latitude              NUMERIC(10, 6),
  longitude             NUMERIC(10, 6),
  data_lancamento       DATE,
  data_entrega_prev     DATE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 3. RLS POLICIES ─────────────────────────────────────────
ALTER TABLE public.consultorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Consultorias: só autenticados
DROP POLICY IF EXISTS "consultorias_auth" ON public.consultorias;
CREATE POLICY "consultorias_auth" ON public.consultorias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Projetos: leitura pública, escrita autenticada
DROP POLICY IF EXISTS "projetos_read" ON public.projetos;
CREATE POLICY "projetos_read" ON public.projetos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "projetos_write" ON public.projetos;
CREATE POLICY "projetos_write" ON public.projetos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_consultorias_status ON public.consultorias(status);
CREATE INDEX IF NOT EXISTS idx_consultorias_created ON public.consultorias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultorias_consultor ON public.consultorias(consultor_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON public.projetos(status);

-- ── 5. DASHBOARD STATS FUNCTION ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Leads
    'total_leads',       (SELECT COUNT(*) FROM public.leads),
    'leads_today',       (SELECT COUNT(*) FROM public.leads WHERE DATE(created_at) = CURRENT_DATE),
    'leads_mes',         (SELECT COUNT(*) FROM public.leads WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())),

    -- Avaliações
    'total_avaliacoes',  (SELECT COUNT(*) FROM public.avaliacoes),
    'avaliacoes_mes',    (SELECT COUNT(*) FROM public.avaliacoes WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())),

    -- Imóveis
    'total_imoveis',     (SELECT COUNT(*) FROM public.developments),

    -- Receita (honorários pagos no mês — avaliações + consultorias)
    'receita_mes',       COALESCE(
      (SELECT SUM(honorarios) FROM public.avaliacoes
       WHERE honorarios_status = 'pago'
       AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW())), 0
    ) + COALESCE(
      (SELECT SUM(honorarios) FROM public.consultorias
       WHERE honorarios_status = 'pago'
       AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW())), 0
    ),

    -- Conversão leads
    'conversion_rate',   ROUND(
      CASE WHEN (SELECT COUNT(*) FROM public.leads) > 0
        THEN (SELECT COUNT(*) FROM public.leads WHERE status IN ('fechado', 'convertido'))::NUMERIC
             / (SELECT COUNT(*) FROM public.leads)::NUMERIC * 100
        ELSE 0 END, 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ── 6. MOCK DATA ─────────────────────────────────────────────
INSERT INTO public.consultorias
  (cliente_nome, cliente_email, cliente_tipo, tipo, descricao, cidade, honorarios, honorarios_status, status, data_inicio, data_prev_conclusao)
VALUES
  ('Família Cavalcanti', 'cavalcanti@gmail.com', 'PF', 'patrimonial',
   'Estruturação patrimonial pré-holding familiar — 3 imóveis Boa Viagem',
   'Recife', 8500, 'parcial', 'em_andamento', '2026-01-15', '2026-03-15'),
  ('Construtora Omega S.A.', 'omega@construtora.com.br', 'PJ', 'mercado',
   'Análise de viabilidade VGV — Empreendimento Torre Norte, Olinda',
   'Olinda', 15000, 'pago', 'concluida', '2025-11-01', '2026-01-31'),
  ('Dr. Fernando Albuquerque', 'fernando.alb@adv.com', 'PF', 'juridica',
   'Laudo técnico para ação de indenização — desapropriação parcial Piedade',
   'Recife', 6000, 'pendente', 'proposta', '2026-02-20', '2026-04-01')
ON CONFLICT DO NOTHING;

INSERT INTO public.projetos
  (nome, tipo, descricao, cidade, estado, status, fase, unidades, unidades_vendidas, area_total_m2, vgv, data_lancamento)
VALUES
  ('Reserva Atlantis', 'Empreendimento Costeiro',
   'Complexo hoteleiro e residencial de alto padrão. REGEN technology.',
   'Ponta de Pedra', 'PE', 'estruturacao', 'Estruturação / Captação', 320, 0, 120000, 480000000, NULL),
  ('Ocean Blue Cobertura', 'Apartamento Alto Padrão',
   'Torre residencial premium com vista para o mar. Boa Viagem.',
   'Recife', 'PE', 'lancamento', 'Lançamento', 48, 12, 8200, 96000000, '2025-09-01'),
  ('Villa Jardins', 'Condomínio Horizontal',
   'Casas em condomínio fechado. Entrega prevista Q3 2026.',
   'Piedade', 'PE', 'obras', 'Em Obras', 32, 24, 14500, 22000000, '2024-06-01'),
  ('Smart Pina', 'Studio Compacto',
   'Studios com design funcional. 4 unidades disponíveis.',
   'Recife', 'PE', 'pronto', 'Pronto para Morar', 24, 20, 2800, 10000000, '2024-01-01')
ON CONFLICT DO NOTHING;
