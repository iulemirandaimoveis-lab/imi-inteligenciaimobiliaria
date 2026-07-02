# CHANGE_RECEIPT — Recibo de Mudanças por Sessão

> Uma entrada por sessão de trabalho. O que mudou, por quê, como foi validado. Mais recente no topo.

---

## 2026-07-02 · Sessão: Auditoria de inteligência de projeto

**Branch**: `claude/project-intelligence-audit-9vzb7e`

### O que foi feito
- Varredura completa do repositório (estrutura, 275 rotas API, auth, middleware, PWA, migrations, deps, testes, CI).
- Executados quality gates: type-check ✅, lint ✅, jest 829/834 ✅.
- Criado sistema de inteligência: 17 docs em `docs/` (PROJECT_MAP, ARCHITECTURE, DEPENDENCIES, UI_SYSTEM, API_MAP, STATE_FLOW, KNOWN_ISSUES, TECH_DEBT, SECURITY_AUDIT, PERFORMANCE_REPORT, RESPONSIVE_AUDIT, ACCESSIBILITY_REPORT, REFACTOR_ROADMAP, TODO_MASTER, DECISION_LOG, COMPONENT_RELATIONS, TESTING_STRATEGY).
- Criada memória persistente `.memory/` (9 arquivos).
- CLAUDE.md atualizado com protocolo de leitura da memória.

### Achados-chave (evidência nos docs)
- F-01 senha temporária de 24 bits no reset admin (ALTA).
- Deps mortas: jsonwebtoken, ua-parser-js; mapbox-gl suspeita.
- Rate limit em só ~11/275 rotas; lint sem gate no CI; 5 testes skipped.
- Nenhum vazamento de service-role para client components (3 suspeitas eram texto de UI).

### Validação
- Nenhum código de produção alterado nesta sessão (somente docs/memória) → gates seguem verdes por definição; re-rodados mesmo assim (todos ✅).

### Risco
- Nulo (docs-only).

## 2026-07-02 · Sessão 2: Execução dos fixes de segurança + quick wins (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (mesmo PR #343)

### Código alterado
- **F-01**: `api/admin/reset-password` — senha temp `randomBytes(12).toString('base64url')` (~96 bits).
- **F-02**: `getSession()`→`getUser()` em 4 rotas (reset-password, set-password, parse-property-book, enrich-developer-properties — proxies mantêm getSession só p/ access_token).
- **Rate limit novo**: `auth/login` (5/min/IP), `auth/first-access` (5/min/IP), `users/auth/first-access` (5/min/IP), `lots/proposal` (5/min/IP), `intelligence/simulate` (public), `proposals/respond` (10/min/IP).
- **CI**: `continue-on-error` removido do job lint.
- **A11y**: `MotionProvider` (reducedMotion="user") no layout raiz.
- **Deps**: removidos jsonwebtoken, ua-parser-js (+ @types).
- **Teste**: auth-login.test.ts — IP único por caso + teste anti brute-force (429 na 6ª tentativa).

### Descobertas (auditoria auto-corrigida)
- `contact`/`consultation` JÁ tinham RL (falso positivo F-05 original).
- `apiHandler` (src/lib/api-helpers.ts) = wrapper centralizado com auth+RL+audit — cobertura real muito maior.
- `<img>` sem alt era mock de teste (A-06 falso positivo).
- 🆕 **F-09 (ALTA, aberta)**: `proposals/respond` muta proposta por proposal_id cru sem token — aguarda aprovação p/ exigir token.

### Validação
- tsc ✅ · eslint ✅ · jest: falha de teste do login detectada→corrigida→suíte completa re-rodada (ver abaixo).

### Risco
- Baixo. Rollback: revert do commit (nenhuma migration, nenhum contrato quebrado — RL é aditivo).

## 2026-07-02 · Sessão 3: Investigação IDOR (F-09) + análises T-03b/T-08 (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (PR #343)

### Investigação (sem alterar código de produto — findings requerem aprovação)
- **F-09 IDOR (ALTA)**: rastreado o fluxo proposta pública (token) → client envia proposal_id cru → `proposals/respond` faz UPDATE anon sem token/ownership. Evidência de migrations: `public.proposals` tem policies `TO authenticated` mas **NENHUM `ENABLE ROW LEVEL SECURITY`** (varrido migrations + rls-policies.sql + rls_block8.sql + manual-schema.sql). Corroborado por comportamento (viewed anon). CVSS~8.1. Fix (token + enable RLS) documentado, AGUARDA APROVAÇÃO.
- **F-10**: mesma raiz em `proposals/track` (impacto menor).
- **T-02b**: rotas públicas restantes triadas — todas ok exceto a família proposals.
- **T-08**: nenhum iframe interno emoldura backoffice/users/api; frame-ancestors 'self' é o controle real. Recomendação: padronizar X-Frame-Options=SAMEORIGIN (aguarda ok).

### Código alterado (baixo risco, auto-executado)
- **CI security job (T-03b/D-10)**: gate bloqueante `npm audit --omit=dev --audit-level=critical` (0 críticas em prod hoje) + audit informativo completo. Dev-only criticals (handlebars via ts-jest) não travam.

### Evidência npm audit
- Prod: 0 crítica / 15 alta / 13 mod. Completo: 1 crítica (handlebars/dev) / 19 alta.
- xlsx (prod, sem fix): T-24 substituir.

### Docs/memória atualizados
- SECURITY_AUDIT (F-09 completo, F-10, F-03 rev, F-08 rev, D-10), DECISION_LOG (D-10), KNOWN_ISSUES (K-11..K-13), TESTING_STRATEGY (RLS audit), DEPENDENCIES (estado audit), TODO_MASTER (T-23/T-24/T-02b/T-03b), FAILURES (FX-06), KNOWN_PATTERNS (P15/A11/A12), PROJECT_STATE.

### Risco do commit
- Baixo. Só CI config + docs. Nenhum contrato/rota/schema alterado.

## 2026-07-02 · Sessão 4: F-09 fix (app+RLS), T-08, T-24 — aprovados (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (PR #343)

### F-09 IDOR — CORRIGIDO (Fase A app + Fase B migration)
- `proposals/respond` + `proposals/track`: reescritos p/ autorizar por TOKEN secreto (min 16), lookup via supabaseAdmin, proposal_id do cliente rejeitado. Valida expiração(410)/estado(409)/token inválido(403)/rate limit(429). Colunas de evento → ip_address.
- `src/app/p/[token]/page.tsx` → supabaseAdmin (token-gated), pois a migration habilita RLS.
- `PropostaPublicaClient.tsx` → envia token (não proposal_id); trackEvent(token,...).
- Migration `20260702_f09_proposals_rls_hardening.sql`: ENABLE+FORCE RLS em public.proposals e proposal_events; policies só authenticated (tenant/owner); anon sem policy; +colunas time_on_page_seconds/device_type. ⚠️ Requer aplicação no banco pelo dono.
- Testes: `__tests__/api/proposals-respond.test.ts` (8) — valid/missing/short/invalid/expired/replay/no-counter/ratelimit.

### T-08 X-Frame-Options escopado (fonte única)
- Removido do middleware; next.config: DENY p/ backoffice|users|api|auth|login|admin|console, SAMEORIGIN público (negative-lookahead). CSP frame-ancestors 'self' = autoridade. Teste `__tests__/middleware/frame-options.test.ts` (5).

### T-24 xlsx→exceljs
- Adapter `src/lib/spreadsheet/` (SpreadsheetParser + ExcelJS + limites anti-DoS 10MB/100k linhas). Refatorados document-parser.ts e backoffice/imoveis/[id]/lotes. `xlsx` removido; `exceljs` adicionado. Testes `__tests__/lib/spreadsheet-parser.test.ts` (8): rows/vazio/fórmula/data/bool/unicode/CPF/CSV-escaping/limite/corrompido.

### Gates
- tsc ✅ · eslint ✅ · jest 851/856 ✅ (60 suítes, 5 skipped pré-existentes, +21 testes novos).

### Docs/memória
- SECURITY_AUDIT (F-09 corrigido), DECISION_LOG (D-11/D-12/D-13), TODO_MASTER (T-08/T-23/T-24 done), DEPENDENCIES, PROJECT_STATE, KNOWN_PATTERNS (P15-P17), REUSABLE_COMPONENTS.

### Risco
- Médio-baixo. App fix é reversível (revert). Migration é aditiva/não-destrutiva (rollback: DISABLE RLS). Ação do dono: aplicar migration.

## 2026-07-02 · Sessão 5: Verificação de banco via MCP + correção de diagnóstico F-09/K-13

**Banco de produção** (Supabase MCP, projeto zocffccwjjyelwrgunhu):
- Descoberto que RLS de proposals/proposal_events JÁ estava habilitada; policies exigem auth.uid()
  → anon bloqueado. F-09 anônimo NÃO era explorável (severidade ALTA→informativa/resolvido).
- proposals NÃO tem tenant_id → a migration do repo (que reescrevia policies por tenant e removia
  bo_full_proposals) teria QUEBRADO produção. Não aplicada; reescrita para versão segura.
- APLICADA migration segura `proposal_events_add_tracking_columns` (add time_on_page_seconds,
  device_type — faltavam; inserts falhavam). Idempotente, não-destrutiva.
- K-13: query confirmou 0 tabelas public com RLS off (schema todo protegido).
- F-11 registrado (informativo): policies de proposals são org-wide; by-design single-org.

**Repo**: migration file reescrita para refletir a realidade + docs corrigidos honestamente
(SECURITY_AUDIT F-09/F-11/K-13, FAILURES FX-06, LEARNINGS L-15, KNOWN_ISSUES K-11/K-13,
PROJECT_STATE, NEXT_TASK).

**Lição L-15**: migrations versionadas ≠ estado real; sempre verificar via MCP antes de migration de RLS/policy.

**Código**: sem mudança nesta sessão além da migration file (app da sessão 4 continua correto —
usa service_role+token, funciona sob a RLS real).

**Risco**: baixo. A migration aplicada é aditiva (colunas). Rollback trivial (DROP COLUMN).
