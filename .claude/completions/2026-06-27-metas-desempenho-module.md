# Módulo de Metas & Desempenho (Users Platform)

**Data:** 2026-06-27
**Branch:** `claude/metas-desempenho-feature`
**Épico:** 1/4 da sequência pós-Propostas (Metas → Comissões UI → Gestão de Usuários → Mapas).

## Escopo

Implementa **metas de equipe e individuais** com **realizado calculado em tempo real a partir das
propostas APROVADAS** (`imi.proposals`), fechando o ciclo Propostas → Vendas → Metas. Indicadores:
realizado (VGV), nº de vendas, ticket médio, progresso (%) e ranking de corretores.

Reutiliza toda a infraestrutura do `imi` (RBAC, auth, auditoria, tokens, `formatBRL`). Sem novas
permissões: leitura por `metrics.read`/dono/membro; gestão por `teams.manage` (Gestor) / super.

## Arquivos criados

- `supabase/migrations/20260627_imi_goals_engine.sql` — `imi.goals` (scope team|individual,
  período, target), RLS por papel, flag `mock`.
- `src/lib/imi-goals/compute.ts` — funções puras (`inPeriod`, `summarize`, `progressPct`).
- `src/features/users/goals/data.ts` — `getGoalsData` (calcula realizado/ranking das propostas aprovadas).
- `src/app/api/users/goals/route.ts` — POST criar meta.
- `src/app/api/users/goals/[id]/route.ts` — PATCH editar / DELETE remover (e limpeza de mock).
- `src/features/users/goals/GoalsView.tsx` — cards de equipe, lista individual, ranking, painel "Nova meta".
- `src/app/users/goals/page.tsx` — página (carrega equipes/membros p/ o gestor).
- `src/__tests__/imi-goals/goals.test.ts` — 5 testes (inclui os exemplos do spec: 54% e 56%).

## Arquivos alterados

- `src/features/users/dashboard/DashboardChrome.tsx` — link de nav "Metas" (gestor/owner por
  `metrics.read`; corretor vê a própria meta via role BROKER).

## Riscos / observações

- **Aplicar a migração** `20260627_imi_goals_engine.sql` no Supabase.
- "Realizado" usa `reviewed_at` (data de aprovação) das propostas `status='approved'`, com fallback
  para `created_at`. Conforme mais propostas forem aprovadas, os números se atualizam sozinhos.
- Metas `mock=true` são limpáveis pelo gestor/super (RLS + endpoint).

## Validação

- `tsc --noEmit`: 0 erros · `next lint`: limpo · `jest`: 5/5 · `next build`: rotas novas compilam.
