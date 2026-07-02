# SECURITY_AUDIT — Auditoria de Segurança

> Auditoria estática de 2026-07-02 (sem pentest dinâmico). Formato: achado → causa → impacto → prioridade → recomendação.

---

## Resumo Executivo

Postura geral **boa**: middleware com security headers + CORS allowlist, CSP definida, crons protegidos por `CRON_SECRET`, rate limit distribuído (Upstash), RLS no Supabase, cliente admin isolado em `src/lib/supabase/admin.ts`, rotas amostradas fazem auth→403 de tenant. Os achados abaixo são correções pontuais, não redesenho.

## Achados

### F-01 — Senha temporária fraca no reset administrativo · **ALTA**
- **Onde**: `src/app/api/admin/reset-password/route.ts` → `crypto.randomBytes(3).toString('hex')` = 6 hex chars (~24 bits).
- **Impacto**: janela de brute-force se a troca obrigatória (`must_reset_password`) atrasar ou o rate limit não cobrir o login.
- **Recomendação**: `randomBytes(9).toString('base64url')` (12+ chars) ou fluxo de link mágico do Supabase. **Complexidade: baixa. Risco da mudança: baixo.**

### F-02 — `getSession()` usado para autorização · **MÉDIA**
- **Onde**: mesmo endpoint (e possivelmente outros — auditar com `grep -rn "getSession" src/app/api`).
- **Causa**: `getSession()` lê o cookie sem validar o JWT no servidor; a doc do Supabase recomenda `getUser()` para decisões de acesso.
- **Recomendação**: padronizar `getUser()` em decisões de autorização. Baixo risco, mudança mecânica.

### F-03 — `X-Frame-Options` inconsistente · **BAIXA**
- **Onde**: middleware envia `DENY` (rotas api/backoffice/users); `next.config.js` envia `SAMEORIGIN` global; CSP tem `frame-ancestors 'self'`.
- **Impacto**: sem furo real (o mais restritivo prevalece por header duplicado ser indefinido entre proxies), mas é ambiguidade evitável.
- **Recomendação**: escolher `frame-ancestors` como fonte única; alinhar os dois pontos para `SAMEORIGIN`.

### F-04 — CSP com `'unsafe-inline'` em `script-src` · **MÉDIA (aceitável hoje)**
- **Causa**: restrição prática do Next.js sem nonces.
- **Recomendação**: migrar para nonce/strict-dynamic quando subir para Next 15; registrar como dívida, não corrigir às pressas.

### F-05 — Rate limiting cobre ~11 de 275 rotas · **MÉDIA**
- **Impacto**: rotas públicas de escrita (`contact`, `consultation`) e rotas caras sem limite → spam/custo.
- **Recomendação**: aplicar `limiters.publicForm(ip)` nas públicas e `limiters.default(user.id)` nas autenticadas de escrita. Incremental, por rota.

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
