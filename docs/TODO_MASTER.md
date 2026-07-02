# TODO_MASTER — Fila Única de Trabalho

> Fonte única de pendências acionáveis. Prioridade: P0 (agora) → P3 (quando tocar na área).
> Ao concluir: marcar, mover aprendizado para `.memory/LEARNINGS.md`, atualizar docs afetados.

---

## P0 — Segurança/risco imediato

- [x] T-01 ✅ 2026-07-02 Senha temporária: `randomBytes(12).toString('base64url')` — F-01
- [x] T-02 ✅ 2026-07-02 Rate limit aplicado: login, first-access (x2), lots/proposal, intelligence/simulate, proposals/respond. (`contact`/`consultation` já tinham — falso positivo da auditoria.)
- [ ] T-02b Triar rotas públicas restantes sem `apiHandler` — **triado 2026-07-02**: `tracker/qrcode` (auth Bearer ✅), `propostas/[token]/track` (por token via admin ✅), `analytics/vitals` (stub sem escrita ✅ — só falta RL), `webhooks/instagram`/`webhooks/whatsapp`/`webhooks/signature` (assinatura HMAC ✅), `proposals/track` → **F-10** (IDOR menor)
- [ ] T-23 🔴 **F-09 (ALTA, investigado)**: IDOR em `proposals/respond` + `proposals/track` — RLS de `public.proposals` **não está habilitada** nas migrations. Fix: exigir `token` (padrão de `propostas/[token]/track`) + `ENABLE ROW LEVEL SECURITY`. **REQUER APROVAÇÃO** (contrato público + migration). Evidência em SECURITY_AUDIT F-09.
- [ ] T-24 Substituir `xlsx` (prototype pollution + ReDoS, sem fix) por `exceljs` ou parser restrito — F-08. Uso: `src/lib/document-parser.ts` + `backoffice/imoveis/[id]/lotes`.

## P1 — Quick wins (baixo risco, ganho real)

- [x] T-03 ✅ 2026-07-02 `continue-on-error` removido do job lint no CI
- [x] T-03b ✅ 2026-07-02 (parcial) Job `security` agora bloqueia em `npm audit --omit=dev --audit-level=critical` (D-10). `build` fica non-blocking (OOM/D-07) — recomendação: manter.
- [x] T-04 ✅ 2026-07-02 `MotionProvider` (`MotionConfig reducedMotion="user"`) no layout raiz
- [x] T-05 ✅ 2026-07-02 `getSession()`→`getUser()` nas 4 ocorrências (varredura completa)
- [x] T-06 ✅ 2026-07-02 Removidos `jsonwebtoken`, `ua-parser-js` + @types
- [ ] T-07 Verificar os 13 usos de `dangerouslySetInnerHTML`: DOMPurify em todo HTML de banco/usuário — F-06
- [ ] T-08 Unificar `X-Frame-Options` (middleware DENY vs config SAMEORIGIN) — decidir comportamento de framing pretendido antes
- [x] T-09 ✅ N/A — o `<img>` sem alt era mock de teste (falso positivo da auditoria)

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
