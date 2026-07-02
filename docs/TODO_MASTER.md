# TODO_MASTER — Fila Única de Trabalho

> Fonte única de pendências acionáveis. Prioridade: P0 (agora) → P3 (quando tocar na área).
> Ao concluir: marcar, mover aprendizado para `.memory/LEARNINGS.md`, atualizar docs afetados.

---

## P0 — Segurança/risco imediato

- [ ] T-01 Fortalecer senha temporária no reset admin (`randomBytes(3)` → `randomBytes(9).toString('base64url')`) — SECURITY F-01
- [ ] T-02 Rate limit em `contact`/`consultation`/rotas públicas de escrita — F-05/K-07

## P1 — Quick wins (baixo risco, ganho real)

- [ ] T-03 Remover `continue-on-error` do job lint no CI (lint está limpo hoje) — D-05
- [ ] T-04 `MotionConfig reducedMotion="user"` no provider raiz — A-01
- [ ] T-05 Trocar `getSession()`→`getUser()` em decisões de autorização nas rotas — F-02
- [ ] T-06 Remover deps mortas `jsonwebtoken`, `ua-parser-js` (+ @types) — D-03
- [ ] T-07 Verificar os 13 usos de `dangerouslySetInnerHTML`: DOMPurify em todo HTML de banco/usuário — F-06
- [ ] T-08 Unificar `X-Frame-Options` (middleware vs next.config) — F-03
- [ ] T-09 Corrigir o único `<img>` sem `alt` — A-06

## P2 — Estruturais (planejar por sprint)

- [ ] T-10 E2E Playwright dos 3 fluxos críticos + `@axe-core/playwright`, no CI — R-05
- [ ] T-11 Lighthouse CI com `lighthouse-budget.json` nas 5 rotas-chave — R-07
- [ ] T-12 Investigar/remover `mapbox-gl` + limpar CSP — R-06
- [ ] T-13 Bundle analyzer: registrar top-10 rotas por peso em PERFORMANCE_REPORT — P-06
- [ ] T-14 Decompor `AltoBellevuePlanView.tsx` (primeiro alvo de R-01)
- [ ] T-15 Teste de RLS por papel (harness SQL ou pgTAP) — F-07
- [ ] T-16 Resolver os 5 testes skipped + teardown do worker Jest — K-02/K-03
- [ ] T-17 `npm audit` de alta severidade no CI semanal — F-08

## P3 — Ao tocar na área

- [ ] T-18 Migrar `<img>`→`next/image` nas páginas públicas restantes (45 ocorrências) — P-03
- [ ] T-19 Reduzir `: any` (102) e `eslint-disable` (200) nos arquivos tocados — TECH_DEBT
- [ ] T-20 Auditoria RTL do locale `ar` — RW-04/K-09
- [ ] T-21 Mover docs históricos da raiz para `docs/archive/` — D-04
- [ ] T-22 Consolidar heroicons→lucide, gsap→framer ao tocar — R-08

---
**Última atualização**: 2026-07-02
