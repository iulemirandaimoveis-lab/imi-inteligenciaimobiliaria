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

1. Apply the migrations **in order**:
   - `supabase/migrations/20260626_imi_auth_ecosystem.sql` (schema, RBAC, Alto Bellevue project)
   - `supabase/migrations/20260626_imi_team_and_commissions.sql` (team_members, commission module, Premium Team, default rule)
2. Create the initial users (auth + RBAC + team + commission profiles) — **never hardcoded in the frontend**:

```bash
node scripts/seed/imi-auth-seed-users.mjs
# or with a fixed temp password:
node scripts/seed/imi-auth-seed-users.mjs --password 'Temp#2026'
```

Env required: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### 5.1 Users created (explicit confirmation)

Emails are deterministic: `firstname.lastname@iulemirandaimoveis.com.br` (accents stripped, spaces → `.`). Users are created in **`invited`** status with a **provisional password** (printed by the script, or fixed via `--password`) used **only to bootstrap first access** — each user sets their real password at **`/users/primeiro-acesso`** (mirrors the backoffice flow). No permanent password is ever distributed.

| Name | Email | Roles (RBAC) | Team role |
|------|-------|--------------|-----------|
| Mateus | mateus@iulemirandaimoveis.com.br | `TEAM_MANAGER` | **manager** |
| Catel | catel@iulemirandaimoveis.com.br | `PROJECT_OWNER` | **owner** |
| Iule Miranda | iule.miranda@iulemirandaimoveis.com.br | `BROKER` + `BACKOFFICE_ADMIN` + `SUPER_ADMIN` | member |
| João | joao@iulemirandaimoveis.com.br | `BROKER` | member |
| Allysson | allysson@iulemirandaimoveis.com.br | `BROKER` | member |
| Anderson | anderson@iulemirandaimoveis.com.br | `BROKER` | member |
| Fernandes | fernandes@iulemirandaimoveis.com.br | `BROKER` | member |
| Paulo | paulo@iulemirandaimoveis.com.br | `BROKER` | member |
| Lucas | lucas@iulemirandaimoveis.com.br | `BROKER` | member |
| Douglas | douglas@iulemirandaimoveis.com.br | `BROKER` | member |
| Gustavo | gustavo@iulemirandaimoveis.com.br | `BROKER` | member |

> **Iule Miranda** is a super admin holding three roles → full backoffice access: create/edit users, create teams, view all projects, configure commissions, view reports, total permissions (the `*` wildcard via `is_super`).

### 5.2 Team structure (real FK links)

```
Team: Alto Bellevue Premium Team   (imi.teams, project_id → Alto Bellevue, manager_id → Mateus)
  ├── Manager: Mateus
  ├── Owner:   Catel
  └── Members: Iule Miranda, João, Allysson, Anderson, Fernandes, Paulo, Lucas, Douglas, Gustavo
```

Membership is materialized in **`imi.team_members`** (`team_id`, `user_id`, `team_role`), not just a roster. `imi.teams.manager_id` and `project_id` are real FKs; brokers also get an `imi.broker_profiles` row linked to the team.

---

## 5b. Commission module

Migration `20260626_imi_team_and_commissions.sql` adds:

| Table | Purpose |
|-------|---------|
| `imi.commission_rules` | Rule definitions: `base_rate` (% of sale), `company_share` / `broker_share`, scope per project, priority |
| `imi.commission_profiles` | Per-broker effective `broker_rate`, `bonus_rate`, `target_amount` (manager-defined override) |
| `imi.commission_splits` | Company ↔ broker ↔ co-broker split per rule |
| `imi.broker_commissions` | Auditable ledger: one row per sale (forecast → pending → approved → paid), with company/broker/bonus amounts |

- **Permissions**: `commissions.read` (BROKER, PROJECT_OWNER, managers) and `commissions.manage` (BACKOFFICE_ADMIN, TEAM_MANAGER). RLS lets a broker see only their own ledger; managers/admins see all.
- **Auto-calculation**: `imi.compute_commission(user, project, sale_amount, ref, status)` resolves the most specific active rule + per-broker profile, computes the split, and inserts an auditable ledger row. Call it on each `LotSold` event.
- **Manager controls**: percentual base, percentual por corretor, percentual por empreendimento, split empresa/corretor, bonificações, metas.
- **Dashboard**: the **Comissões** module (gated by `commissions.read`) shows comissão prevista, recebida, projeção mensal, split empresa/corretor, e ranking — with a "Gestão" vs "Visualização" badge based on `commissions.manage`.

---

## 5c. Access management — first access + hierarchical reset

Passwords follow the **backoffice model**: nothing permanent is handed out; users
create their password on **first access**.

| Capability | Route / API | Who |
|------------|-------------|-----|
| First access (set own password) | `/users/primeiro-acesso` → `POST /api/users/auth/first-access` | any invited user (email + provisional senha) |
| Reset a user's access | `POST /api/users/admin/reset-password` | per `imi.can_manage_user()` (below) |
| Team & access panel | `/users/team` | `teams.read` (view); reset button only for managers |

**Hierarchical reset authorization** — `imi.can_manage_user(target)` (SECURITY DEFINER, enforced server-side):
- **Iule (master)** — `SUPER_ADMIN` / `users.manage` → reset **anyone**.
- **Mateus (gestor)** — `TEAM_MANAGER` → reset **members of teams he manages** (`imi.teams.manager_id = ele`).
- **Catel (PROJECT_OWNER)** — **no** user/team management: he holds `proposals.approve` + read/metrics only (aprova propostas e vê os números). Sees `/users/team` read-only, without the reset button.
- **Brokers** — no `teams.read`, so no access to the panel.

A reset re-arms first access: the target's status returns to `invited` with a new
provisional password (returned to the authorized admin to share), and they set a
new password again at `/users/primeiro-acesso`. Every reset is written to
`imi.activity_logs` (`auth.password_reset`).

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
