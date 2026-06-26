-- ============================================================================
-- IMI AUTH ECOSYSTEM — TEAM STRUCTURE + COMMISSION MODULE
-- Date: 2026-06-26 (complements 20260626_imi_auth_ecosystem.sql)
-- ----------------------------------------------------------------------------
-- Extends the isolated `imi` schema (zero collision with production public.*):
--   • imi.team_members      — real team membership join table
--   • imi.commission_rules  — commission rule definitions (per project / role)
--   • imi.commission_profiles — per-broker effective commission profile
--   • imi.commission_splits — company ↔ broker split definition
--   • imi.broker_commissions— computed commission ledger per sale (auditable)
--
-- Plus: new permissions (commissions.read / commissions.manage), role grants,
-- the "Alto Bellevue Premium Team" with real manager/owner/member links, and
-- an auto-calculation function for commissions on a sale.
--
-- Idempotent. Run AFTER 20260626_imi_auth_ecosystem.sql.
-- ============================================================================

-- ============================================================================
-- 1. TEAM MEMBERS (real membership, not just roster)
-- ============================================================================
CREATE TABLE IF NOT EXISTS imi.team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES imi.teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,
  team_role   TEXT NOT NULL DEFAULT 'member' CHECK (team_role IN ('manager', 'member', 'owner', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_imi_team_members_team ON imi.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_imi_team_members_user ON imi.team_members(user_id);

ALTER TABLE imi.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_read" ON imi.team_members;
CREATE POLICY "team_members_read" ON imi.team_members FOR SELECT TO authenticated
  USING (
    user_id = imi.current_user_id()
    OR imi.has_permission('teams.read')
    OR EXISTS (
      SELECT 1 FROM imi.teams t
      JOIN imi.project_users pu ON pu.project_id = t.project_id
      WHERE t.id = team_members.team_id AND pu.user_id = imi.current_user_id()
    )
  );
DROP POLICY IF EXISTS "team_members_write" ON imi.team_members;
CREATE POLICY "team_members_write" ON imi.team_members FOR ALL TO authenticated
  USING (imi.has_permission('teams.manage')) WITH CHECK (imi.has_permission('teams.manage'));

-- ============================================================================
-- 2. COMMISSION MODULE
-- ============================================================================

-- 2.1 commission_rules — definitions (scope: global / project / role / broker)
CREATE TABLE IF NOT EXISTS imi.commission_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  project_id    UUID REFERENCES imi.projects(id) ON DELETE CASCADE,
  -- NULL project_id = applies to all projects.
  base_rate     NUMERIC(5,2) NOT NULL DEFAULT 5.00,   -- total commission % of sale value
  company_share NUMERIC(5,2) NOT NULL DEFAULT 40.00,  -- % of commission kept by company
  broker_share  NUMERIC(5,2) NOT NULL DEFAULT 60.00,  -- % of commission to broker(s)
  active        BOOLEAN NOT NULL DEFAULT true,
  priority      INT NOT NULL DEFAULT 100,             -- lower = higher precedence
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_by    UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_comm_rules_project ON imi.commission_rules(project_id);

-- 2.2 commission_profiles — per-broker effective % (manager-defined override)
CREATE TABLE IF NOT EXISTS imi.commission_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES imi.projects(id) ON DELETE CASCADE,
  rule_id         UUID REFERENCES imi.commission_rules(id) ON DELETE SET NULL,
  broker_rate     NUMERIC(5,2),  -- overrides rule.broker_share for this broker (%)
  bonus_rate      NUMERIC(5,2) DEFAULT 0,  -- bonificação (%)
  target_amount   NUMERIC(14,2),           -- meta de vendas
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_imi_comm_profiles_user ON imi.commission_profiles(user_id);

-- 2.3 commission_splits — company ↔ broker (and co-broker) split per rule
CREATE TABLE IF NOT EXISTS imi.commission_splits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID REFERENCES imi.commission_rules(id) ON DELETE CASCADE,
  party         TEXT NOT NULL CHECK (party IN ('company', 'broker', 'co_broker', 'manager', 'team')),
  user_id       UUID REFERENCES imi.users(id) ON DELETE SET NULL, -- when party targets a specific user
  share_pct     NUMERIC(5,2) NOT NULL,  -- % of the commission pool
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_comm_splits_rule ON imi.commission_splits(rule_id);

-- 2.4 broker_commissions — computed ledger per sale (auditable history)
CREATE TABLE IF NOT EXISTS imi.broker_commissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES imi.projects(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES imi.users(id) ON DELETE SET NULL,  -- broker who earns
  rule_id        UUID REFERENCES imi.commission_rules(id) ON DELETE SET NULL,
  sale_reference TEXT,            -- e.g. unit / proposal id (loose link)
  sale_amount    NUMERIC(14,2) NOT NULL,
  commission_total NUMERIC(14,2) NOT NULL,  -- base_rate applied to sale_amount
  company_amount NUMERIC(14,2) NOT NULL,
  broker_amount  NUMERIC(14,2) NOT NULL,
  bonus_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'forecast' CHECK (status IN ('forecast', 'pending', 'approved', 'paid', 'cancelled')),
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ,
  metadata       JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_imi_broker_comm_user ON imi.broker_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_imi_broker_comm_project ON imi.broker_commissions(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_broker_comm_status ON imi.broker_commissions(status);

-- updated_at triggers
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['commission_rules','commission_profiles'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON imi.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON imi.%1$s
       FOR EACH ROW EXECUTE FUNCTION imi.set_updated_at();', t);
  END LOOP;
END$$;

-- ============================================================================
-- 3. RLS for commission tables
-- ============================================================================
ALTER TABLE imi.commission_rules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.commission_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.commission_splits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.broker_commissions  ENABLE ROW LEVEL SECURITY;

-- Rules / splits: read with commissions.read; write with commissions.manage.
DROP POLICY IF EXISTS "comm_rules_read" ON imi.commission_rules;
CREATE POLICY "comm_rules_read" ON imi.commission_rules FOR SELECT TO authenticated
  USING (imi.has_permission('commissions.read'));
DROP POLICY IF EXISTS "comm_rules_write" ON imi.commission_rules;
CREATE POLICY "comm_rules_write" ON imi.commission_rules FOR ALL TO authenticated
  USING (imi.has_permission('commissions.manage')) WITH CHECK (imi.has_permission('commissions.manage'));

DROP POLICY IF EXISTS "comm_splits_read" ON imi.commission_splits;
CREATE POLICY "comm_splits_read" ON imi.commission_splits FOR SELECT TO authenticated
  USING (imi.has_permission('commissions.read'));
DROP POLICY IF EXISTS "comm_splits_write" ON imi.commission_splits;
CREATE POLICY "comm_splits_write" ON imi.commission_splits FOR ALL TO authenticated
  USING (imi.has_permission('commissions.manage')) WITH CHECK (imi.has_permission('commissions.manage'));

-- Profiles: a broker reads their own; managers/admins read/write via permission.
DROP POLICY IF EXISTS "comm_profiles_read" ON imi.commission_profiles;
CREATE POLICY "comm_profiles_read" ON imi.commission_profiles FOR SELECT TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('commissions.read'));
DROP POLICY IF EXISTS "comm_profiles_write" ON imi.commission_profiles;
CREATE POLICY "comm_profiles_write" ON imi.commission_profiles FOR ALL TO authenticated
  USING (imi.has_permission('commissions.manage')) WITH CHECK (imi.has_permission('commissions.manage'));

-- Ledger: a broker sees their own commissions; managers/admins see all.
DROP POLICY IF EXISTS "broker_comm_read" ON imi.broker_commissions;
CREATE POLICY "broker_comm_read" ON imi.broker_commissions FOR SELECT TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('commissions.read'));
DROP POLICY IF EXISTS "broker_comm_write" ON imi.broker_commissions;
CREATE POLICY "broker_comm_write" ON imi.broker_commissions FOR ALL TO authenticated
  USING (imi.has_permission('commissions.manage')) WITH CHECK (imi.has_permission('commissions.manage'));

-- ============================================================================
-- 4. NEW PERMISSIONS + ROLE GRANTS
-- ============================================================================
INSERT INTO imi.permissions (key, module, action, description) VALUES
  ('commissions.read',   'commissions', 'read',   'Visualizar comissões'),
  ('commissions.manage', 'commissions', 'manage', 'Definir regras e percentuais de comissão')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

DO $$
DECLARE
  r RECORD; rid UUID; pid UUID; pk TEXT;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('BACKOFFICE_ADMIN', ARRAY['commissions.read','commissions.manage']),
      ('TEAM_MANAGER',     ARRAY['commissions.read','commissions.manage']),
      ('BROKER',           ARRAY['commissions.read']),
      ('PROJECT_OWNER',    ARRAY['commissions.read'])
    ) AS t(role_key, keys)
  LOOP
    SELECT id INTO rid FROM imi.roles WHERE key = r.role_key::imi.imi_role_key;
    FOREACH pk IN ARRAY r.keys LOOP
      SELECT id INTO pid FROM imi.permissions WHERE key = pk;
      IF rid IS NOT NULL AND pid IS NOT NULL THEN
        INSERT INTO imi.role_permissions (role_id, permission_id)
        VALUES (rid, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END$$;

-- ============================================================================
-- 5. AUTO-CALCULATION FUNCTION
-- ============================================================================
-- Resolve the effective rule for a (project, broker), compute the commission
-- split for a sale, and insert an auditable ledger row. Returns the new row id.
CREATE OR REPLACE FUNCTION imi.compute_commission(
  p_user_id    UUID,
  p_project_id UUID,
  p_sale_amount NUMERIC,
  p_sale_reference TEXT DEFAULT NULL,
  p_status     TEXT DEFAULT 'forecast'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = imi, public
AS $$
DECLARE
  v_rule        imi.commission_rules%ROWTYPE;
  v_profile     imi.commission_profiles%ROWTYPE;
  v_total       NUMERIC(14,2);
  v_broker_pct  NUMERIC(5,2);
  v_broker      NUMERIC(14,2);
  v_company     NUMERIC(14,2);
  v_bonus       NUMERIC(14,2);
  v_id          UUID;
BEGIN
  -- Most specific active rule: project-scoped first, then global, by priority.
  SELECT * INTO v_rule FROM imi.commission_rules
   WHERE active AND (project_id = p_project_id OR project_id IS NULL)
   ORDER BY (project_id IS NOT NULL) DESC, priority ASC
   LIMIT 1;

  IF v_rule.id IS NULL THEN
    -- Fallback default: 5% total, 60/40 broker/company.
    v_total := ROUND(p_sale_amount * 0.05, 2);
    v_broker_pct := 60;
  ELSE
    v_total := ROUND(p_sale_amount * v_rule.base_rate / 100.0, 2);
    v_broker_pct := v_rule.broker_share;
  END IF;

  -- Per-broker override + bonus.
  SELECT * INTO v_profile FROM imi.commission_profiles
   WHERE user_id = p_user_id AND (project_id = p_project_id OR project_id IS NULL) AND active
   ORDER BY (project_id IS NOT NULL) DESC LIMIT 1;

  IF v_profile.id IS NOT NULL AND v_profile.broker_rate IS NOT NULL THEN
    v_broker_pct := v_profile.broker_rate;
  END IF;

  v_broker := ROUND(v_total * v_broker_pct / 100.0, 2);
  v_company := v_total - v_broker;
  v_bonus := CASE WHEN v_profile.id IS NOT NULL AND v_profile.bonus_rate IS NOT NULL
                  THEN ROUND(p_sale_amount * v_profile.bonus_rate / 100.0, 2) ELSE 0 END;

  INSERT INTO imi.broker_commissions (
    project_id, user_id, rule_id, sale_reference, sale_amount,
    commission_total, company_amount, broker_amount, bonus_amount, status
  ) VALUES (
    p_project_id, p_user_id, v_rule.id, p_sale_reference, p_sale_amount,
    v_total, v_company, v_broker, v_bonus, p_status
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION imi.compute_commission(UUID, UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 6. SEED — Alto Bellevue Premium Team + default commission rule
-- ============================================================================
-- Team is created here (manager_id linked in the seed-users script once users
-- exist). Default commission rule: 5% total, 60% broker / 40% company.
DO $$
DECLARE
  v_project UUID;
BEGIN
  SELECT id INTO v_project FROM imi.projects WHERE slug = 'alto-bellevue';
  IF v_project IS NULL THEN RETURN; END IF;

  -- Team (manager_id set later by the seed script when Mateus exists).
  INSERT INTO imi.teams (project_id, name)
  SELECT v_project, 'Alto Bellevue Premium Team'
  WHERE NOT EXISTS (
    SELECT 1 FROM imi.teams WHERE project_id = v_project AND name = 'Alto Bellevue Premium Team'
  );

  -- Default commission rule for Alto Bellevue.
  INSERT INTO imi.commission_rules (name, project_id, base_rate, company_share, broker_share, priority)
  SELECT 'Alto Bellevue — Padrão', v_project, 5.00, 40.00, 60.00, 10
  WHERE NOT EXISTS (
    SELECT 1 FROM imi.commission_rules WHERE project_id = v_project AND name = 'Alto Bellevue — Padrão'
  );
END$$;

-- ============================================================================
-- DONE. The seed-users script links team_members, manager_id, multi-roles
-- (Iule = BROKER + BACKOFFICE_ADMIN + SUPER_ADMIN) and commission_profiles.
-- ============================================================================
