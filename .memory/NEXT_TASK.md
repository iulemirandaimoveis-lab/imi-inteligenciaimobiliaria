# NEXT_TASK — Próxima Tarefa

> Atualize ao encerrar cada sessão: o que vem a seguir, com contexto suficiente para começar frio.

**Atualizado**: 2026-07-02

## Próxima tarefa recomendada

**R-02 Quick wins (docs/REFACTOR_ROADMAP.md)** — lote único de baixo risco:

1. `src/app/api/admin/reset-password/route.ts`: `randomBytes(3)` → `randomBytes(9).toString('base64url')` e trocar `getSession()`→`getUser()` (T-01, parte de T-05).
2. `.github/workflows/ci.yml`: remover `continue-on-error: true` do job lint (T-03) — lint está limpo, custo zero.
3. Provider raiz: `MotionConfig reducedMotion="user"` (T-04).
4. `package.json`: remover `jsonwebtoken`, `ua-parser-js`, `@types/jsonwebtoken`, `@types/ua-parser-js` após `grep -rn` de confirmação (T-06).
5. Encontrar e corrigir o `<img>` sem alt: `grep -rn "<img " src --include="*.tsx" | grep -v "alt="` (T-09).

**Gates**: type-check + lint + jest antes do commit. Sem UI visual afetada exceto item 3 (verificar 1 página animada).

## Bloqueios/aguardando

- Aplicação de migrations no banco exige aprovação explícita do dono (regra CLAUDE.md).
- E2E no CI (T-10) depende de decisão: Supabase local vs mocks.

## Contexto que se perde fácil

- O job de CI `typecheck` é o único gate de tipos (build ignora) — nunca desativar.
- Lint passou limpo em 2026-07-02; se T-03 falhar no futuro é regressão nova, não histórico.
