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

## Pendências quentes (topo da fila) — AGUARDAM APROVAÇÃO DO DONO

1. 🔴 **T-23 / F-09 (ALTA, investigado)**: IDOR em `proposals/respond`+`track`. RLS de `public.proposals` **não habilitada** nas migrations → anon muta proposta por UUID. Fix = exigir token + `ENABLE ROW LEVEL SECURITY`. REQUER APROVAÇÃO (contrato público + migration). Verificação final: `SELECT relrowsecurity FROM pg_class WHERE relname='proposals'`.
2. **T-08**: unificar X-Frame-Options (recomendação pronta, aguarda ok).
3. **T-24**: substituir `xlsx` (vuln sem fix).
4. **K-13**: auditar RLS de todas as tabelas `public.*` com policy (mesmo bug do F-09 pode existir alhures).
Fila completa: `docs/TODO_MASTER.md`.
✅ Feitos 2026-07-02: F-01, F-02, RL credenciais+públicas, lint gate CI, gate `npm audit` prod-crítico (D-10), MotionProvider, deps mortas, DEPENDENCY_GRAPH.

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
