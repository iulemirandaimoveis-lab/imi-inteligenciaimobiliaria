# PROJECT_STATE — Estado Vivo do Projeto

> LEIA PRIMEIRO em toda sessão. Atualize ao final de toda sessão. Máx ~60 linhas.

**Atualizado**: 2026-07-02 · **Branch base**: main @ 22ff0cf

## Saúde (última medição 2026-07-02)

| Gate | Estado |
|---|---|
| type-check (`tsc --noEmit`) | ✅ limpo |
| lint (`next lint --quiet`) | ✅ limpo |
| jest | ✅ 829/834 (5 skipped) |
| e2e | ⚠️ 2 specs, manual |
| build Vercel | ✅ (tipos ignorados por design — D-07) |

## O que é este projeto

Plataforma imobiliária (Next.js 14 + Supabase) com 3 mundos: site público i18n (`/[lang]`), backoffice admin (`/backoffice`), console de corretores IMI (`/users`, schema `imi`). 275 rotas de API. Empreendimentos-chave: Alto Bellevue, Miguel Marques, Jazz Boulevard.

## Trabalho recente (main)

- #342 fix botão proposta/sticky bar + carrinho entre vistas de mapa
- #341/#339 proposta no mapa, anexos, satélite
- #340 APIs brasileiras (ViaCEP, BrasilAPI, ReceitaWS, Brapi)
- #338 proposta: estado civil, cônjuge, checklist docs
- 2026-07-02: criado sistema de inteligência (`docs/` 17 arquivos + `.memory/`)

## ⚠️ Ação pendente DO DONO (não é código)
- **Aplicar a migration `supabase/migrations/20260702_f09_proposals_rls_hardening.sql`** no banco (habilita RLS em `public.proposals`/`proposal_events`). Sem isso, o F-09 fica protegido só pela camada de app (token) — que já fecha o IDOR, mas a defesa em profundidade só entra com a migration. Rodar depois: `SELECT relrowsecurity FROM pg_class WHERE relname IN ('proposals','proposal_events')` (esperar true).

## Pendências quentes (topo da fila)
1. **K-13**: auditar RLS de TODAS as tabelas `public.*` com policy (mesmo bug do F-09 pode existir alhures) — query em TESTING_STRATEGY §RLS.
2. **T-07**: DOMPurify nos 13 `dangerouslySetInnerHTML`.
3. Upgrade Next/next-pwa (altas de `npm audit` de produção) → depois subir gate do CI para `high`.
Fila completa: `docs/TODO_MASTER.md`.

✅ Feitos 2026-07-02 (PR #343): F-01, F-02, RL credenciais+públicas, lint gate CI, gate `npm audit` prod-crítico (D-10), MotionProvider, deps mortas, DEPENDENCY_GRAPH, **F-09 IDOR (app+migration+testes)**, **T-08 X-Frame-Options escopado**, **T-24 xlsx→exceljs**.

## Invariantes (NUNCA violar)

- Localização/tour do Alto Bellevue: não tocar (`.claude/ALTO_BELLEVUE_LOCATION.md`)
- Auth/billing/banco: só com aprovação explícita
- `/users/*` no PWA: NetworkFirst, nunca CacheFirst (D-06)
- Migrations novas: `YYYYMMDD_descricao.sql`; nunca renomear antigas
- `supabaseAdmin` exige sessão+role validados antes

## Mapa de leitura por tarefa

| Tarefa | Ler |
|---|---|
| Qualquer | este arquivo + `NEXT_TASK.md` |
| Nova rota API | `docs/API_MAP.md` |
| UI/layout | `docs/UI_SYSTEM.md` + `.claude/UI_REGRESSION_POLICY.md` |
| Bug estranho | `FAILURES.md` + `docs/COMPONENT_RELATIONS.md` |
| Arquitetura | `docs/ARCHITECTURE.md` + `ARCHITECTURE_DECISIONS.md` |
