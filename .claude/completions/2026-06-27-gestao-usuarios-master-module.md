# Módulo de Gestão de Usuários (Master) — Users Platform

**Data:** 2026-06-27
**Branch:** `claude/gestao-usuarios-master-feature`
**Épico:** 3/4 da sequência pós-Propostas.

## Escopo

Tela do **Master / Backoffice** para gestão de acessos do ecossistema IMI: criar usuários,
atribuir **múltiplos papéis por usuário** (habilitar/desabilitar funções), suspender/reativar,
resetar acesso e **limpar dados mockados**. Reutiliza RBAC, auth, auditoria e tokens.

## RBAC
- **Página/listagem**: `users.manage`.
- **Criar usuário**: `users.manage` + service role (cria `auth.users` + `imi.users` + papéis + vínculo de projeto).
- **Papéis (add/remove)**: `permissions.manage`. Apenas Super pode conceder/revogar `SUPER_ADMIN`.
- **Status (suspender/arquivar/reativar)**: `users.manage`.
- **Limpar mock**: `SUPER_ADMIN`. Todas reforçadas por RLS no schema `imi`.

## Arquivos criados

- `src/features/users/admin/data.ts` — `getAdminData` (usuários + papéis + projetos).
- `src/app/api/users/admin/users/route.ts` — POST criar usuário (auth + imi + papéis + projeto, com rollback).
- `src/app/api/users/admin/users/[id]/route.ts` — PATCH `add_role`/`remove_role`/`set_status`.
- `src/app/api/users/admin/cleanup/route.ts` — POST limpeza de mock (proposals/goals, best-effort por tabela).
- `src/features/users/admin/AdminView.tsx` — roster com chips de papéis (multi-role), status, reset, criar usuário, limpar mock.
- `src/app/users/admin/page.tsx` — página.

## Arquivos alterados

- `src/features/users/dashboard/DashboardChrome.tsx` — link de nav "Usuários" (gated por `users.manage`).

## Decisões de segurança (CTO)

- **Sem hard-delete de auth users**: optei por `status='archived'` (soft) — exclusão destrutiva de
  `auth.users` fica fora do escopo desta entrega por princípio de não-destrutividade.
- **Não-super não cria/atribui `SUPER_ADMIN`**.
- **Não é possível suspender o próprio acesso** (guard explícito).
- Criação faz **rollback do auth user** se o insert em `imi.users` falhar (evita órfãos).

## Riscos / observações

- Sem migração nova (usa tabelas do ecossistema `imi` já existentes).
- Criar usuário exige `SUPABASE_SERVICE_ROLE_KEY`. Sem e-mail transacional, a **senha provisória** é
  exibida para repasse seguro; o usuário define a própria senha no 1º acesso (fluxo já existente).
- `cleanup` cobre `imi.proposals` (e `imi.goals` quando a migração de Metas estiver aplicada).

## Validação

- `tsc --noEmit`: 0 erros · `next lint`: limpo · `next build`: rotas novas compilam · suíte de testes existente intacta.
