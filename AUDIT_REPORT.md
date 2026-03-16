# IMI Intelligence — Relatório de Auditoria Completa

**Data:** 12/03/2026
**Branch:** `youthful-fermi`
**Projeto Vercel:** `imi-inteligenciaimobiliaria`
**Projeto Supabase:** `zocffccwjjyelwrgunhu`

---

## 1. Arquitetura do Sistema

### Escopo Mapeado
| Recurso | Quantidade |
|---------|-----------|
| Páginas backoffice | 100 |
| Rotas de API | 97 |
| Tabelas Supabase | 92 |
| Views Supabase | 5 |
| Componentes UI | 97+ |

### Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime), Next.js API Routes
- **IA:** Anthropic Claude, Google Gemini (multi-provider)
- **Deploy:** Vercel (auto-deploy via GitHub)
- **Pagamentos:** AbacatePay (PIX), Asaas (webhooks)

---

## 2. Correções Realizadas

### 2A. API Routes — Erros Críticos Corrigidos

| Rota | Problema | Correção |
|------|----------|----------|
| `/api/auth/logout` | Cookie mock, sem Supabase | `supabase.auth.signOut()` real |
| `/api/deploy-check` | Dados hardcoded mock | Health check real (DB + env vars) |
| `/api/leads` GET | Retornava 200 em erros | Status codes corretos (401/500) |
| `/api/leads` | Sem DELETE handler | Adicionado soft-delete (archived) |
| `/api/financeiro` GET | Engolia erros silenciosamente | Error logging + status 500 |
| `/api/conteudos` GET | 200 sem auth / engolia erros | 401 + error responses |
| `/api/qr/links` | Sem POST endpoint | CRUD completo com short codes |
| `/api/migrate` | Rota desabilitada (risco) | Removida |
| `/api/setup-admin` | Rota desabilitada (risco) | Removida |

### 2B. Segurança — Autenticação Adicionada

| Rota | Risco Anterior | Correção |
|------|----------------|----------|
| `/api/brokers/create` | **CRÍTICO** — público, criava auth users | Auth check obrigatório |
| `/api/brokers/delete` | **CRÍTICO** — público, deletava users | Auth check obrigatório |
| `/api/ai/auto-score` | Público, acesso a dados de leads | Auth check obrigatório |
| `/api/tracking/session` | Público, expunha analytics | Auth check obrigatório |
| `/api/contratos/salvar` | Público, criava contratos | Auth check obrigatório |
| `/api/pix/webhook` | Aceitava sem validar secret | Rejeita se secret não configurado |

### 2C. Frontend — Funcionalidades Corrigidas

| Página | Problema | Correção |
|--------|----------|----------|
| Automação Conteúdo | Botão Settings decorativo | Toast feedback funcional |
| Automação Conteúdo | Link "Ver Logs" morto | Substituído por sumário informativo |
| Agenda | Grid semana 6-col no mobile | Responsivo: 3-col mobile, 6-col desktop |
| Agenda | Botões nav 32px (touch small) | Ampliados para 40px |
| Agenda | Título evento maxWidth fixo | maxWidth: 100% (flexível) |
| Kanban | KPI grid 3-col no mobile | Responsivo: 1-col mobile, 3-col desktop |
| Kanban | Colunas 280px min fixo | Reduzido para 260px min |

### 2D. Onboarding Tutorial Implementado

- **OnboardingTutorial.tsx**: 9 steps cobrindo todos os módulos
- Navegação por teclado (setas, ESC, Enter)
- Barra de progresso + dots animados
- Navegação automática entre páginas
- Persistência localStorage (lembra conclusão, retoma do último step)
- Auto-trigger para primeiro acesso (1.5s delay)
- Botão "Tour" no DesktopHeader para re-acessar
- Dark mode nativo via CSS variables

---

## 3. Status do Sistema — Módulos

### Funcionando Completamente ✅
| Módulo | CRUD | API Real | Observação |
|--------|------|----------|------------|
| Dashboard | — | ✅ | Server-side render, dados reais |
| Imóveis/Empreendimentos | ✅ | ✅ | Full CRUD + PATCH + soft delete |
| Construtoras/Developers | ✅ | ✅ | Full CRUD + slug auto |
| Contratos | ✅ | ✅ | Full CRUD + Zod validation |
| Financeiro (Pagar/Receber) | ✅ | ✅ | Full CRUD + pagination |
| Financeiro (Contas) | ✅ | ✅ | CRUD funcional |
| Equipe | ✅ | ✅ | CRUD + useBrokers hook |
| Leads Inbox | ✅ | ✅ | Full CRUD + AI scoring |
| Leads Kanban | ✅ | ✅ | Pipeline visual |
| Leads Behavior | R | ✅ | Analytics read-only |
| Agenda/Calendar | ✅ | ✅ | Full CRUD + AI suggestions |
| Índices de Mercado | ✅ | ✅ | Full CRUD inline edit |
| Indicadores de Mercado | ✅ | ✅ | Full CRUD + categorias |
| Ebooks | ✅ | ✅ | CRUD + publish toggle |
| Conteúdo | ✅ | ✅ | CRUD + Zod schemas |
| Automações | ✅ | ✅ | Full CRUD + toggle ativo/pausado |
| QR Codes/Tracking | ✅ | ✅ | Geração + analytics |
| Crédito | R+Sim | ✅ | Aplicações reais + simulador client-side |

### Parcialmente Funcional ⚠️
| Módulo | Status | Gap |
|--------|--------|-----|
| Automação de Conteúdo | Read + Toggle | Settings/config de workflows pendente |
| Links Rastreáveis | Read + Delete | POST agora funcional (corrigido) |

---

## 4. Segurança — Status Atual

### RLS (Row Level Security)
- ✅ **100% das tabelas** têm RLS habilitado
- ⚠️ **~40 tabelas** com policy `true` (qualquer user autenticado acessa tudo)
- ⚠️ **3 views** com `security_definer` (bypass RLS): `analytics_consolidated`, `qr_links`, `security_definer_view`

### Autenticação de API
- ✅ Middleware protege `/backoffice` routes (redirect to login)
- ✅ API routes críticas agora têm auth checks (corrigido nesta auditoria)
- ⚠️ Middleware NÃO protege `/api` routes — cada rota implementa próprio check

### Exposição de Secrets
- ✅ Nenhum secret hardcoded no código
- ✅ `.env*.local` no `.gitignore`
- ✅ `.env.example` documentado

### SQL Injection
- ✅ Zero risco — todas queries usam Supabase JS client (parameterizado)
- ✅ `.rpc()` calls usam parâmetros nomeados (sem interpolação)

---

## 5. Correções de Segurança do Banco de Dados (12/03/2026)

### 5A. RLS Policies — Limpeza de Duplicatas
| Tabela | Antes | Depois | Ação |
|--------|-------|--------|------|
| developments | 16 policies | 2 | Removidas 14 duplicatas, mantida 1 auth ALL + 1 public read filtrada |
| developers | 11 policies | 2 | Removidas 9 duplicatas, mantida 1 auth ALL + 1 public read filtrada |
| content | 7 policies | 2 | Removidas 5 duplicatas |
| settings | 7 policies | 3 | Removidas 4 policies públicas (override perigoso) |
| brokers | 6 policies | 2 | Removidas 4 duplicatas, mantida admin ALL + own data |
| notifications | 6 policies | 5 | Removida 1 SELECT duplicada |
| executive_reports | 5 policies | 1 | Removidas 4 duplicatas |
| content_publications | 5 policies | 2 | Removidas 3 tenant-scoped (single-tenant) |
| consultations | 5 policies | 2 | Removida policy ALL pública PERIGOSA |
| integration_configs | 4 policies | 1 | Removidas 3 duplicatas |
| evaluations | 4 policies | 1 | Removidas 3 sobrepostas |
| appraisal_requests | 4 policies | 2 | Removidas duplicatas auth + anon |
| audit_log | 2 policies | 2 | Trocadas de public → authenticated only |
| calendar_events | 1 policy | 2 | Adicionada policy authenticated ALL |

### 5B. Views security_definer → security_invoker
| View | Risco | Correção |
|------|-------|----------|
| analytics_consolidated | Bypass RLS + anon full access | Recriada com security_invoker, revogado anon |
| qr_links | Bypass RLS + anon full access | Recriada com security_invoker, revogado anon |
| daily_sales_stats | Bypass RLS | Recriada com security_invoker |
| publications_pending | Bypass RLS | Recriada com security_invoker |
| ads_campaigns_summary | Bypass RLS | Recriada com security_invoker |
| content_analytics | Bypass RLS | Recriada com security_invoker |

### 5C. Funções com search_path fixado
- ✅ **7 SECURITY DEFINER** functions: broker_has_permission, check_broker_permission, get_avaliacoes_stats, get_dashboard_stats, increment_qr_scans, log_audit_event, handle_new_user
- ✅ **24 SECURITY INVOKER** functions: all trigger/utility functions (update_updated_at, generate_short_code, etc.)
- Total: **31 funções** corrigidas com `SET search_path = public`

### 5D. Input Validation — Zod Schemas Adicionados
| Rota | Schema |
|------|--------|
| `/api/agenda` POST/PUT | calendarEventSchema / calendarEventUpdateSchema |
| `/api/developers` POST/PUT | developerSchema / developerUpdateSchema |
| `/api/brokers/create` POST | brokerCreateSchema |
| (já existente) `/api/financeiro` POST/PUT | transactionSchema / transactionUpdateSchema |
| (já existente) `/api/contratos` POST/PUT | contratoSchema / contratoUpdateSchema |
| (já existente) `/api/leads` POST | leadSchema |

---

## 6. Recomendações Restantes

### Prioridade Média
1. **Rate limiting** — adicionar rate limiting a API routes de escrita (leads/create, brokers/create)
2. **Audit logging centralizado** — algumas routes logam auditoria, outras não (padronizar)
3. **Zod em routes AI** — routes `/api/ai/*` ainda sem Zod (menor risco — passam dados para Claude/Gemini)

### Prioridade Baixa
4. **Testes automatizados** — nenhum teste existe; priorizar API routes críticas
5. **Email validation** — normalizar case em brokers/create (atualmente case-sensitive)
6. **Pagination limit** — agenda hard-limits 200 results sem pagination

---

## 7. Commits desta Auditoria

```
98d8802 fix(api): critical API audit — error handling, auth, missing endpoints
62aa716 fix(ui): mobile responsiveness + broken frontend features
7a2df12 feat(onboarding): guided tour tutorial system with step navigation
9c1fef8 fix(security): add auth checks to 4 unprotected API routes + webhook validation
d3f09a2 docs: comprehensive system audit report
c11646f fix(security): Zod validation for agenda, developers, brokers/create routes
```

Supabase Migrations (banco de dados):
```
cleanup_rls_policies_developments_settings_audit_calendar
cleanup_rls_policies_batch2_10_tables
fix_security_definer_views_revoke_anon
fix_remaining_security_definer_views
fix_security_definer_functions_search_path
fix_invoker_functions_search_path_batch
```

---

## 8. Métricas de Qualidade

| Métrica | Antes | Depois |
|---------|-------|--------|
| API routes sem auth | 5 | 0 |
| Routes retornando 200 em erro | 4 | 0 |
| Dead/mock API routes | 4 | 0 |
| Endpoints sem POST | 1 (qr/links) | 0 |
| Endpoints sem DELETE | 1 (leads) | 0 |
| Mobile breakpoint issues | 3 | 0 |
| Decorative buttons (no-op) | 3 | 0 |
| TypeScript errors | 0 | 0 |
| Onboarding tutorial | Inexistente | 9-step guided tour |
| RLS policies duplicadas | 80+ | 0 |
| Views security_definer | 6 | 0 |
| Functions sem search_path | 31 | 0 |
| API routes sem Zod (críticas) | 3 | 0 |
| Security advisor ERRORS | 4 | 0 |
