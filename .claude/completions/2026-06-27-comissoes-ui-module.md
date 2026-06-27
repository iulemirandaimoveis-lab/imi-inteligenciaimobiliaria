# Módulo de Comissões na UI (Users Platform)

**Data:** 2026-06-27
**Branch:** `claude/comissoes-ui-feature`
**Épico:** 2/4 da sequência pós-Propostas.

## Escopo

Expõe na UI o **módulo de comissões que já existe no banco** (`imi.commission_rules`,
`imi.commission_profiles`, `imi.broker_commissions`), com dados reais — superando o card
representativo do dashboard. Gestor define percentual/bônus/meta por corretor; corretor vê suas
comissões (previstas e recebidas). **Nenhuma tabela nova** — só leitura/escrita do existente.

## RBAC (reusa, sem novas permissões)
- **Leitura**: `commissions.read` (corretor vê o seu via RLS de `broker_commissions`/`commission_profiles`).
- **Gestão**: `commissions.manage` (Gestor/Backoffice) ou super. Reforçado em RLS e na API.

## Arquivos criados

- `src/lib/imi-commissions/compute.ts` — funções puras (`aggregateCommissions`, `rankBrokerCommissions`, `splitPercents`).
- `src/features/users/commissions/data.ts` — `getCommissionsData` (ledger + regras + perfis + agregados).
- `src/app/api/users/commissions/profile/route.ts` — PATCH upsert do perfil de comissão (gestor).
- `src/features/users/commissions/CommissionsView.tsx` — KPIs, split empresa/corretor, regras, editor de perfil, ranking e ledger auditável.
- `src/app/users/commissions/page.tsx` — página (carrega membros p/ o gestor).
- `src/__tests__/imi-commissions/commissions.test.ts` — 4 testes.

## Arquivos alterados

- `src/features/users/dashboard/DashboardChrome.tsx` — link de nav "Comissões" (gated por `commissions.read`).

## Riscos / observações

- Sem migração nova (usa tabelas existentes do `20260626_imi_team_and_commissions.sql`).
- "Previsto" exclui lançamentos `cancelled`; "Recebido" = `paid`. Cada venda gera lançamento via
  `imi.compute_commission` (já existente) — o ledger é a fonte auditável.
- Perfil por corretor é upsert idempotente sobre `UNIQUE (user_id, project_id)`.

## Validação

- `tsc --noEmit`: 0 erros · `next lint`: limpo · `jest`: 4/4 · `next build`: rotas novas compilam.
