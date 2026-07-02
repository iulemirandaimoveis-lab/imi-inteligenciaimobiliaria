# DECISION_LOG — Registro de Decisões

> ADRs curtos. Formato: contexto → decisão → consequências. Decisões novas entram no topo.
> Complementa `docs/adr/` e `.memory/ARCHITECTURE_DECISIONS.md`.

---

## D-10 · 2026-07-02 — Gate de segurança do CI escopado a produção
- **Contexto**: `npm audit` completo acusa 1 crítica + 19 altas, mas a crítica (`handlebars` via ts-jest) e muitas altas são toolchain de dev/test, sem exposição em runtime. Bloquear no total travaria o CI por ruído; ignorar tudo (`continue-on-error`) não protege.
- **Decisão**: job `security` bloqueia em `npm audit --omit=dev --audit-level=critical` (0 críticas em produção hoje) + step informativo da árvore completa. `build` continua `continue-on-error` (risco de OOM — D-07; já gated por typecheck).
- **Consequência**: nova crítica em dep de **produção** barra o PR; ruído de dev fica visível mas não trava. Reavaliar subir para `high` após tratar `xlsx`/`next-pwa` (T-24).

## D-09 · 2026-07-02 — Estratégia de rate limit diferenciada por classe de rota
- **Contexto**: cobertura irregular; endpoints de credencial sem proteção anti brute-force.
- **Decisão**: credenciais (login/first-access) = 5/min por IP; públicas com custo (WhatsApp/notificação) = 5/min por IP; públicas computacionais = `limiters.public` (10/10s); autenticadas = via `apiHandler`/`limiters.auth`; crons/webhooks = secret/assinatura (sem RL).
- **Consequência**: P14 em KNOWN_PATTERNS; teste anti brute-force em `auth-login.test.ts` vira contrato.

## D-08 · 2026-07-02 — Sistema de inteligência de projeto em `/docs` + `/.memory`
- **Contexto**: conhecimento disperso em 40+ MDs; redescoberta cara a cada sessão de IA.
- **Decisão**: 17 docs canônicos em `docs/` (mapa, auditorias, roadmap) + memória de agente em `.memory/`; docs antigos permanecem como histórico, os novos são a entrada.
- **Consequência**: toda sessão começa por `.memory/PROJECT_STATE.md`; docs têm dono e data.

## D-07 · (herdada) — Type-check fora do build Vercel
- **Contexto**: `tsc` OOM no build de 8GB do Vercel.
- **Decisão**: `ignoreBuildErrors: true` no build; gate real é o job `typecheck` do CI (bloqueante).
- **Consequência**: nunca remover o job de CI; build verde ≠ tipos verdes.

## D-06 · (herdada) — PWA NetworkFirst para `/users/*`
- **Contexto**: incidente "mapa não aparece" — SW servia HTML velho.
- **Decisão**: runtime caching NetworkFirst (timeout 5s) para o console; rewrite de `/{locale}/users` no middleware.
- **Consequência**: não regredir para CacheFirst nessas rotas.

## D-05 · (herdada) — Locale por geo-IP com fallback Accept-Language
- **Decisão**: `x-vercel-ip-country` → mapa país→locale → Negotiator → `pt`.
- **Consequência**: testes de locale precisam simular o header da Vercel.

## D-04 · (herdada) — RBAC IMI espelhado em constantes TS
- **Decisão**: `src/lib/imi-auth/rbac.ts` espelha o seed SQL (20260626) — frontend decide sem round-trip.
- **Consequência**: mudou papel/permissão no banco ⇒ atualizar rbac.ts no MESMO PR.

## D-03 · 2026-06-27 — Duas queries simples em vez de embed PostgREST
- **Contexto**: embed aninhado (`project_users → projects`) retornava `null` silencioso sob RLS/schema-cache.
- **Decisão**: `getImiSession` usa leituras separadas (ids → linhas).
- **Consequência**: padrão para joins sensíveis a RLS em todo código novo.

## D-02 · (herdada) — Upstash Redis para rate limit
- **Decisão**: `@upstash/ratelimit` serverless-safe; fallback in-memory só em dev.
- **Consequência**: limites são por instância em dev — não confiar em teste local de RL.

## D-01 · (herdada) — Pacotes internos por alias webpack, não workspaces
- **Decisão**: `@imi/*` resolvidos via `config.resolve.alias` no next.config.js.
- **Consequência**: não publicáveis; `tsc` os cobre pelo path mapping; não adicionar package.json próprio neles sem migrar para workspaces de verdade.

---
**Regra**: mudança arquitetural sem entrada aqui = PR incompleto.
