-- =============================================================================
-- Migration: 20260520_valuation_methods_expanded.sql
-- Description: Expands the `avaliacoes` table with additional columns to
--              support multiple real estate valuation methods, including:
--                - Method tracking (primary method, alternatives, justification)
--                - Método Involutivo (VGV, incorporation costs, developer profit)
--                - Renda / Cap Rate (NOI, cap rate, vacancy)
--                - DCF / Fluxo de Caixa Descontado (annual cash flow, discount
--                  rate, NPV, IRR, payback period)
--                - Scenario analysis (conservative, realistic, aggressive values)
--                - Liquidez / Forced liquidation value
--                - Depreciation results (JSONB)
--                - BDI (direct cost, BDI percentage, total cost)
--                - Fundo de Comércio (monthly revenue, goodwill value)
--                - Laudo / PTAM type classification
--
--              All ALTER TABLE statements use ADD COLUMN IF NOT EXISTS to make
--              this migration idempotent (safe to run multiple times).
--
-- Depends on: 20260327_fix_connect_avaliacoes_profiles.sql (RLS policies)
-- Author: Claude Code
-- Date: 2026-05-20
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Expand `avaliacoes` table with new valuation method columns
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS avaliacoes
  -- Method tracking
  ADD COLUMN IF NOT EXISTS metodo_principal text,
  ADD COLUMN IF NOT EXISTS metodos_alternativos text[],
  ADD COLUMN IF NOT EXISTS justificativa_metodo text,

  -- Método Involutivo
  ADD COLUMN IF NOT EXISTS vgv numeric,
  ADD COLUMN IF NOT EXISTS custos_incorporacao numeric,
  ADD COLUMN IF NOT EXISTS lucro_incorporador numeric,

  -- Renda / Cap Rate
  ADD COLUMN IF NOT EXISTS noi_mensal numeric,
  ADD COLUMN IF NOT EXISTS taxa_cap_rate numeric,
  ADD COLUMN IF NOT EXISTS vacancia_pct numeric DEFAULT 5,

  -- DCF (Fluxo de Caixa Descontado)
  ADD COLUMN IF NOT EXISTS fluxo_caixa_anual jsonb,
  ADD COLUMN IF NOT EXISTS taxa_desconto numeric,
  ADD COLUMN IF NOT EXISTS vpl numeric,
  ADD COLUMN IF NOT EXISTS tir numeric,
  ADD COLUMN IF NOT EXISTS payback_anos numeric,

  -- Cenários (Scenarios)
  ADD COLUMN IF NOT EXISTS valor_conservador numeric,
  ADD COLUMN IF NOT EXISTS valor_realista numeric,
  ADD COLUMN IF NOT EXISTS valor_agressivo numeric,

  -- Liquidez
  ADD COLUMN IF NOT EXISTS liquidez text CHECK (liquidez IN ('alta', 'media', 'baixa')),
  ADD COLUMN IF NOT EXISTS valor_liquidacao_forcada numeric,

  -- Depreciação
  ADD COLUMN IF NOT EXISTS depreciacao_resultado jsonb,

  -- BDI (Benefícios e Despesas Indiretas)
  ADD COLUMN IF NOT EXISTS custo_direto numeric,
  ADD COLUMN IF NOT EXISTS bdi_pct numeric DEFAULT 25,
  ADD COLUMN IF NOT EXISTS custo_total_bdi numeric,

  -- Fundo de Comércio
  ADD COLUMN IF NOT EXISTS faturamento_mensal numeric,
  ADD COLUMN IF NOT EXISTS valor_fundo_comercio numeric,

  -- Tipo de laudo / PTAM
  ADD COLUMN IF NOT EXISTS tipo_laudo text DEFAULT 'ptam'
    CHECK (tipo_laudo IN ('ptam', 'laudo_tecnico', 'laudo_judicial', 'resumo_executivo', 'relatorio_comercial'));

-- ---------------------------------------------------------------------------
-- 2. Create indexes for commonly queried columns
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_avaliacoes_metodo
  ON avaliacoes(metodo_principal);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_liquidez
  ON avaliacoes(liquidez);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_tipo_laudo
  ON avaliacoes(tipo_laudo);

-- ---------------------------------------------------------------------------
-- 3. RLS policies
-- RLS policies already set in previous migration
-- (20260327_fix_connect_avaliacoes_profiles.sql) — no changes needed here.
-- ---------------------------------------------------------------------------
