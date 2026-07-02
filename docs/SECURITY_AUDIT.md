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

### F-09 — `proposals/respond` muta proposta por ID cru, sem token · **ALTA (verificar)** 🆕
- **Onde**: `src/app/api/proposals/respond/route.ts` — aceita `proposal_id` + `action` sem autenticação nem token de acesso; aceita/contrapropõe qualquer proposta cujo UUID seja conhecido.
- **Mitigação hoje**: cliente server anônimo → depende 100% da RLS de `proposals` bloquear UPDATE anônimo. Se a RLS permitir (como o fluxo público sugere), qualquer um pode aceitar propostas alheias.
- **Fix aplicado (parcial)**: rate limit por IP.
- **Recomendação (REQUER DECISÃO)**: exigir o token da proposta (mesmo mecanismo de `propostas/[token]/track`) antes de mutar. Risco médio — muda contrato com o front público. Verificar a policy RLS de `proposals` no banco antes.

### F-06 — `dangerouslySetInnerHTML` em 13 arquivos · **MÉDIA (verificação)**
- **Estado**: `isomorphic-dompurify` presente e usado em 7 arquivos; biblioteca/conteúdo e-book renderizam HTML de banco.
- **Ação**: verificação por uso — todo HTML originado de usuário/banco DEVE passar por DOMPurify; HTML estático de build pode ficar. Checklist em TODO_MASTER T-07.

### F-07 — Higiene de migrations e RLS · **MÉDIA**
- **Estado**: 12 prefixos duplicados, 3 esquemas de nomes (`supabase/MIGRATIONS_MAP.md`); histórico de policy RLS morta (auto-referência `pu.project_id = pu.id`, corrigida em 20260627).
- **Impacto**: drift entre ambientes; policies não testadas podem falhar silenciosamente (PostgREST devolve vazio, não erro).
- **Recomendação**: congelar nomenclatura `YYYYMMDD_`; criar teste de RLS por papel (ver TESTING_STRATEGY §RLS).

### F-08 — Sem gate automatizado de dependências · **BAIXA**
- `npm audit`/Dependabot não estão no CI. Recomendação: job semanal `npm audit --omit=dev --audit-level=high`.

## Controles Confirmados (não regredir)

- HSTS preload, nosniff, Referrer-Policy, Permissions-Policy (camera/mic negados).
- CORS allowlist restrita + preflight correto.
- `CRON_SECRET` em todas as 9 rotas cron.
- Cliente service-role nunca importado em código com `'use client'` (varredura 2026-07-02: 3 suspeitas eram texto de UI).
- Secrets fora do repo (`.env.local` ignorado; exemplos com placeholders).

---
**Última atualização**: 2026-07-02 · Próxima revisão sugerida: ao tocar auth ou a cada 30 dias
