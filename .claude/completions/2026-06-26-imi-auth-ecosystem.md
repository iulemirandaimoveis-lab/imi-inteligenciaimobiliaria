# Completion — IMI Auth Ecosystem (foundation)

**Date**: 2026-06-26
**Branch**: `claude/imi-auth-ecosystem-vkig4w`

## What was built
Foundation of the IMI ecosystem auth + product architecture at `/users/login`, isolated from production.

- **DB**: `supabase/migrations/20260626_imi_auth_ecosystem.sql` — dedicated `imi` schema with users, roles, permissions, role_permissions, user_roles, projects, project_users, teams, broker_profiles, activity_logs; RLS on every table; `imi.has_permission()` / `current_user_id()` / `is_super_admin()`; seed of roles, permissions, role→permission map, and the Alto Bellevue project.
- **RBAC lib**: `src/lib/imi-auth/` — `rbac.ts` (roles/permissions, single source of truth), `types.ts`, `server.ts` (`getImiSession`, `requireImiSession`, `requirePermission`), `audit.ts`, plus client `session-context.tsx`.
- **Login** `/users/login` — premium split-screen: animated institutional hero (live availability / sales / proposals / metrics) + login card (email, senha, lembrar, Google, Microsoft, esqueci). Footer "Powered by IMI Intelligence Platform". `/users/forgot` + OAuth callback `/users/auth/callback`.
- **Dashboard** `/users/dashboard` — Alto Bellevue: KPIs (disponíveis, reservados, vendidos, VGV, corretores online, propostas abertas) + Equipe, Performance, Atividade recente, Pipeline comercial, Disponibilidade em tempo real.
- **Middleware**: additive `/users/*` protection (no change to existing behavior).
- **Seed**: `scripts/seed/imi-auth-seed-users.mjs` (auth users + RBAC assignments; nothing hardcoded in frontend).
- **Docs**: `docs/imi-auth-ecosystem.md`.

## Validation
- `tsc --noEmit`: 0 errors. `next lint`: clean. `next build`: success (exit 0); routes `/users`, `/users/login`, `/users/forgot`, `/users/dashboard`, `/users/auth/callback` emitted as dynamic.
- Production preserved: no changes to `/login`, `/backoffice`, `[lang]` (Alto Bellevue site), or existing `public.*` tables.

## Next phase
Wire commercial series (units/proposals/sales/pipeline) from `public.*` into `src/features/users/dashboard/data.ts`; add Supabase Realtime for the live cards. Apply migration + run seed in Supabase.
