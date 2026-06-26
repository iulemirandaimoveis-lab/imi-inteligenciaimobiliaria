# Módulo de Propostas — Mano Imóveis (Users Platform)

**Data:** 2026-06-26
**Branch:** `claude/mano-imoveis-proposal-feature-2zs4wc`
**Escopo:** Digitalização do formulário físico "MI GESTÃO / Mano Imóveis — Proposta de Compra" num fluxo digital auditável dentro da plataforma `/users`.

## Decisão de CTO (escopo)

A diretiva recebida descrevia a evolução de um SaaS inteiro (RBAC, equipes, metas, mapas,
analytics, propostas). A maior parte dessa fundação **já existe** no schema isolado `imi`
(RBAC com permissões `proposals.*`, auth, auditoria, comissões, equipes — commits #316/#320/#321).
O pedido concreto, ancorado na foto enviada, era **digitalizar a proposta de compra da Mano Imóveis**.

Entreguei exatamente isso como uma **fatia vertical** que **reutiliza** toda a infraestrutura
existente (RBAC, `imi.has_permission`, auditoria, `ImiSession`, design tokens, rota de upload).
**Não** recriei mapas/equipes/metas (épicos separados) nem toquei no site público ou no backoffice.

## Arquitetura reutilizada

- **RBAC**: `proposals.read` / `proposals.manage` / `proposals.approve` (já no seed do `imi`).
- **Auth**: `requirePermission`, `getImiSession`, `sessionHasPermission`.
- **Auditoria**: `logActivity` → `imi.activity_logs` + trilha própria `imi.proposal_events`.
- **UI**: tokens e primitivos do console (`GlassCard`, `Button`, `Eyebrow`, navy + dourado).
- **Upload**: rota existente `/api/upload` (bucket `media`, pasta `proposals`).

## Engine de templates (sem hardcode do modelo)

O formulário **não é hardcoded**. É descrito por um `schema` JSONB (`imi.proposal_templates`),
permitindo novos modelos no futuro. O template `mano-imoveis-compra` foi modelado **campo a campo**
a partir do papel fotografado: Comprador, Cônjuge, Contato & Endereço, Imóvel, Condições de
Pagamento, 3× Referências Pessoais, Intervenientes, e a observação da regra de **reserva de 24h**.

## Fluxo implementado

Corretor cria → associa cliente/produto/unidade → upload (opcional) → **enviar** →
responsável do produto recebe → **aprovar/rejeitar** (com nota) → histórico/timeline →
**gerar PDF** (documento imprimível réplica do papel) → auditoria.

Estados: `draft → submitted → under_review → approved | rejected | cancelled | expired`.

## Arquivos criados

**DB**
- `supabase/migrations/20260626_imi_proposals_engine.sql` — `imi.proposal_templates`,
  `imi.proposals`, `imi.proposal_events`, RLS por papel, helper `imi.can_view_proposal`,
  flag `mock`, regra de expiração de 24h, seed do template Mano Imóveis.

**Lib (pura, testável)**
- `src/lib/imi-proposals/template.ts` — engine de templates (espelho TS do seed) + `deriveProposalSummary`.
- `src/lib/imi-proposals/status.ts` — estados, transições, ações por papel, `formatBRL`.

**API**
- `src/app/api/users/proposals/route.ts` — POST criar (rascunho/enviar).
- `src/app/api/users/proposals/[id]/route.ts` — PATCH transições (submit/review/approve/reject/cancel/reopen) + DELETE (limpeza de mock, só Master).

**Dados (server)**
- `src/features/users/proposals/data.ts` — `listProposals`, `getProposal`, `getProposalEvents`, `computeKpis`.

**UI**
- `src/features/users/proposals/StatusBadge.tsx`
- `src/features/users/proposals/ProposalsListView.tsx` — lista + KPIs + filtros + busca.
- `src/features/users/proposals/ProposalForm.tsx` — formulário multi-seção dirigido pelo template (≤3 cliques para enviar).
- `src/features/users/proposals/ProposalDetailView.tsx` — detalhe + ações de workflow + timeline de auditoria.
- `src/features/users/proposals/ProposalDocument.tsx` — documento A4 imprimível (PDF) réplica do MI GESTÃO.
- `src/app/users/proposals/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/document/page.tsx`.

**Tests**
- `src/__tests__/imi-proposals/proposals.test.ts` — 9 testes (workflow + engine), todos passando.

## Arquivos alterados

- `src/features/users/dashboard/DashboardChrome.tsx` — link de nav "Propostas" (gated por `proposals.read`).

## Riscos / observações

- **Migração** precisa ser aplicada no Supabase (o schema `imi` já está exposto ao Data API).
  As novas tabelas herdam a exposição; a migração emite `NOTIFY pgrst, 'reload schema'`.
- **`mock=true`**: propostas fictícias são marcadas e só o Master pode excluir (RLS + endpoint).
- **PDF**: gerado via documento imprimível (Ctrl+P → Salvar como PDF), sem dependências novas.
- Associação de **unidade** é texto livre por ora (Lote/Quadra). Integração com o mapa de lotes
  (espelhamento do schema `public`) fica como épico separado, conforme combinado.

## Validação

- `tsc --noEmit`: 0 erros (projeto inteiro).
- `next lint`: sem warnings/erros nos arquivos novos.
- `jest`: 9/9 passando.
- `next build`: as 4 rotas novas compilam sem erro.
