# IMI Auth Ecosystem — Foundation

> Authentication + product architecture foundation for the IMI ecosystem.
> Entry point: **`/users/login`**. Console root: **`/users/dashboard`**.
> Built in isolation — **does not touch production** (`/login`, `/backoffice`, the Alto Bellevue public site under `[lang]`).

---

## 1. Architecture

```
IMI Backoffice (núcleo central administrativo)
        │ controla
        ▼
┌─────────────────────┐      ┌──────────────────────────┐
│   Área Produto      │      │  Área Imobiliárias /      │
│  (empreendimentos)  │      │  Parceiros                │
│  • Alto Bellevue    │      │  • Parceiros              │
│  • Miguel Marques   │      │  • Equipes                │
│  • futuros          │      │  • Corretores            │
└─────────┬───────────┘      └────────────┬─────────────┘
          └──────────► núcleo IMI ◄────────┘
```

- **Backoffice** holds full control: users, permissions, projects, teams, audit, CRM, availability, proposals, sales, metrics, logs.
- **Área Produto** has limited autonomy: view availability, proposals, leads, sales, performance, linked team.
- **Área Imobiliária** has limited autonomy: view authorized projects, register proposals, register clients, follow sales.

Designed for **multi-tenant** growth (multiple projects, multiple agencies), **audit**, **notifications**, **CRM integration**, a **future API**, and **WebSocket** real-time updates.

---

## 2. Database — isolated `imi` schema

Everything lives under a dedicated Postgres schema **`imi`** so there is **zero collision** with existing production tables (`public.teams`, `public.brokers`, `public.profiles`, `public.developments` already exist).

Migration: `supabase/migrations/20260626_imi_auth_ecosystem.sql`

| Table                  | Purpose                                              |
|------------------------|------------------------------------------------------|
| `imi.users`            | Ecosystem user, linked 1:1 to `auth.users`           |
| `imi.roles`            | RBAC roles                                            |
| `imi.permissions`      | Granular permission catalog (`module.action`)        |
| `imi.role_permissions` | Role → permission mapping                             |
| `imi.user_roles`       | User → role (optionally scoped to a project)         |
| `imi.projects`         | Empreendimentos (products)                            |
| `imi.project_users`    | User ↔ project membership                             |
| `imi.teams`            | Teams within a project                                |
| `imi.broker_profiles`  | Broker-specific profile (CRECI, commission, online)  |
| `imi.activity_logs`    | Audit trail                                           |

### Helper functions (SECURITY DEFINER — avoid RLS recursion)
- `imi.current_user_id()` → resolves `imi.users.id` for `auth.uid()`
- `imi.is_super_admin()` → boolean
- `imi.has_permission(key text, project_id uuid default null)` → wildcard-aware RBAC check used by RLS

### RLS
Every table has RLS enabled. Reference catalogs (`roles`, `permissions`, `role_permissions`) are readable by any authenticated user; writes require `imi.is_super_admin()`. Operational tables gate reads on membership/permission and writes on the corresponding `*.manage` permission. `activity_logs` is insert-open (audit) and read-gated on `audit.read`.

---

## 3. RBAC

Single source of truth in TypeScript: `src/lib/imi-auth/rbac.ts` (mirrors the DB seed exactly).

### Roles
| Role               | Scope    | Summary                              |
|--------------------|----------|--------------------------------------|
| `SUPER_ADMIN`      | global   | Controle total (`*`)                 |
| `BACKOFFICE_ADMIN` | global   | Gestão operacional IMI               |
| `TEAM_MANAGER`     | project  | Gestão da equipe do empreendimento   |
| `BROKER`           | project  | Corretor                             |
| `PROJECT_OWNER`    | project  | Responsável proprietário             |

### Permission keys
`users.manage`, `permissions.manage`, `projects.read|manage`, `teams.read|manage`,
`availability.read|manage`, `proposals.read|manage`, `leads.read|manage`, `clients.manage`,
`sales.read|manage`, `metrics.read`, `crm.manage`, `audit.read`, `logs.read`, plus `*` (super).

### Enforcement layers
1. **RLS** (authoritative) — `imi.has_permission()` in policies.
2. **Server guards** — `requireImiSession()`, `requirePermission(key)` in `src/lib/imi-auth/server.ts`.
3. **Client UI** — `useImiSession().can(key)` / `.hasRole(role)` for conditional rendering only.

---

## 4. Routes & middleware

| Route                    | Access     | Notes                                  |
|--------------------------|------------|----------------------------------------|
| `/users/login`           | public     | Premium split-screen login             |
| `/users/forgot`          | public     | Password reset                         |
| `/users/auth/callback`   | public     | OAuth / magic-link PKCE exchange       |
| `/users` → `/users/dashboard` | protected | Redirect                          |
| `/users/dashboard`       | protected  | Alto Bellevue product dashboard        |

Middleware (`src/lib/supabase/middleware.ts`) protects `/users/*`, allowing only the public entry points above. Unauthenticated access to a protected route redirects to `/users/login?next=…`. Authenticated users hitting `/users/login` are bounced to the dashboard. **No existing middleware behavior was changed** — only an additive `/users` branch.

---

## 5. Seeding

1. Apply the migration (creates schema, tables, RLS, roles, permissions, role→permission map, and the Alto Bellevue project).
2. Create the initial users (auth + RBAC) — **never hardcoded in the frontend**:

```bash
node scripts/seed/imi-auth-seed-users.mjs
# or with a fixed temp password:
node scripts/seed/imi-auth-seed-users.mjs --password 'Temp#2026'
```

Initial roster seeded: **Mateus** (TEAM_MANAGER), **Catel** (PROJECT_OWNER), and brokers **Iule Miranda, João, Allysson, Anderson, Fernandes, Paulo, Lucas, Douglas, Gustavo** — all linked to Alto Bellevue. The script prints temporary credentials; users reset via `/users/forgot`.

Env required: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Design system

Tokens in `src/features/users/ui/tokens.ts`; primitives in `src/features/users/ui/primitives.tsx`.
Language: Apple HIG spacing + Linear/Stripe/Vercel restraint + discreet institutional luxury — deep navy canvas, a single gold accent, subtle glassmorphism, soft shadows, consistent radius, fluid micro-interactions. Self-contained (no theme import) so the console renders identically regardless of the surrounding app theme.

---

## 7. Wiring live data (next phase)

The dashboard team list reads live from `imi.project_users`; the commercial series
(units availability, proposals, sales, pipeline) are **representative placeholders** in
`src/features/users/dashboard/data.ts`, isolated behind a single function. Connect them to
the existing production tables (`public.proposals`, `public.lots` / availability, sales) and
add Supabase Realtime channels for the "tempo real" cards. The `live` flag already drives the
"Dados ao vivo" vs "Pré-visualização" badge.

---

**Last Updated**: 2026-06-26
