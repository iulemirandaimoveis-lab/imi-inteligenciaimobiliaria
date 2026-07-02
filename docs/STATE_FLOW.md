# STATE_FLOW — Gestão de Estado e Fluxo de Dados

---

## Modelo Geral

Não há Redux/Zustand. O estado segue camadas:

1. **Servidor é a fonte de verdade** — Server Components buscam via cliente Supabase server (RLS aplicada).
2. **SWR** (19 arquivos) — cache client-side para dados vivos (dashboards, listas do backoffice).
3. **React Context** (3 providers em `src/components/providers/`) — tema, sessão, escopos transversais.
4. **useState/useReducer local** (349 arquivos) — estado de UI puro.
5. **Realtime Supabase** — canais em `connect/*` (mensagens, presence).
6. **URL como estado** — filtros/vistas dos mapas e explorer (query params), essencial para deep-links compartilháveis.

## Fluxos Críticos

### Sessão/Auth
`middleware.ts` → `updateSession()` (refresh de cookie a cada request de `/api|/backoffice|/users|/login`) → Server Components leem via `createClient()` → RBAC IMI resolve papéis/permissões (`src/lib/imi-auth/server.ts`, leituras simples em vez de embed aninhado — decisão pós-bug PostgREST, ver DECISION_LOG D-03).

### Mapa de lotes (Alto Bellevue / Miguel Marques)
JSON de lotes (estático/validado por `npm run validate:lots`) + disponibilidade do banco (`subdivision_lots`) → merge no viewer → seleção → carrinho de proposta (estado compartilhado entre vistas plano/geo/satélite — corrigido no PR #342).

### Proposta comercial
Carrinho (client) → formulário multi-etapa (RHF+zod, estado civil/cônjuge/checklist docs) → `POST api/proposals` → schema `imi` → aprovação com permissão `proposals.approve`.

### Conteúdo IA
UI backoffice → `POST /api/ai/generate-content` (auth→RL→tenant) → Claude → insert `content_items` → fila de publicação (`cron/process-publishing-queue`).

## Armadilhas Conhecidas

- **PWA cache**: `/users/*` já serviu HTML velho (incidente do mapa). Runtime caching é NetworkFirst — não regredir para CacheFirst nessas rotas.
- **Embeds PostgREST aninhados** retornam `null` silencioso quando RLS/schema-cache falha na tabela juntada → preferir duas queries simples (padrão `getImiSession`).
- **Estado duplicado entre vistas de mapa**: o carrinho precisa viver acima do alternador de vistas (lição do #342).
- **`revalidate`/cache do App Router**: rotas de dados vivos precisam de `dynamic = 'force-dynamic'` ou fetch sem cache — verificar ao criar página nova com dados de disponibilidade.

---
**Última atualização**: 2026-07-02
