# ARCHITECTURE_DECISIONS — Índice de Decisões Arquiteturais

> Índice compacto para agentes. Texto completo: `docs/DECISION_LOG.md` (+ `docs/adr/`).

| ID | Decisão | Consequência operacional |
|---|---|---|
| D-01 | Pacotes internos `@imi/*` via alias webpack (não workspaces) | não criar package.json neles; tsc cobre via paths |
| D-02 | Rate limit em Upstash Redis, fallback in-memory dev | não testar limites localmente e confiar |
| D-03 | Joins RLS = duas queries simples (não embed) | padrão obrigatório em código novo |
| D-04 | RBAC IMI duplicado intencionalmente (SQL seed ↔ rbac.ts) | mudou um ⇒ mudar o outro no mesmo PR |
| D-05 | Locale por geo-IP Vercel → Accept-Language → pt | testes simulam `x-vercel-ip-country` |
| D-06 | PWA NetworkFirst para `/users/*` | nunca regredir p/ CacheFirst |
| D-07 | Type-check fora do build Vercel (OOM) — gate no CI | job `typecheck` é intocável |
| D-08 | Sistema de inteligência docs/ + .memory/ (2026-07-02) | sessões começam por PROJECT_STATE.md |

## Suposições críticas (se quebrarem, muita coisa quebra)

1. Vercel popula `x-vercel-ip-country` (locale) e roda em gru1.
2. Supabase RLS está ativa em todas as tabelas expostas — service role é a única exceção controlada.
3. `20260317_production_unified_migration.sql` reflete o schema real de produção (baseline).
4. O domínio canônico é `iulemirandaimoveis.com.br` (CORS allowlist).
5. Plano Vercel Hobby: crons só diários (`cron/daily` orquestra o resto).
