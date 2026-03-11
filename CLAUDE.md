# CLAUDE.md — IMI Inteligência Imobiliária
# LIDO AUTOMATICAMENTE PELO CLAUDE CODE

## Stack
Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel

## Deadline
14/Mar/2026

---

## REGRAS NÃO NEGOCIÁVEIS

1. ZERO páginas novas até as existentes funcionarem
2. Toda página: loading skeleton + error boundary + empty state
3. ZERO dados fake/hardcoded — usar empty state se tabela não tem dados
4. ZERO rotas duplicadas
5. Toda API valida inputs (400) e trata erros (500)
6. Paleta backoffice: SOMENTE `var(--bo-*)`. NUNCA `gray-*/navy-*/slate-*`
7. `container-custom` = `max-w-[1280px]`
8. Usar MediaUploader de `src/modules/imoveis/components/MediaUploader.tsx` — NÃO reimplementar upload inline
9. Usar UI components de `src/app/(backoffice)/components/ui/`

---

## TABELAS FALTANTES (CRIAR ANTES DE TUDO)

Arquivo de migration: `supabase/migrations/050_create_all_missing_tables.sql`

```
avaliacoes, financial_transactions, financial_goals,
tracking_sessions, page_views, contratos, calendar_events,
brokers, teams, consultorias, conteudos, projetos,
ebooks, market_indices, market_indicators, market_reports,
role_permissions, integration_configs, playbooks,
profiles, bank_accounts, media, valuation_requests,
smart_links, smart_link_events, pix_charges,
transactions, ads_campaigns_summary, daily_sales_stats
```

Regras para cada tabela:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()`
- RLS habilitado com policy permissiva `USING (true)` para começar
- Indexes nos campos mais consultados

---

## REDIRECT STUBS (JÁ IMPLEMENTADOS)

| De | Para |
|----|------|
| `/backoffice/consultoria` | `/backoffice/consultorias` |
| `/backoffice/consultoria/nova` | `/backoffice/consultorias/nova` |
| `/backoffice/conteudo` | `/backoffice/conteudos` |
| `/backoffice/leads/pipeline` | `/backoffice/leads/kanban` |
| `/backoffice/qr` | `/backoffice/tracking/qr` |
| `/backoffice/equipe` | `/backoffice/organizacao` |

---

## ESTRUTURA DE MÓDULOS

```
src/
├── modules/imoveis/          # Feature-first: hooks, utils, components, types
├── lib/supabase/queries/     # Query layer para 6 entidades
├── lib/governance.ts         # RBAC
├── hooks/use-brokers.ts      # Hook de corretores
└── app/
    ├── (backoffice)/
    │   ├── components/       # DesktopSidebar, MobileHeader, ui/*
    │   ├── lib/theme.ts      # Objeto T com variáveis CSS
    │   └── backoffice/       # Páginas do backoffice
    └── [lang]/(website)/     # Páginas do site público
```

---

## SIDEBAR

Organização em 5 grupos (DesktopSidebar.tsx):
- **Principal** (sempre visível): Dashboard, Imóveis, Leads, Agenda, Tracking
- **Portfólio** (colapsado): Construtoras, Projetos, Conteúdo, Campanhas
- **Operação** (colapsado): Avaliações, Contratos, Consultoria, Crédito, WhatsApp
- **Análise & Finanças** (colapsado): Financeiro, Relatórios, Metas, Inteligência
- **Configurações** (sempre visível): Organização, Integrações, Configurações

---

## FLUXO E2E DE LEADS

```
Site /contato → POST /api/leads/capture → tabela leads
                                         ↓
                               /backoffice/leads/kanban
                               /backoffice/leads (lista)
```

A captura de leads FUNCIONA. A tabela `leads` existe.
Fire-and-forget: `tracking_sessions` e `profiles` são opcionais.

---

## AGENTS .agent/skills/ RELEVANTES

api-patterns, architecture, clean-code, database-design,
frontend-design, nextjs-react-expert, seo-fundamentals,
tailwind-patterns, webapp-testing
