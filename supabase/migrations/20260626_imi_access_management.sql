-- ============================================================================
-- IMI AUTH ECOSYSTEM — ACCESS MANAGEMENT (first access + hierarchical reset)
-- Date: 2026-06-26 (complements the IMI auth ecosystem)
-- ----------------------------------------------------------------------------
-- • proposals.approve permission — lets a PROJECT_OWNER approve proposals and
--   see the numbers WITHOUT any user/team management rights.
-- • imi.can_manage_user(target) — authorization helper for password resets:
--     - super admins and holders of users.manage may reset anyone
--     - a TEAM_MANAGER may reset members of teams they manage
--   PROJECT_OWNER (Catel) is intentionally excluded → read/approve only.
--
-- Idempotent. Run AFTER 20260626_imi_auth_ecosystem.sql.
-- ============================================================================

-- ── 1. proposals.approve permission ─────────────────────────────────────────
INSERT INTO imi.permissions (key, module, action, description) VALUES
  ('proposals.approve', 'proposals', 'approve', 'Aprovar propostas')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

DO $$
DECLARE
  r RECORD; rid UUID; pid UUID;
BEGIN
  SELECT id INTO pid FROM imi.permissions WHERE key = 'proposals.approve';
  FOR r IN
    SELECT unnest(ARRAY['BACKOFFICE_ADMIN','TEAM_MANAGER','PROJECT_OWNER']) AS role_key
  LOOP
    SELECT id INTO rid FROM imi.roles WHERE key = r.role_key::imi.imi_role_key;
    IF rid IS NOT NULL AND pid IS NOT NULL THEN
      INSERT INTO imi.role_permissions (role_id, permission_id)
      VALUES (rid, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;
END$$;

-- ── 2. can_manage_user(target) authorization helper ─────────────────────────
-- True when the CURRENT user may administer (e.g. reset the password of) the
-- target imi.users.id.
CREATE OR REPLACE FUNCTION imi.can_manage_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = imi, public
AS $$
DECLARE
  caller UUID;
BEGIN
  SELECT id INTO caller FROM imi.users WHERE auth_user_id = auth.uid() LIMIT 1;
  IF caller IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins and users.manage holders (Iule = master) can manage anyone.
  IF imi.is_super_admin() OR imi.has_permission('users.manage') THEN
    RETURN true;
  END IF;

  -- A team manager can manage members of teams they manage (Mateus → his team).
  RETURN EXISTS (
    SELECT 1
    FROM imi.teams t
    JOIN imi.team_members tm ON tm.team_id = t.id
    WHERE t.manager_id = caller
      AND tm.user_id = target_user_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION imi.can_manage_user(UUID) TO authenticated;

-- ============================================================================
-- DONE. The API (/api/users/admin/reset-password) enforces the same rule and
-- performs the privileged password reset via the service role.
-- ============================================================================
