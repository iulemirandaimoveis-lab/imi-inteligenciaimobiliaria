# ARCHITECTURE — Arquitetura Técnica

> Estado atual, decisões e restrições. Complementa `docs/PROJECT_MAP.md`.

---

## Stack

- **Framework**: Next.js 14 (App Router, `experimental.serverActions`), React 18, TypeScript 5.3 (strict via CI).
- **Dados**: Supabase (PostgreSQL + Auth + Storage + RLS). Schema público + schema `imi` (ecossistema de corretores).
- **Estilo**: Tailwind CSS 3.4 (+ forms, typography), tokens em `tailwind.config.ts` e `design-system/`.
- **IA**: `@anthropic-ai/sdk` (principal) + `@google/generative-ai` (1 ponto de uso).
- **Mapas**: MapLibre GL (`maplibre-gl`) — `mapbox-gl` está nas deps mas sem import direto (ver TECH_DEBT).
- **Vídeo**: Remotion (+ `@remotion/player`).
- **Animação**: Framer Motion (dominante), GSAP (1 ponto de uso).
- **Infra**: Vercel (região `gru1`), Sentry, Upstash Redis (rate limit), Resend (email), Evolution API (WhatsApp), web-push.
- **PWA**: `next-pwa` com worker customizado em `worker/`.

## Camadas de Roteamento (3 mundos)

1. **Site público i18n** — `src/app/[lang]/(website)`; middleware injeta locale por geo-IP (`x-vercel-ip-country`) → Accept-Language → `pt` default. Locales: pt, en, es, ja, ar.
2. **Backoffice** — `src/app/(backoffice)`; sem locale; sessão Supabase obrigatória.
3. **IMI Console** — `src/app/users`; sem locale; RBAC próprio no schema `imi` (`src/lib/imi-auth/rbac.ts`: SUPER_ADMIN, BACKOFFICE_ADMIN, TEAM_MANAGER, BROKER, PROJECT_OWNER → permissões granulares espelhando seed do banco).

O middleware (`src/middleware.ts`) é o ponto único de: locale, refresh de sessão (`updateSession`), security headers e CORS (allowlist `iulemirandaimoveis.com.br`).

## Supabase — Regra dos 3 Clientes (CRÍTICO)

| Cliente | Arquivo | Uso | RLS |
|---|---|---|---|
| Browser | `src/lib/supabase/client.ts` | Client Components | ✅ aplica |
| Server | `src/lib/supabase/server.ts` | Server Components / Route Handlers (cookies) | ✅ aplica |
| Admin | `src/lib/supabase/admin.ts` | **Apenas server-side**, service role, bypassa RLS | ❌ bypassa |

Regra: toda rota que usa `supabaseAdmin` DEVE antes validar sessão + role com o cliente server (padrão visto em `api/admin/reset-password`). ~123 arquivos referenciam admin/service-role — qualquer novo uso exige justificativa.

## Padrão de Route Handler

```
1. createClient() (server)            → sessão via cookies
2. supabase.auth.getUser()            → 401 se ausente
3. limiters.X(user.id)                → 429 (Upstash; fallback in-memory em dev)
4. Validação de corpo (zod em rotas novas)
5. Checagem de tenant/role            → 403
6. Lógica (+ supabaseAdmin só se necessário)
```

Crons (`/api/cron/*`) autenticam por `Bearer ${CRON_SECRET}`.

## Pacotes Internos (`packages/`)

Resolvidos por alias no `next.config.js` (não são workspaces npm):
`@imi/cad-generator`, `@imi/scene-adapter`, `@imi/property-metadata`, `@imi/domain`, `@imi/crm-adapter`, `@imi/templates` (+ `imi-spatial`). Motor CAD/geo para mapas de lotes (ver `docs/cad/`, `scripts/cad/geo`).

## PWA / Service Worker

- `/users/*`: **NetworkFirst** (timeout 5s) — decisão pós-incidente "mapa não aparece" causado por SW servindo HTML velho (ver `docs/AUDITORIA_CTO_2026-06.md` §1).
- Storage público Supabase: CacheFirst 7 dias; REST Supabase: NetworkFirst 5 min.
- Desabilitado em dev.

## Observabilidade

- Sentry client/server/edge (`instrumentation*.ts`, `sentry.*.config.ts`); plugins desativados sem `SENTRY_AUTH_TOKEN`.
- `@vercel/speed-insights`; endpoint `analytics/vitals`.

## Restrições Conhecidas (NÃO violar)

1. **Nunca** alterar URLs de localização/tour do Alto Bellevue (`.claude/ALTO_BELLEVUE_LOCATION.md`).
2. **Nunca** commitar `.env.local` ou secrets.
3. Auth, billing e banco só mudam com aprovação explícita (CLAUDE.md).
4. Build Vercel usa `ignoreBuildErrors`/`ignoreDuringBuilds` **por limite de memória** — o gate real de tipos é o job `typecheck` do CI. Não remover o job.
5. Migrations: novas migrations SEMPRE `YYYYMMDD_descricao.sql`; `20260317_production_unified_migration.sql` é a baseline autoritativa (ver `supabase/MIGRATIONS_MAP.md`).

## Fluxo de Deploy

`main` → CI (typecheck gate; lint `continue-on-error`; jest) → Vercel deploy (branch `youthful-fermi` habilitada em `vercel.json`), região gru1. `deploy.sh` para deploy manual.

---
**Última atualização**: 2026-07-02
