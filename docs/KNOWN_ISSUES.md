# KNOWN_ISSUES — Problemas Conhecidos (vivos)

> Registro operacional. Quando resolver: mover para `.memory/FAILURES.md` com causa-raiz e prevenção.
> IDs referenciados por SECURITY_AUDIT (F-xx), PERFORMANCE_REPORT (P-xx), TECH_DEBT (D-xx).

---

## Abertos

| ID | Problema | Sintoma | Causa-raiz | Impacto | Prioridade |
|---|---|---|---|---|---|
| K-01 | Cache de Service Worker serve versão velha do `/users` | "Mapa ainda não disponível…" mesmo com dados corretos | PWA + skipWaiting nem sempre auto-corrige em iOS | Cliente vê app quebrado | ALTA (mitigado: NetworkFirst) |
| K-02 | Jest: "worker process failed to exit gracefully" | aviso ao final da suíte | timers/handles sem teardown em algum teste | mascarará vazamentos futuros | BAIXA |
| K-03 | 5 testes skipped | `Tests: 5 skipped` | não investigado | cobertura fantasma | BAIXA |
| K-04 | Lint não bloqueia CI | job `lint` com `continue-on-error: true` | erros históricos de ESLint | regressões de qualidade passam | MÉDIA |
| K-05 | Build sem gate de tipos no Vercel | `ignoreBuildErrors: true` | OOM no type-check do Vercel | dependência total do job de CI | MÉDIA (aceito, documentado) |
| K-06 | Migrations com prefixos duplicados | ver `supabase/MIGRATIONS_MAP.md` | histórico sem convenção | drift entre ambientes | MÉDIA |
| K-07 | Rate limit ausente em rotas públicas de escrita | `contact`, `consultation` sem limiter | adoção incremental parou | spam/custo | MÉDIA (=F-05) |
| K-08 | Senha temporária de 6 hex no reset admin | — | `randomBytes(3)` | segurança | ALTA (=F-01) |
| K-09 | RTL não validado para locale `ar` | layout árabe possivelmente espelhado errado | i18n adicionou `ar` sem auditoria RTL | UX quebrada p/ árabe | BAIXA |
| K-10 | Headers X-Frame-Options divergentes | DENY (middleware) vs SAMEORIGIN (config) | duas fontes | ambiguidade | BAIXA (=F-03) |

## Resolvidos recentemente (referência rápida)

- Policy RLS morta em `imi.projects` (auto-referência) — corrigida em `20260627_imi_projects_rls_member_fix.sql`.
- Carrinho de proposta perdido ao alternar vistas de mapa — PR #342.
- Botão de envio de proposta escondido atrás da sticky bar — PR #342.
- `/pt/users/*` preso em cache de SW — rewrite no middleware (§0c2) + NetworkFirst.

Detalhes e prevenção: `.memory/FAILURES.md`.

---
**Última atualização**: 2026-07-02
