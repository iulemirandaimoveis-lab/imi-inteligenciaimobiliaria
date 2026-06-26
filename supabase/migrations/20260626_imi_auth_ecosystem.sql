-- ============================================================================
-- IMI AUTH ECOSYSTEM — RBAC FOUNDATION
-- Date: 2026-06-26
-- ----------------------------------------------------------------------------
-- Builds the authentication + product architecture foundation for the IMI
-- ecosystem in an ISOLATED `imi` schema. This guarantees ZERO collision with
-- the existing production tables in `public` (public.teams, public.brokers,
-- public.profiles, public.developments already exist and MUST NOT be touched).
--
-- Architecture:
--   IMI Backoffice (central admin core)
--     ├── Produtos (empreendimentos: Alto Bellevue, Miguel Marques, ...)
--     └── Imobiliárias / Parceiros (equipes, corretores)
--
-- Entities (all under `imi` schema):
--   imi.users            — ecosystem user, linked 1:1 to auth.users
--   imi.roles            — RBAC roles (SUPER_ADMIN, BACKOFFICE_ADMIN, ...)
--   imi.permissions      — granular permission catalog
--   imi.role_permissions — role → permission mapping
--   imi.user_roles       — user → role assignment (optionally scoped to project)
--   imi.projects         — empreendimentos (products)
--   imi.project_users    — user ↔ project membership
--   imi.teams            — teams within a project
--   imi.broker_profiles  — broker-specific profile data
--   imi.activity_logs    — audit trail
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS imi;

-- Allow the standard Supabase roles to use the schema.
GRANT USAGE ON SCHEMA imi TO anon, authenticated, service_role;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imi_role_key') THEN
    CREATE TYPE imi.imi_role_key AS ENUM (
      'SUPER_ADMIN',
      'BACKOFFICE_ADMIN',
      'TEAM_MANAGER',
      'BROKER',
      'PROJECT_OWNER'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imi_user_status') THEN
    CREATE TYPE imi.imi_user_status AS ENUM ('invited', 'active', 'suspended', 'archived');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imi_project_status') THEN
    CREATE TYPE imi.imi_project_status AS ENUM ('draft', 'pre_launch', 'selling', 'sold_out', 'archived');
  END IF;
END$$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2.1 users -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  avatar_url   TEXT,
  phone        TEXT,
  status       imi.imi_user_status NOT NULL DEFAULT 'active',
  is_super     BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_users_auth ON imi.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_imi_users_email ON imi.users(lower(email));

-- 2.2 roles -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         imi.imi_role_key UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  scope       TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'project', 'agency')),
  is_system   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 permissions -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,        -- e.g. 'proposals.manage'
  module      TEXT NOT NULL,               -- e.g. 'proposals'
  action      TEXT NOT NULL,               -- e.g. 'manage'
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 role_permissions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES imi.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES imi.permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

-- 2.5 projects (empreendimentos) -------------------------------------------
CREATE TABLE IF NOT EXISTS imi.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  status      imi.imi_project_status NOT NULL DEFAULT 'selling',
  -- Optional link to the existing production developments table (kept loose
  -- on purpose to avoid a hard FK into public during the foundation phase).
  development_id UUID,
  city        TEXT,
  state       TEXT,
  cover_url   TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_projects_slug ON imi.projects(slug);

-- 2.6 user_roles (assignment, optionally scoped to a project) ---------------
CREATE TABLE IF NOT EXISTS imi.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES imi.roles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES imi.projects(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_imi_user_roles_user ON imi.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_imi_user_roles_project ON imi.user_roles(project_id);

-- 2.7 project_users (membership) -------------------------------------------
CREATE TABLE IF NOT EXISTS imi.project_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES imi.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,
  relation    TEXT NOT NULL DEFAULT 'member' CHECK (relation IN ('owner', 'manager', 'broker', 'member', 'partner')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_imi_project_users_project ON imi.project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_project_users_user ON imi.project_users(user_id);

-- 2.8 teams -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES imi.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  manager_id  UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_teams_project ON imi.teams(project_id);

-- 2.9 broker_profiles -------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.broker_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,
  team_id         UUID REFERENCES imi.teams(id) ON DELETE SET NULL,
  creci           TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 3.00,
  is_online       BOOLEAN NOT NULL DEFAULT false,
  bio             TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 activity_logs (audit) -----------------------------------------------
CREATE TABLE IF NOT EXISTS imi.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES imi.projects(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,               -- e.g. 'auth.login', 'proposal.create'
  entity      TEXT,                        -- e.g. 'proposal'
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_activity_user ON imi.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_imi_activity_project ON imi.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_activity_created ON imi.activity_logs(created_at DESC);

-- ============================================================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER — avoid RLS recursion)
-- ============================================================================

-- Resolve the imi.users.id for the currently authenticated auth.uid().
CREATE OR REPLACE FUNCTION imi.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = imi, public
AS $$
  SELECT id FROM imi.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- True if the current user is a super admin.
CREATE OR REPLACE FUNCTION imi.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = imi, public
AS $$
  SELECT COALESCE(
    (SELECT is_super FROM imi.users WHERE auth_user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- True if the current user holds `permission_key`, optionally within a project.
-- Wildcard '*' permission (granted to SUPER_ADMIN) always returns true.
CREATE OR REPLACE FUNCTION imi.has_permission(permission_key TEXT, p_project_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = imi, public
AS $$
DECLARE
  uid UUID;
  found BOOLEAN;
BEGIN
  SELECT id INTO uid FROM imi.users WHERE auth_user_id = auth.uid() LIMIT 1;
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins bypass everything.
  IF EXISTS (SELECT 1 FROM imi.users WHERE id = uid AND is_super = true) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM imi.user_roles ur
    JOIN imi.role_permissions rp ON rp.role_id = ur.role_id
    JOIN imi.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = uid
      AND (p.key = permission_key OR p.key = '*')
      AND (p_project_id IS NULL OR ur.project_id IS NULL OR ur.project_id = p_project_id)
  ) INTO found;

  RETURN COALESCE(found, false);
END;
$$;

GRANT EXECUTE ON FUNCTION imi.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION imi.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION imi.has_permission(TEXT, UUID) TO authenticated;

-- updated_at trigger ---------------------------------------------------------
CREATE OR REPLACE FUNCTION imi.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','projects','teams','broker_profiles'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON imi.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON imi.%1$s
       FOR EACH ROW EXECUTE FUNCTION imi.set_updated_at();', t);
  END LOOP;
END$$;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE imi.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.project_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.broker_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.activity_logs    ENABLE ROW LEVEL SECURITY;

-- Reference catalogs: any authenticated user may read.
DROP POLICY IF EXISTS "roles_read" ON imi.roles;
CREATE POLICY "roles_read" ON imi.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "roles_write" ON imi.roles;
CREATE POLICY "roles_write" ON imi.roles FOR ALL TO authenticated
  USING (imi.is_super_admin()) WITH CHECK (imi.is_super_admin());

DROP POLICY IF EXISTS "permissions_read" ON imi.permissions;
CREATE POLICY "permissions_read" ON imi.permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "permissions_write" ON imi.permissions;
CREATE POLICY "permissions_write" ON imi.permissions FOR ALL TO authenticated
  USING (imi.is_super_admin()) WITH CHECK (imi.is_super_admin());

DROP POLICY IF EXISTS "role_permissions_read" ON imi.role_permissions;
CREATE POLICY "role_permissions_read" ON imi.role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "role_permissions_write" ON imi.role_permissions;
CREATE POLICY "role_permissions_write" ON imi.role_permissions FOR ALL TO authenticated
  USING (imi.is_super_admin()) WITH CHECK (imi.is_super_admin());

-- users: read self; manage requires users.manage permission.
DROP POLICY IF EXISTS "users_read_self_or_admin" ON imi.users;
CREATE POLICY "users_read_self_or_admin" ON imi.users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR imi.has_permission('users.manage'));
DROP POLICY IF EXISTS "users_update_self_or_admin" ON imi.users;
CREATE POLICY "users_update_self_or_admin" ON imi.users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid() OR imi.has_permission('users.manage'))
  WITH CHECK (auth_user_id = auth.uid() OR imi.has_permission('users.manage'));
DROP POLICY IF EXISTS "users_admin_write" ON imi.users;
CREATE POLICY "users_admin_write" ON imi.users FOR ALL TO authenticated
  USING (imi.has_permission('users.manage')) WITH CHECK (imi.has_permission('users.manage'));

-- user_roles: read own; manage requires permissions.manage.
DROP POLICY IF EXISTS "user_roles_read" ON imi.user_roles;
CREATE POLICY "user_roles_read" ON imi.user_roles FOR SELECT TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('permissions.manage'));
DROP POLICY IF EXISTS "user_roles_write" ON imi.user_roles;
CREATE POLICY "user_roles_write" ON imi.user_roles FOR ALL TO authenticated
  USING (imi.has_permission('permissions.manage')) WITH CHECK (imi.has_permission('permissions.manage'));

-- projects: members read; managers/admins write.
DROP POLICY IF EXISTS "projects_read" ON imi.projects;
CREATE POLICY "projects_read" ON imi.projects FOR SELECT TO authenticated
  USING (
    imi.has_permission('projects.read')
    OR EXISTS (SELECT 1 FROM imi.project_users pu WHERE pu.project_id = id AND pu.user_id = imi.current_user_id())
  );
DROP POLICY IF EXISTS "projects_write" ON imi.projects;
CREATE POLICY "projects_write" ON imi.projects FOR ALL TO authenticated
  USING (imi.has_permission('projects.manage')) WITH CHECK (imi.has_permission('projects.manage'));

-- project_users / teams / broker_profiles: members read, admins write.
DROP POLICY IF EXISTS "project_users_read" ON imi.project_users;
CREATE POLICY "project_users_read" ON imi.project_users FOR SELECT TO authenticated
  USING (
    user_id = imi.current_user_id()
    OR imi.has_permission('projects.read')
    OR EXISTS (SELECT 1 FROM imi.project_users pu WHERE pu.project_id = project_users.project_id AND pu.user_id = imi.current_user_id())
  );
DROP POLICY IF EXISTS "project_users_write" ON imi.project_users;
CREATE POLICY "project_users_write" ON imi.project_users FOR ALL TO authenticated
  USING (imi.has_permission('projects.manage')) WITH CHECK (imi.has_permission('projects.manage'));

DROP POLICY IF EXISTS "teams_read" ON imi.teams;
CREATE POLICY "teams_read" ON imi.teams FOR SELECT TO authenticated
  USING (
    imi.has_permission('teams.read')
    OR EXISTS (SELECT 1 FROM imi.project_users pu WHERE pu.project_id = teams.project_id AND pu.user_id = imi.current_user_id())
  );
DROP POLICY IF EXISTS "teams_write" ON imi.teams;
CREATE POLICY "teams_write" ON imi.teams FOR ALL TO authenticated
  USING (imi.has_permission('teams.manage')) WITH CHECK (imi.has_permission('teams.manage'));

DROP POLICY IF EXISTS "broker_profiles_read" ON imi.broker_profiles;
CREATE POLICY "broker_profiles_read" ON imi.broker_profiles FOR SELECT TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('teams.read'));
DROP POLICY IF EXISTS "broker_profiles_write" ON imi.broker_profiles;
CREATE POLICY "broker_profiles_write" ON imi.broker_profiles FOR ALL TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('teams.manage'))
  WITH CHECK (user_id = imi.current_user_id() OR imi.has_permission('teams.manage'));

-- activity_logs: insert by any authenticated (their own actions); read needs audit.read.
DROP POLICY IF EXISTS "activity_logs_read" ON imi.activity_logs;
CREATE POLICY "activity_logs_read" ON imi.activity_logs FOR SELECT TO authenticated
  USING (user_id = imi.current_user_id() OR imi.has_permission('audit.read'));
DROP POLICY IF EXISTS "activity_logs_insert" ON imi.activity_logs;
CREATE POLICY "activity_logs_insert" ON imi.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 5. SEED — roles, permissions, role_permissions, Alto Bellevue project
-- ============================================================================

-- 5.1 roles -----------------------------------------------------------------
INSERT INTO imi.roles (key, name, description, scope) VALUES
  ('SUPER_ADMIN',      'Super Administrador',   'Controle total do ecossistema IMI',          'global'),
  ('BACKOFFICE_ADMIN', 'Backoffice Admin',      'Gestão operacional do núcleo IMI',           'global'),
  ('TEAM_MANAGER',     'Gerente de Equipe',     'Gestão da equipe do empreendimento',         'project'),
  ('BROKER',           'Corretor',              'Corretor vinculado a empreendimento',        'project'),
  ('PROJECT_OWNER',    'Proprietário do Produto','Responsável proprietário do empreendimento', 'project')
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 5.2 permissions catalog ---------------------------------------------------
INSERT INTO imi.permissions (key, module, action, description) VALUES
  ('*',                    'system',       'all',     'Acesso irrestrito (super admin)'),
  ('users.manage',         'users',        'manage',  'Criar, editar e remover usuários'),
  ('permissions.manage',   'permissions',  'manage',  'Atribuir papéis e permissões'),
  ('projects.read',        'projects',     'read',     'Visualizar empreendimentos'),
  ('projects.manage',      'projects',     'manage',   'Criar e gerir empreendimentos'),
  ('teams.read',           'teams',        'read',     'Visualizar equipes'),
  ('teams.manage',         'teams',        'manage',   'Criar e gerir equipes'),
  ('availability.read',    'availability', 'read',     'Visualizar disponibilidade'),
  ('availability.manage',  'availability', 'manage',   'Gerir disponibilidade de unidades'),
  ('proposals.read',       'proposals',    'read',     'Visualizar propostas'),
  ('proposals.manage',     'proposals',    'manage',   'Registrar e gerir propostas'),
  ('leads.read',           'leads',        'read',     'Visualizar leads'),
  ('leads.manage',         'leads',        'manage',   'Gerir leads e clientes'),
  ('clients.manage',       'clients',      'manage',   'Cadastrar e gerir clientes'),
  ('sales.read',           'sales',        'read',     'Visualizar vendas'),
  ('sales.manage',         'sales',        'manage',   'Registrar e gerir vendas'),
  ('metrics.read',         'metrics',      'read',     'Visualizar métricas e desempenho'),
  ('crm.manage',           'crm',          'manage',   'Gerir CRM'),
  ('audit.read',           'audit',        'read',     'Visualizar auditoria'),
  ('logs.read',            'logs',         'read',     'Visualizar logs do sistema')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- 5.3 role_permissions mapping ---------------------------------------------
-- Helper: map a role to a set of permission keys (idempotent).
DO $$
DECLARE
  r RECORD;
  perm_keys TEXT[];
  pk TEXT;
  rid UUID;
  pid UUID;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('SUPER_ADMIN',      ARRAY['*']),
      ('BACKOFFICE_ADMIN', ARRAY[
        'users.manage','permissions.manage','projects.read','projects.manage',
        'teams.read','teams.manage','availability.read','availability.manage',
        'proposals.read','proposals.manage','leads.read','leads.manage','clients.manage',
        'sales.read','sales.manage','metrics.read','crm.manage','audit.read','logs.read']),
      ('TEAM_MANAGER',     ARRAY[
        'projects.read','teams.read','teams.manage','availability.read',
        'proposals.read','proposals.manage','leads.read','leads.manage','clients.manage',
        'sales.read','metrics.read']),
      ('BROKER',           ARRAY[
        'projects.read','availability.read','proposals.read','proposals.manage',
        'leads.read','leads.manage','clients.manage','sales.read']),
      ('PROJECT_OWNER',    ARRAY[
        'projects.read','teams.read','availability.read','proposals.read',
        'sales.read','metrics.read'])
    ) AS t(role_key, keys)
  LOOP
    SELECT id INTO rid FROM imi.roles WHERE key = r.role_key::imi.imi_role_key;
    perm_keys := r.keys;
    FOREACH pk IN ARRAY perm_keys LOOP
      SELECT id INTO pid FROM imi.permissions WHERE key = pk;
      IF rid IS NOT NULL AND pid IS NOT NULL THEN
        INSERT INTO imi.role_permissions (role_id, permission_id)
        VALUES (rid, pid)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END$$;

-- 5.4 Alto Bellevue project -------------------------------------------------
INSERT INTO imi.projects (slug, name, status, city, state)
VALUES ('alto-bellevue', 'Alto Bellevue', 'selling', 'Gravatá', 'PE')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================================
-- DONE. User accounts (auth.users + imi.users + assignments) are created by
-- the seed script: scripts/seed/imi-auth-seed-users.mjs (uses service role).
-- ============================================================================
