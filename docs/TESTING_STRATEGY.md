# TESTING_STRATEGY — Estratégia de Testes

> Estado 2026-07-03: 60 suítes Jest, 827 testes (822 ✅, 5 skipped), ~6s. E2E: 7 specs Playwright, 84 testes (fora do CI).

## Arquitetura E2E (2026-07-03)

- **Config**: `playwright.config.ts` — projetos `desktop` (Chrome 1440×900, todos os specs) e `mobile` (Pixel 7 touch, specs de página crítica). `PLAYWRIGHT_CHROMIUM_EXECUTABLE` aponta binário pré-instalado em sandboxes.
- **Fixtures**: `e2e/fixtures.ts` — `consoleErrors` (gate de zero erro de console primeiro-partido, com allowlist de ruído de terceiros), `expectNoHorizontalOverflow`, matriz `VIEWPORTS` (8 tamanhos, phone→ultrawide).
- **Specs**: `smoke`, `critical-flows` (legado), `alto-bellevue` (engine de mapa + invariante do link do Maps do cliente), `jazz-boulevard` (viewer de unidades, Escape, regressões de link/WhatsApp), `users-console` (fronteiras de auth sem credenciais), `responsive` (matriz viewport×página), `a11y` (nomes acessíveis, alt, rel, lang).
- **Modos de execução**: local (`npm run test:e2e`, sobe dev server — exige `.env.local`) ou remoto read-only (`npm run test:e2e:prod`). Todos os specs são não-mutantes (nenhum formulário submetido).
- **Limite conhecido**: fluxos autenticados/RBAC por papel exigem seeds dedicados (Supabase branch ou usuários de teste) — decisão de banco requer aprovação explícita do dono (invariante), então segue no backlog R-05/F-07.

---

## Pirâmide Atual vs Alvo

| Camada | Hoje | Alvo | Gap |
|---|---|---|---|
| Unit/integration (Jest+jsdom) | 57 suítes, forte em lib/ e schemas | manter | resolver 5 skipped |
| E2E (Playwright) | 2 specs, manual | 3 fluxos críticos no CI | R-05 |
| RLS/banco | 0 | teste por papel nas tabelas `imi` | F-07 |
| Visual regression | screenshots manuais (UI_REGRESSION_POLICY) | Playwright `toHaveScreenshot` nos mapas | P2 |
| A11y automatizada | 0 | axe nos specs E2E | A-04 |
| Performance | budget file órfão | Lighthouse CI | R-07 |

## O Que Está Bem Coberto (não regredir)

- Domínio: commissions, goals, proposals, lots availability (AB + MM), lotmap compare, notificações WhatsApp, schemas zod, cron follow-ups.
- Isolamento do digital twin (feature flag, production-intact) — **padrão de referência** para features arriscadas.

## Lacunas Priorizadas

1. **Fluxo de proposta ponta-a-ponta** (maior valor de negócio): mapa → carrinho → formulário → submit. E2E com Supabase local ou mock de rede. Incluir teste de **negação IDOR**: responder a proposta sem token válido → deve falhar (contrato do fix F-09).
2. **RLS**: para cada papel do `rbac.ts`, asserts de leitura/escrita permitida/negada nas tabelas `imi.*`. Falha de RLS hoje só aparece como "dados vazios" em produção. **🔴 Prioridade elevada (F-09)**: incluir teste que verifica `relrowsecurity=true` em TODAS as tabelas `public.*` com policies — descobrimos que `public.proposals` tem policies mas RLS possivelmente **não habilitada** (criar policy não habilita RLS). Query de auditoria: `SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid);` — qualquer linha com `relrowsecurity=false` é um buraco.
3. **Rotas de API**: handlers críticos (`admin/*`, `financeiro/*`) com testes de 401/403/429 — o padrão de segurança vira contrato.
4. **Middleware**: locale por geo-header, rewrites `/{locale}/users`, CORS — puro e testável em jsdom/node.

## Regras

1. Bug corrigido ⇒ teste que o reproduz no MESMO PR (+ entrada em `.memory/FAILURES.md`).
2. Feature de domínio (lib/) ⇒ unit tests obrigatórios; UI pura ⇒ E2E/screenshot quando crítica.
3. Não usar snapshots de árvore React (frágeis); preferir asserts de comportamento.
4. Testes com timers ⇒ `jest.useFakeTimers()` + cleanup (mata K-02).
5. CI: jest roda em 2 jobs (`src/__tests__` e intelligence engine em node) — novos testes de node puro vão no segundo.

## Comandos

```bash
npm test                    # tudo
npx jest path/to/file       # focado
npx playwright test         # e2e (sobe dev server sozinho)
npm run validate:lots       # integridade dos dados de lote
```

---
**Última atualização**: 2026-07-02
