# SECURITY_AUDIT — Auditoria de Segurança

> Auditoria estática de 2026-07-02 (sem pentest dinâmico). Formato: achado → causa → impacto → prioridade → recomendação.

---

## Resumo Executivo

Postura geral **boa**: middleware com security headers + CORS allowlist, CSP definida, crons protegidos por `CRON_SECRET`, rate limit distribuído (Upstash), RLS no Supabase, cliente admin isolado em `src/lib/supabase/admin.ts`, rotas amostradas fazem auth→403 de tenant. Os achados abaixo são correções pontuais, não redesenho.

## Achados

### F-01 — Senha temporária fraca no reset administrativo · ✅ **CORRIGIDO 2026-07-02**
- **Onde**: `src/app/api/admin/reset-password/route.ts` → era `randomBytes(3)` (~24 bits).
- **Fix aplicado**: `randomBytes(12).toString('base64url')` (16 chars, ~96 bits) + `must_reset_password` força troca. Ambos os endpoints de first-access agora têm rate limit por IP (5/min).

### F-02 — `getSession()` usado para autorização · ✅ **CORRIGIDO 2026-07-02**
- **Varredura completa**: só existiam 4 usos em `src/app/api` + `src/lib`. Todos corrigidos:
  `admin/reset-password` e `auth/set-password` → `getUser()`; os proxies `parse-property-book` e `enrich-developer-properties` → autorizam via `getUser()` e usam `getSession()` apenas para encaminhar o `access_token` à Edge Function (uso legítimo).
- **Regra permanente**: `getUser()` para decisões de acesso (anti-padrão A1).

### F-03 — `X-Frame-Options` inconsistente · **BAIXA**
- **Onde**: middleware envia `DENY` (rotas api/backoffice/users); `next.config.js` envia `SAMEORIGIN` global; CSP tem `frame-ancestors 'self'`.
- **Impacto**: sem furo real (o mais restritivo prevalece por header duplicado ser indefinido entre proxies), mas é ambiguidade evitável.
- **Recomendação**: escolher `frame-ancestors` como fonte única; alinhar os dois pontos para `SAMEORIGIN`.

### F-04 — CSP com `'unsafe-inline'` em `script-src` · **MÉDIA (aceitável hoje)**
- **Causa**: restrição prática do Next.js sem nonces.
- **Recomendação**: migrar para nonce/strict-dynamic quando subir para Next 15; registrar como dívida, não corrigir às pressas.

### F-05 — Cobertura de rate limiting · **REVISADO 2026-07-02 — parcialmente corrigido**
- **Correção da auditoria**: `contact` e `consultation` JÁ tinham rate limit (falso positivo original). Além disso, o wrapper `apiHandler` (`src/lib/api-helpers.ts`) aplica **auth + rate limit por padrão** em todas as rotas que o usam (avaliacoes, pix, plantao/*, frota/*, developments, financeiro…) — a cobertura real era muito maior que 11 rotas.
- **Fix aplicado 2026-07-02** (rotas que de fato estavam sem proteção): `auth/login`, `auth/first-access`, `users/auth/first-access` (5/min por IP — anti brute-force), `lots/proposal` (5/min — dispara WhatsApp), `intelligence/simulate` (público computacional), `proposals/respond` (10/min).
- **Pendente**: triagem das rotas restantes sem `apiHandler` (`tracker/qrcode`, `analytics/vitals`, `webhooks/instagram`, `proposals/track`, `propostas/[token]/track`) — ver T-02b no TODO_MASTER.

### F-09 — IDOR em `proposals/respond` (e `proposals/track`) · ✅ **CORRIGIDO 2026-07-02 (aprovado)** 🔴→🟢
**Fase A (app) + Fase B (migration) aplicadas. Ver commit da sessão 4.**

**Correções:**
- `proposals/respond` e `proposals/track` reescritos: autorização pelo **token secreto** (`z.string().min(16)`), lookup por `token` via `supabaseAdmin`, `proposal_id` do cliente **não é mais aceito**. Validam expiração (410), estado respondável (409), token inválido (403). Rate limit mantido.
- `src/app/p/[token]/page.tsx` migrado para `supabaseAdmin` (autorizado pelo token) — necessário porque a Fase B habilita RLS e o cliente anônimo deixaria de ler/escrever.
- Client `PropostaPublicaClient.tsx` envia `token` (não `proposal_id`).
- **Migration `20260702_f09_proposals_rls_hardening.sql`** (requer aplicação no banco): `ENABLE`+`FORCE ROW LEVEL SECURITY` em `public.proposals` e `public.proposal_events`; policies escopadas por tenant/owner só para `authenticated`; **sem policy para anon** (rota pública usa service_role pós-token). Adiciona colunas `time_on_page_seconds`/`device_type` (drift). Colunas de evento alinhadas a `ip_address`.
- **Testes de contrato** (`__tests__/api/proposals-respond.test.ts`, 8 casos): token válido/ausente/curto/inválido/expirado/replay(estado terminal)/countered-sem-payload/rate-limit → 200/400/403/410/409/429.
- **⚠️ Ação do dono**: aplicar a migration no banco e rodar as queries de verificação (`relrowsecurity=true`; anon não faz UPDATE).

---
**Registro histórico da investigação (mantido para rastreabilidade):**

#### Fluxo rastreado (frontend → banco)
1. `src/app/p/[token]/page.tsx` (Server Component) carrega a proposta por **token** (`.eq('token', params.token)`) — o token é o segredo (16 bytes hex, `gen_random_bytes`). ✅ correto.
2. Passa `proposalId` (UUID **não-secreto**) ao client `PropostaPublicaClient.tsx`.
3. Ao aceitar/contrapor, o client chama `POST /api/proposals/respond` com **`proposal_id` (UUID), sem token**.
4. `src/app/api/proposals/respond/route.ts` usa o cliente server **anônimo** (`createClient`) e faz `UPDATE proposals SET status=... WHERE id = proposal_id` — **sem verificar ownership nem token**.

#### Evidência de banco (migrations)
- `public.proposals` tem policies `tenant_*_proposals` **todas `TO authenticated`** (`20260319_security_fixes.sql`).
- **NÃO existe `ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY` em nenhuma migration nem em `rls-policies.sql`/`rls_block8.sql`/`manual-schema.sql`.** Criar policy **não** habilita RLS.
- Corroboração comportamental: `page.tsx` e `proposals/track` fazem `UPDATE ... status='viewed'` com o **cliente anônimo** e o produto depende disso funcionar. Se a RLS estivesse ativa (só policies `authenticated`), o UPDATE anônimo afetaria 0 linhas e o "visualizado" quebraria — logo, na prática, **anon consegue escrever em `public.proposals`**.

#### Cenário de ataque
Um UUID de proposta vazado/adivinhado (aparece em links de tracking, logs, referers) permite a um agente anônimo: `POST /api/proposals/respond {proposal_id, action:'accepted'}` → marca proposta alheia como **aceita**, ou injeta **contraproposta** com valor arbitrário. `proposals/track` permite ainda poluir analytics/eventos.

#### Score
- **Impacto**: ALTO (integridade de negócio — estado comercial de propostas).
- **Explorabilidade**: MÉDIA-ALTA (precisa do UUID; sem token/auth/ownership; RLS aparentemente inativa). **CVSS estimado ~8.1 (High).**

#### Mitigação aplicada (parcial, sem aprovação)
- Rate limit por IP em `proposals/respond` (10/min) e docs. Reduz automação em massa; **não fecha o IDOR**.

#### Fix recomendado (REQUER APROVAÇÃO — muda contrato do front público)
1. **Curto prazo (app)**: `proposals/respond` e `proposals/track` passam a **exigir `token`** e validar server-side `token → proposal.id` (padrão já usado em `propostas/[token]/track`, que usa `supabaseAdmin` + `.eq('token', ...)`). O client já tem o token na URL — mudança pequena no front.
2. **Defesa em profundidade (banco, requer aprovação de migration)**: `ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY` + policy explícita de UPDATE anônimo restrita a transições válidas por token (ou mover a mutação pública para uma função `SECURITY DEFINER` que valida o token).
- **Rollback**: reverter o handler (aceitar `proposal_id` sem token) restaura o comportamento atual; nenhuma migration destrutiva.
- **Verificação pré-fix**: confirmar no banco `SELECT relrowsecurity FROM pg_class WHERE relname='proposals';` — se `false`, o IDOR está confirmado.

### F-10 — `proposals/track` confia em `proposal_id` cru · **MÉDIA** 🆕
- Mesma raiz do F-09 (insere `proposal_events` e faz `status sent→viewed` por UUID sem token). Impacto menor (poluição de analytics + avanço de status), mas corrige junto com F-09 exigindo token.

### F-03 (rev) — Conflito `X-Frame-Options` · **BAIXA — analisado (T-08)**
- Middleware envia `DENY` (api/backoffice/users); `next.config.js` envia `SAMEORIGIN` global; CSP tem `frame-ancestors 'self'` (o controle real e moderno).
- **Verificação**: nenhum `<iframe>` interno aponta para `/backoffice`, `/users` ou `/api` (os iframes do backoffice embarcam YouTube/Maps/previews — nós embarcando terceiros, não o contrário). Logo ninguém precisa emoldurar essas áreas same-origin.
- **Recomendação**: `frame-ancestors 'self'` já protege contra clickjacking em todo o site. Padronizar `X-Frame-Options` = `SAMEORIGIN` em ambos os pontos (remover o override `DENY` do middleware) elimina a duplicação/ambiguidade sem perder proteção. Baixo risco; **apresentado para aprovação** por tocar header de segurança.

### F-06 — `dangerouslySetInnerHTML` em 13 arquivos · **MÉDIA (verificação)**
- **Estado**: `isomorphic-dompurify` presente e usado em 7 arquivos; biblioteca/conteúdo e-book renderizam HTML de banco.
- **Ação**: verificação por uso — todo HTML originado de usuário/banco DEVE passar por DOMPurify; HTML estático de build pode ficar. Checklist em TODO_MASTER T-07.

### F-07 — Higiene de migrations e RLS · **MÉDIA**
- **Estado**: 12 prefixos duplicados, 3 esquemas de nomes (`supabase/MIGRATIONS_MAP.md`); histórico de policy RLS morta (auto-referência `pu.project_id = pu.id`, corrigida em 20260627).
- **Impacto**: drift entre ambientes; policies não testadas podem falhar silenciosamente (PostgREST devolve vazio, não erro).
- **Recomendação**: congelar nomenclatura `YYYYMMDD_`; criar teste de RLS por papel (ver TESTING_STRATEGY §RLS).

### F-08 — Gate de dependências · **PARCIALMENTE CORRIGIDO 2026-07-02 (T-03b)**
- **Estado do audit (2026-07-02)**: árvore completa = 36 vulns (1 crítica, 19 altas); **produção apenas (`--omit=dev`) = 0 críticas**, 15 altas, 13 moderadas.
- A crítica (`handlebars`) e várias altas vêm de **toolchain de teste/build** (ts-jest, jsdom, workbox/next-pwa, rollup-plugin-terser) — **não embarcadas no runtime**.
- **Fix aplicado**: job `security` do CI agora tem gate **bloqueante** em `npm audit --omit=dev --audit-level=critical` (passa hoje; barra novas críticas de produção) + audit informativo da árvore completa. Ver D-10.
- **Pendente**: as 15 altas de produção (destaque: `xlsx` — prototype pollution + ReDoS, **sem fix** disponível; usado só server-side via dynamic import em uploads de admin confiáveis) — avaliar substituir `xlsx` por `exceljs`/parser mais restrito (T-24). `next`/`next-pwa` altas → priorizar upgrade do Next (ver TECH_DEBT).

## Controles Confirmados (não regredir)

- HSTS preload, nosniff, Referrer-Policy, Permissions-Policy (camera/mic negados).
- CORS allowlist restrita + preflight correto.
- `CRON_SECRET` em todas as 9 rotas cron.
- Cliente service-role nunca importado em código com `'use client'` (varredura 2026-07-02: 3 suspeitas eram texto de UI).
- Secrets fora do repo (`.env.local` ignorado; exemplos com placeholders).

---
**Última atualização**: 2026-07-02 · Próxima revisão sugerida: ao tocar auth ou a cada 30 dias
