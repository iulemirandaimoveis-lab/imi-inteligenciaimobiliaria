# TECH_DEBT — Dívida Técnica

> Inventário com métricas medidas em 2026-07-02. Política: reduzir ao tocar ("boy-scout rule"), nunca sprint de reescrita.

---

## Métricas de Higiene (baseline)

| Indicador | Valor | Meta 90 dias |
|---|---|---|
| `: any` explícitos | 102 | <60 |
| `eslint-disable` | 200 | <150 |
| TODO/FIXME/HACK | 49 | todos com issue ou removidos |
| `<img>` cruas | 45 | <20 (públicas primeiro) |
| `console.log` | 5 | 0 (usar Sentry/logger) |
| `@ts-ignore` | 1 | 0 |
| Testes skipped | 5 | 0 |

## Itens Estruturais

### D-01 · Páginas monolíticas (ALTA)
10+ arquivos de 50–160KB (`AltoBellevuePlanView`, `tracking/page`, `imoveis/[id]/editar`, `explorer`…). Custo: bundle, re-render, merge conflicts, risco de regressão. Plano: REFACTOR_ROADMAP R-01 (extração incremental por seção, começando pelo arquivo que for tocado a seguir).

### D-02 · Caos de nomenclatura de migrations (MÉDIA)
12 prefixos duplicados, 3 convenções. Baseline autoritativa: `20260317_production_unified_migration.sql`. Regra congelada: novas = `YYYYMMDD_descricao.sql`. Não renomear as antigas (quebraria histórico aplicado) — apenas documentar.

### D-03 · Deps mortas/duplicadas (BAIXA esforço, ganho real)
`jsonwebtoken`, `ua-parser-js` (0 usos), `mapbox-gl` (verificar). Duplicações: lucide+heroicons, framer+gsap, anthropic+google-ai. Ver DEPENDENCIES.md.

### D-04 · Documentação espalhada na raiz (BAIXA)
10+ arquivos MD na raiz (AUDITORIA_*, MAPA_LOTES_*, SPRINT_0…). Plano: mover para `docs/archive/` quando estáveis; raiz fica com README, CLAUDE.md, AGENTS.md, DEPLOY.md.

### D-05 · Lint sem gate (MÉDIA)
`continue-on-error: true` no CI + `ignoreDuringBuilds`. Como `next lint --quiet` hoje passa limpo, **ativar o gate custa zero** — remover `continue-on-error` do job. (Quick win.)

### D-06 · E2E raso (MÉDIA)
2 specs Playwright, não rodam no CI. Fluxos críticos sem rede de proteção: proposta, login IMI, mapa. Ver TESTING_STRATEGY.

### D-07 · Estado duplicado backoffice vs console (`/backoffice` vs `/users`) (OBSERVAR)
Dois mundos de RBAC (profiles.role vs schema `imi`). Convergência futura precisa de decisão de arquitetura — registrar quando surgir a demanda.

## Regras de Pagamento de Dívida

1. Tocou num arquivo monolítico → extraia ao menos uma seção/componente.
2. Tocou num arquivo com `any`/`eslint-disable` → resolva os que estiverem no diff.
3. Nova migration → convenção congelada; atualizar `MIGRATIONS_MAP.md`.
4. Nunca "sprint de refactor" sem feature junto — risco sem valor entregue.

---
**Última atualização**: 2026-07-02
