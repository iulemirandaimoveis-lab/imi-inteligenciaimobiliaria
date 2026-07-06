# PROJECT_STATE — Estado Vivo do Projeto

> LEIA PRIMEIRO em toda sessão. Atualize ao final de toda sessão. Máx ~60 linhas.

**Atualizado**: 2026-07-06 · **Branch base**: main @ b55d863

## Saúde (última medição 2026-07-03)

| Gate | Estado |
|---|---|
| type-check (`tsc --noEmit`) | ✅ limpo |
| lint (`next lint --quiet`) | ✅ limpo |
| jest | ✅ 889/894 (5 skipped, 64 suítes) |
| e2e | ✅ 7 specs / 84 testes (local/CI; fora do gate) |
| build Vercel | ✅ (tipos ignorados por design — D-07) |

## O que é este projeto

Plataforma imobiliária (Next.js 14 + Supabase) com 3 mundos: site público i18n (`/[lang]`), backoffice admin (`/backoffice`), console de corretores IMI (`/users`, schema `imi`). 275 rotas de API. Empreendimentos-chave: Alto Bellevue, Miguel Marques, Jazz Boulevard.

## Trabalho recente (main)

- 2026-07-06 (branch claude/imi-commission-reconciliation-eyng5a, PR draft): **conciliação
  de comissões IMI × Mano Imóveis** — estrutura completa pra confirmar repasses recebidos,
  conectando (ou deixando pronto pra conectar) as contas BTG PF/PJ da IMI. Migration nova
  (`20260706_commission_bank_reconciliation.sql`, **NÃO aplicada em produção** — pendência
  do dono) cria `bank_accounts`/`bank_transactions`/`commission_reconciliations`/
  `bank_oauth_tokens` (RLS, tokens sem nenhuma policy — só service role). Conector
  `src/lib/btg/` (OAuth2 client_credentials + Authorization Code + import CSV — caminho que
  funciona hoje sem depender da API). Motor de match por valor/data/documento
  (`src/lib/finance/matching.ts`). UI em `/backoffice/financeiro/comissoes`. **Acesso a
  developers.empresas.btgpactual.com bloqueado pela política de rede da sessão** — path
  exato do endpoint de extrato e nomes de campo não puderam ser confirmados na doc oficial,
  ficaram configuráveis via env var (ver `docs/BTG_INTEGRATION_GUIDE.md`). 27 testes novos,
  68 suítes/916 passed sem regressão. Detalhe: `.claude/completions/2026-07-06-conciliacao-comissoes-btg.md`.
- 2026-07-06 (branch claude/backoffice-recent-bugs-7zig1n, PR draft): **FX-11** — "Usuários não
  abre" + "foto sumiu". Causa: dono tem 2 contas (`iule@imi.com` e a profissional) e o admin
  máster não estava completo nos DOIS sistemas ao mesmo tempo (backoffice `profiles.role` vs
  console `imi.users.is_super`). `iule@imi.com` era admin no backoffice mas nem tinha linha em
  `imi.users`. Migration idempotente `20260706_owner_master_admin.sql` consolida `iule@imi.com`
  como admin máster dos dois sistemas + propaga a foto; foto copiada p/ a conta profissional.
  Aplicada em produção via MCP. Detalhe em FAILURES FX-11.
- 2026-07-06 (branch claude/frontend-refactor-design-gubdfu, PR draft): refino front-end
  "Apple/iOS" — mapa AB com gesto em GPU + momentum + hover tooltip + spotlight; console
  dashboard (fonte serif corrigida, safe-area, loading/error, a11y); backoffice (KPICard 10px,
  DataTable overflow-x consertado + sort por teclado); prefers-reduced-motion global.
  Pós-merge: validar pinch/pan em iPhone real.
- 2026-07-05 (Supreme Vision, 7 PRs em produção): funil proprietário completo — Descoberta por
  Intenção (#352), lotes reais por perfil (#354), motor híbrido com dados reais da
  neighborhood_intelligence (#356), deep-link ?lote= no explorador (#359), Match de Cliente no
  console /users/intelligence (#361). Motor em src/lib/intelligence/ (intent-engine + brazil-fallback).
  Padrão de verificação visual sem credenciais: dev server com env stub + Playwright (pegou 3 bugs).

- 2026-07-05 (D-15 aprovada pelo dono → **Fase 1 da Partner API v1 IMPLEMENTADA**): migration `partner_api_keys` aplicada em produção (RLS on+forced, 0 policies — verificado via MCP), `withPartnerAuth` (SHA-256 + escopos + RL 120/min por chave), 6 endpoints GET `/api/v1/*` (developments, lots, map GeoJSON do AB, availability com ETag/304 + overlay da planilha), OpenAPI 3.1, guia de integração, script de emissão de chave, 14 testes de contrato. Piloto: Mano Imóveis. Docs: `docs/PARTNER_API_V1_DESIGN.md` + `docs/api/`.
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
-1. **AÇÃO DO DONO — aplicar migration de conciliação de comissões**: `supabase/migrations/20260706_commission_bank_reconciliation.sql` está versionada mas **não aplicada em produção** (mudança de banco exige aprovação explícita). Depois de aplicar: ver `docs/BTG_INTEGRATION_GUIDE.md` pra conectar a conta BTG PJ (ou usar import de CSV, que já funciona sem migration adicional nenhuma além dessa).
0. **AÇÃO DO DONO — chave da Mano Imóveis**: rodar localmente `node scripts/partner/create-partner-key.mjs --name "Mano Imóveis" --scopes developments:read,lots:read,maps:read,prices:read` e enviar a chave por canal seguro (ela só aparece uma vez). Guia p/ o parceiro: `docs/api/PARTNER_API_GUIDE.md`.
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
