# PROJECT_STATE — Estado Vivo do Projeto

> LEIA PRIMEIRO em toda sessão. Atualize ao final de toda sessão. Máx ~60 linhas.

**Atualizado**: 2026-07-04 · **Branch base**: main @ a3dba7d

## Saúde (última medição 2026-07-03)

| Gate | Estado |
|---|---|
| type-check (`tsc --noEmit`) | ✅ limpo |
| lint (`next lint --quiet`) | ✅ limpo |
| jest | ✅ 869/874 (5 skipped, 62 suítes) |
| e2e | ✅ 7 specs / 84 testes (local/CI; fora do gate) |
| build Vercel | ✅ (tipos ignorados por design — D-07) |

## O que é este projeto

Plataforma imobiliária (Next.js 14 + Supabase) com 3 mundos: site público i18n (`/[lang]`), backoffice admin (`/backoffice`), console de corretores IMI (`/users`, schema `imi`). 275 rotas de API. Empreendimentos-chave: Alto Bellevue, Miguel Marques, Jazz Boulevard.

## Trabalho recente (main)

- 2026-07-05 (branch `claude/imi-saas-platform-design-el33oi`, só docs): **Decisão CTO D-15 — Partner API v1**. Prompt externo de "API Platform" completa foi analisado e recusado no maximalismo; aprovada direção REST read-only + API key/escopos com evolução por gatilhos. Design: `docs/PARTNER_API_V1_DESIGN.md`. **Implementação aguarda aprovação do dono** (migration `partner_api_keys` + modelo comercial).
- 2026-07-04 (hotfix produção, FX-10): **/imoveis vazio corrigido** — select do #334 pedia `cover_video_url`, coluna nunca aplicada em produção (migration manual jazz executada parcialmente) → 42703 → catálogo público inteiro no empty state "Portfólio em Curadoria". Coluna aplicada via MCP (site voltou na hora) + migration versionada `20260704_add_cover_video_url.sql` + fallback `CORE_SELECT` na página.
- 2026-07-04 (Supreme Vision): **Descoberta por Intenção** na /inteligencia — motor client-side `intentEngine.ts` (parser pt-BR + ranking nacional + explicação com percentil), seção `IntentDiscovery` no dashboard, 10 testes, verificação visual Playwright (desktop/mobile). #346 plano 4 fases merged; #347 triagem TODOs ("662" era falso positivo; −279 linhas de shims mortos) merged; #349 fix @deprecated formatBRL merged.

- 2026-07-03 (branch refinement): infra E2E Playwright (fixtures + 5 specs novos, 84 testes), fixes do engine de mapa AB (camadas/fullscreen/erro/leak), sync real do carrinho entre instâncias (useLotCart), Jazz: lang no back-link, unidades hidden fora do DOM, Escape nos painéis, **WhatsApp placeholder da LP corrigido (conversão)**
- 2026-07-03 (#344, main): Fase 1 mapas — satélite do console unificado no canônico (clamp z≤18), pinch com pivot correto + two-finger pan, status de lotes "ao vivo" real (polling 45s), PropertyMap sem singleton de módulo, touch targets ≥44px
- #342 fix botão proposta/sticky bar + carrinho entre vistas de mapa
- #341/#339 proposta no mapa, anexos, satélite
- #340 APIs brasileiras (ViaCEP, BrasilAPI, ReceitaWS, Brapi)
- #338 proposta: estado civil, cônjuge, checklist docs
- 2026-07-02: criado sistema de inteligência (`docs/` 17 arquivos + `.memory/`)

## Banco (verificado via MCP 2026-07-02) — sem ação pendente
- RLS de `public.proposals`/`proposal_events`: **habilitada**; policies exigem `auth.uid()` → anon bloqueado. F-09 anônimo **não era explorável** (correção de severidade).
- **K-13 LIMPO**: 0 tabelas `public` com RLS off.
- Migration segura APLICADA (`proposal_events` + colunas de tracking). A versão que reescrevia policies foi descartada (proposals não tem `tenant_id`).

## Pendências quentes (topo da fila)
0. **AÇÃO DO DONO — D-15**: aprovar (ou não) a Fase 1 da Partner API v1 (`docs/PARTNER_API_V1_DESIGN.md`): migration `partner_api_keys` + auth por chave + quem recebe chave (piloto Mano Imóveis).
1. **T-07**: DOMPurify nos 13 `dangerouslySetInnerHTML` (verificação por uso).
2. Upgrade Next/next-pwa (altas de `npm audit` de produção) → depois subir gate do CI para `high`.
3. **F-11 (informativo)**: policies de proposals são org-wide (sem tenant). By-design hoje; revisitar se virar multi-tenant.
Fila completa: `docs/TODO_MASTER.md`.

✅ Feitos 2026-07-02 (PR #343): F-01, F-02, RL credenciais+públicas, lint gate CI, gate `npm audit` prod-crítico (D-10), MotionProvider, deps mortas, DEPENDENCY_GRAPH, **F-09 (app token-auth + migration de colunas aplicada; severidade corrigida)**, **T-08 X-Frame-Options escopado**, **T-24 xlsx→exceljs**, **K-13 auditoria RLS (limpo)**.

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
