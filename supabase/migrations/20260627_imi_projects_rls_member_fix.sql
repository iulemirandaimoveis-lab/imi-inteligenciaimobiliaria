-- ============================================================================
-- Fix: imi.projects RLS — the "project member" read fallback never matched.
--
-- The original `projects_read` policy correlated the membership sub-query to
-- the WRONG column:
--
--     EXISTS (SELECT 1 FROM imi.project_users pu
--              WHERE pu.project_id = pu.id            -- ❌ self-reference
--                AND pu.user_id = imi.current_user_id())
--
-- `pu.project_id = pu.id` compares a project_users row's project_id to its own
-- primary key, which is essentially always false. The membership fallback was
-- therefore dead, leaving `imi.has_permission('projects.read')` as the only way
-- to read the table. Any future role without `projects.read` would silently see
-- an empty project list (and an empty Lot Map) despite a valid assignment.
--
-- This migration rewrites the policy so the sub-query correlates to the OUTER
-- `projects` row (`pu.project_id = projects.id`). The same latent self-reference
-- in `project_users_read` is corrected for completeness.
--
-- Strictly broadens read access to legitimate members; no existing access that
-- relied on `has_permission` is removed.
-- ============================================================================

-- imi.projects -------------------------------------------------------------
drop policy if exists projects_read on imi.projects;

create policy projects_read on imi.projects
  for select
  to authenticated
  using (
    imi.has_permission('projects.read')
    or exists (
      select 1
      from imi.project_users pu
      where pu.project_id = projects.id
        and pu.user_id = imi.current_user_id()
    )
  );

-- imi.project_users --------------------------------------------------------
-- (Original self-reference was harmless here because the `user_id` clause
--  already scoped rows to the caller, but we make the intent explicit.)
drop policy if exists project_users_read on imi.project_users;

create policy project_users_read on imi.project_users
  for select
  to authenticated
  using (
    user_id = imi.current_user_id()
    or imi.has_permission('projects.read')
    or exists (
      select 1
      from imi.project_users peer
      where peer.project_id = project_users.project_id
        and peer.user_id = imi.current_user_id()
    )
  );
