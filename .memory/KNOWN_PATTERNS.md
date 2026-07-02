# KNOWN_PATTERNS — Padrões e Anti-Padrões do Projeto

> Como este projeto faz as coisas. Seguir sempre; desviar exige entrada no DECISION_LOG.

---

## Padrões (fazer assim)

| # | Padrão | Referência canônica |
|---|---|---|
| P1 | Route handler: `createClient()` → `getUser()` → 401 → `limiters.X()` → 429 → zod → tenant/role → 403 → lógica | `src/app/api/ai/generate-content/route.ts` |
| P2 | `supabaseAdmin` só após sessão+role validados; nunca em client | `src/lib/supabase/admin.ts` (comentário de contrato) |
| P3 | Joins sensíveis a RLS: duas queries simples, nunca embed aninhado | `src/lib/imi-auth/server.ts` (D-03) |
| P4 | Libs pesadas: `await import()` | `src/lib/document-parser.ts` |
| P5 | Feature arriscada: flag + testes de isolamento + production-intact | `src/__tests__/digital-twin/*` |
| P6 | Toasts: sonner; ícones: lucide; animação: framer-motion | 140/563/uso dominante |
| P7 | Formulário: react-hook-form + zod resolver | `src/components/forms/` |
| P8 | Cards em grid: `h-full flex flex-col` + `mt-auto` nos CTAs | `.claude/UI_DESIGN_STANDARDS.md` §2 |
| P9 | Estado compartilhado entre vistas alternáveis vive no pai do alternador | lição PR #342 (carrinho) |
| P10 | Auditoria best-effort que nunca quebra o request (try/catch swallow) | `src/lib/imi-auth/audit.ts` |
| P11 | Cron: `Authorization: Bearer ${CRON_SECRET}` na primeira linha do handler | `src/app/api/cron/daily/route.ts` |
| P12 | Migration nova: `YYYYMMDD_descricao.sql` + atualizar `supabase/MIGRATIONS_MAP.md` | `supabase/MIGRATIONS_MAP.md` |

## Anti-Padrões (nunca)

| # | Anti-padrão | Por quê |
|---|---|---|
| A1 | `getSession()` para decidir autorização | não valida JWT no servidor (F-02) |
| A2 | CacheFirst para rotas autenticadas no PWA | incidente K-01 (mapa sumiu) |
| A3 | Embed PostgREST em tabela com RLS complexa | null silencioso (D-03) |
| A4 | Import estático de xlsx/mammoth/pdf-parse/remotion em rota comum | bundle/cold start |
| A5 | Segredo/AI key em código client | `.claude/COMMON_MISTAKES.md` #5 |
| A6 | `p-[13px]` e valores fora do grid 8pt | UI_DESIGN_STANDARDS §1 |
| A7 | Renomear migrations antigas | quebra histórico aplicado |
| A8 | Snapshot de árvore React como teste | frágil, não expressa comportamento |
| A9 | Nova lib de UI/estado/animação sem DECISION_LOG | proliferação (já há duplicatas) |
| A10 | Editar página monolítica sem screenshot antes/depois | regressão silenciosa (D-01) |

---
**Atualizado**: 2026-07-02
