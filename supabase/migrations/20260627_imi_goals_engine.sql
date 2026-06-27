-- ============================================================================
-- IMI AUTH ECOSYSTEM — METAS & DESEMPENHO (goals engine)
-- Date: 2026-06-27 (complements the IMI auth ecosystem)
-- ----------------------------------------------------------------------------
-- Metas de equipe e individuais, com "realizado" derivado das propostas
-- APROVADAS (imi.proposals) — fechando o ciclo Propostas → Vendas → Metas.
--
-- Entidade:
--   imi.goals — meta (escopo team|individual), período, valor-alvo.
--
-- RBAC (reusa imi.has_permission, sem novas permissões):
--   leitura  → dono da meta (user_id) OU metrics.read OU membro do projeto
--   gestão   → teams.manage (Gestor / Backoffice) OU super admin
--
-- Indicadores (calculados em app a partir de imi.proposals aprovadas):
--   realizado (VGV), nº de vendas, ticket médio, progresso (%), ranking.
--
-- Idempotente. Rodar APÓS 20260626_imi_auth_ecosystem.sql.
-- ============================================================================

-- ============================================================================
-- 1. TABELA
-- ============================================================================
CREATE TABLE IF NOT EXISTS imi.goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES imi.projects(id) ON DELETE CASCADE,
  scope        TEXT NOT NULL CHECK (scope IN ('team', 'individual')),
  team_id      UUID REFERENCES imi.teams(id) ON DELETE CASCADE,   -- quando scope='team'
  user_id      UUID REFERENCES imi.users(id) ON DELETE CASCADE,   -- quando scope='individual'
  title        TEXT,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  metadata     JSONB NOT NULL DEFAULT '{}',
  mock         BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Garante coerência do escopo.
  CONSTRAINT goals_scope_target CHECK (
    (scope = 'team' AND team_id IS NOT NULL) OR
    (scope = 'individual' AND user_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_imi_goals_project ON imi.goals(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_goals_team    ON imi.goals(team_id);
CREATE INDEX IF NOT EXISTS idx_imi_goals_user    ON imi.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_imi_goals_period  ON imi.goals(period_start, period_end);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_goals_updated_at ON imi.goals;
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON imi.goals
  FOR EACH ROW EXECUTE FUNCTION imi.set_updated_at();

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE imi.goals ENABLE ROW LEVEL SECURITY;

-- Leitura: o próprio corretor vê sua meta; metrics.read vê todas; membros do
-- projeto veem as metas do projeto (transparência da equipe).
DROP POLICY IF EXISTS "goals_read" ON imi.goals;
CREATE POLICY "goals_read" ON imi.goals FOR SELECT TO authenticated
  USING (
    user_id = imi.current_user_id()
    OR imi.has_permission('metrics.read', project_id)
    OR imi.has_permission('metrics.read')
    OR EXISTS (
      SELECT 1 FROM imi.project_users pu
      WHERE pu.project_id = goals.project_id AND pu.user_id = imi.current_user_id()
    )
  );

-- Gestão: Gestor de Equipe (teams.manage) / Backoffice / Super.
DROP POLICY IF EXISTS "goals_write" ON imi.goals;
CREATE POLICY "goals_write" ON imi.goals FOR ALL TO authenticated
  USING (imi.is_super_admin() OR imi.has_permission('teams.manage', project_id) OR imi.has_permission('teams.manage'))
  WITH CHECK (imi.is_super_admin() OR imi.has_permission('teams.manage', project_id) OR imi.has_permission('teams.manage'));

-- Limpeza de mock fica coberta por goals_write (gestor/super) e DELETE acima.

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE.
-- ============================================================================
