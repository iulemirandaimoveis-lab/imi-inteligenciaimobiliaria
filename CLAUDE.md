# CLAUDE.md — IMI Inteligência Imobiliária
# LIDO AUTOMATICAMENTE PELO CLAUDE CODE

## Stack
Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel

## Deadline: 14/Mar/2026

---

## REGRAS NÃO NEGOCIÁVEIS

1. **ZERO páginas novas** até as existentes funcionarem
2. **Toda página**: loading skeleton + error boundary + empty state
3. **ZERO dados fake/hardcoded** — usar empty state se tabela não tem dados
4. **ZERO rotas duplicadas**
5. **Toda API valida inputs (400) e trata erros (500)**
6. **Paleta backoffice**: SOMENTE `var(--bo-*)`. NUNCA `gray-*/navy-*/slate-*`
7. **`container-custom`** = `max-w-[1280px]`
8. **NUNCA recriar tabelas** que já existem — usar `CREATE TABLE IF NOT EXISTS`

---

## ARQUITETURA

### Diretórios
- `src/app/(backoffice)/` — páginas do painel administrativo
- `src/app/(website)/` — site público
- `src/app/api/` — 90+ API routes (Next.js route handlers)
- `src/modules/imoveis/` — módulo feature-first de imóveis
- `src/lib/supabase/` — clientes Supabase (server, client, admin)
- `src/lib/schemas/` — schemas Zod para validação
- `supabase/migrations/` — todas as migrations SQL

### Componentes UI
- `src/app/(backoffice)/components/ui/` — componentes reutilizáveis do backoffice
- `src/modules/imoveis/components/MediaUploader.tsx` — upload de mídia (usar SEMPRE, não reimplementar)

---

## TABELAS CRIADAS EM 050_create_all_missing_tables.sql

Execute esta migration PRIMEIRO antes de qualquer outra coisa:

```
supabase/migrations/050_create_all_missing_tables.sql
```

Tabelas novas criadas:
- `brokers` — corretores da equipe
- `teams` — times de corretores
- `calendar_events` — agenda
- `financial_transactions` — financeiro
- `page_views` — rastreamento de páginas
- `tracking_sessions` — sessões do site
- `avaliacoes` — laudos técnicos (interno)
- `projetos` — pipeline de empreendimentos
- `consultorias` — processos de consultoria
- `conteudos` — conteúdo para redes sociais
- `role_permissions` — RBAC
- `integration_configs` — configurações de integrações
- `market_reports` — relatórios de mercado
- `pix_charges` — cobranças PIX
- `profiles` — perfis de usuário
- `financial_goals` — metas financeiras
- `bank_accounts` — contas bancárias
- `transactions` — transações gerais
- `market_indices` — índices (IPCA, Selic, etc.)
- `market_indicators` — indicadores por cidade
- `valuation_requests` — solicitações do site
- `ebooks` — conteúdos premium
- `smart_links` — links com analytics
- `smart_link_events` — eventos de cliques
- `media` — registro de mídias

Views criadas:
- `daily_sales_stats` — estatísticas de vendas por dia
- `ads_campaigns_summary` — resumo de campanhas

Correções em tabelas existentes:
- `contratos.modelo_id` e `contratos.modelo_nome` → nullable
- `niche_playbooks` → adicionadas colunas is_active, version, templates
- `tracked_links` → adicionada coluna campaign_name
- `developments` → adicionadas colunas price_from, price_to, inventory_score, video_url
- `leads` → adicionadas colunas source, utm_*, temperature, tenant_id

---

## REDIRECT STUBS (converter para redirects, não deletar)

```
/consultoria        → /backoffice/consultorias
/consultoria/nova   → /backoffice/consultorias/nova
/conteudo           → /backoffice/conteudos
/leads/pipeline     → /backoffice/leads/kanban
/qr                 → /backoffice/tracking/qr
```

---

## NAMING MISMATCHES CONHECIDOS

| O código usa        | A migration cria        | Status   |
|---------------------|-------------------------|----------|
| `integration_configs` | `integration_configs` | ✅ Criado em 050 |
| `consultorias`      | `consultorias`          | ✅ Criado em 050 |
| `conteudos`         | `conteudos`             | ✅ Criado em 050 |
| `avaliacoes`        | `avaliacoes`            | ✅ Criado em 050 |
| `brokers`           | `brokers`               | ✅ Criado em 050 |
| `calendar_events`   | `calendar_events`       | ✅ Criado em 050 |

---

## PADRÃO DE COMPONENTE

```tsx
// Usar UI components de:
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'

// Usar MediaUploader (NUNCA reimplementar upload):
import { MediaUploader } from '@/modules/imoveis/components/MediaUploader'

// Loading state (aplicar em TODAS as páginas):
if (loading) return <LoadingSkeleton />

// Error state:
if (error) return <ErrorState message={error} onRetry={refetch} />

// Empty state:
if (!data.length) return <EmptyState title="..." cta={{ label: "...", href: "..." }} />
```

---

## CHECKLIST DE LANÇAMENTO

- [ ] Migration 050 executada no Supabase Production
- [ ] Zero erros "relation does not exist" no console
- [ ] Módulo de imóveis: galeria + vídeo + tour + mapa
- [ ] Construtoras: logos aparecendo no site
- [ ] Leads: fluxo site → kanban → edição E2E
- [ ] Agenda: criar evento → calendário
- [ ] Tracking: gerar link → analytics
- [ ] Build sem erros: `npm run build`
- [ ] Deploy Vercel sem erros
