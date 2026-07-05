# DECISION_LOG — Registro de Decisões

> ADRs curtos. Formato: contexto → decisão → consequências. Decisões novas entram no topo.
> Complementa `docs/adr/` e `.memory/ARCHITECTURE_DECISIONS.md`.

---

## D-15 · 2026-07-05 — Partner API v1: REST read-only mínima, em vez de plataforma completa
- **Contexto**: prompt externo propôs transformar a IMI em "API Platform" completa (GraphQL + WebSocket + SSE, 18 motores, multi-tenant com domínio/branding, OAuth2, PostGIS/vector tiles/Cesium, marketplace/ERP). Realidade do repo: monólito de produção single-tenant (F-11), sem PostGIS, time de 1, incidente recente de drift de migration (FX-10), zero parceiros integrados hoje.
- **Decisão**: aceitar a tese (API-first, parceiro nunca toca o banco, IMI = fonte única da verdade) e rejeitar a arquitetura maximalista. Construir **Partner API v1**: superfície nova `/api/v1/*`, REST-only, read-only, API key com escopos (hash no banco, prefixo `imi_pk_…`), rate limit por chave (reusa D-09), ETag + CDN. GraphQL, realtime, multi-tenant, OAuth2, PostGIS/tiles: **adiados com gatilhos explícitos** de reavaliação. SDK/Redoc/Postman sempre **gerados** da spec OpenAPI. Design completo + fases: `docs/PARTNER_API_V1_DESIGN.md`.
- **Consequências**: Fase 1 exige 1 migration (`partner_api_keys`) e ~6 endpoints GET; **implementação gated em aprovação do dono** (auth/banco = aprovação explícita). Contrato público nunca expõe coluna crua (mappers `toPartner*()`). Piloto: Mano Imóveis. Expansão além da Fase 1 exige gatilho atingido + novo ADR.

## D-14 · 2026-07-04 — Motor de Descoberta por Intenção 100% client-side
- **Decisão**: o ranking por intenção da `/inteligencia` (`intentEngine.ts`) roda no cliente sobre o dataset nacional (Estimativa IMI): parser pt-BR por regex + normalização min-max + score ponderado. Sem API nova, sem custo por consulta, funciona em preview/offline.
- **Consequência**: quando houver fonte de dados de mercado real (Fase 2), o motor recebe o dataset por props/fetch sem mudar a interface (`rankByIntent(intents, dataset)`); o parser pode ser trocado por IA mantendo `parseIntent()` como contrato.

## D-13 · 2026-07-02 — Migração de parsing de planilha para adapter (xlsx→ExcelJS)
- **Contexto**: `xlsx` (SheetJS) com prototype pollution + ReDoS **sem patch** (F-08/T-24).
- **Decisão**: interface `SpreadsheetParser` (`src/lib/spreadsheet/`) com implementação ExcelJS; consumidores importam do índice, nunca do vendor. Limites anti-DoS (10MB, 100k linhas). `xlsx` removido.
- **Consequência**: troca futura de vendor = 1 arquivo. Comportamento preservado (readRows / readSheetsAsCsv). Anti-padrão: importar xlsx/exceljs direto.

## D-12 · 2026-07-02 — X-Frame-Options escopado, fonte única (T-08)
- **Contexto**: middleware DENY vs next.config SAMEORIGIN → header duplicado/ambíguo.
- **Decisão**: `X-Frame-Options` sai do middleware; definido só no `next.config.js` de forma escopada — `DENY` para `/backoffice|/users|/api|/auth|/login|/admin|/console`, `SAMEORIGIN` para públicas (negative-lookahead, sem sobreposição). CSP `frame-ancestors 'self'` continua a autoridade global.
- **Consequência**: nenhum header duplicado; áreas sensíveis mantêm a proteção máxima. Teste de regressão em `__tests__/middleware/frame-options.test.ts`.

## D-11 · 2026-07-02 — F-09: autorização de proposta pública por token + RLS
- **Contexto**: IDOR — `public.proposals` sem RLS habilitada; rotas públicas mutavam por UUID.
- **Decisão**: rotas públicas de proposta autorizam pelo **token secreto** validado no backend (service_role pós-validação — P15); migration habilita RLS (`ENABLE`+`FORCE`) com policies só para `authenticated` (tenant/owner) e nenhuma para anon.
- **Consequência**: UUID deixa de ser credencial. Página pública passa a usar `supabaseAdmin` (token-gated). Regra: rota pública sobre objeto = token, nunca id (A12).

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
