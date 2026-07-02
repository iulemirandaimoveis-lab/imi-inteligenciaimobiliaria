# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-02 (sessão 4)

## AÇÃO DO DONO (bloqueante para defesa em profundidade do F-09)
Aplicar a migration `supabase/migrations/20260702_f09_proposals_rls_hardening.sql` no banco
(habilita RLS em public.proposals/proposal_events). A camada de app já fecha o IDOR por token;
a migration adiciona a defesa em profundidade. Verificar depois:
`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('proposals','proposal_events');`

## Próxima tarefa recomendada (sem aprovação necessária)
**K-13 — Auditoria de RLS em todo o schema public**: rodar a query de TESTING_STRATEGY §RLS
para achar tabelas com policy mas sem `relrowsecurity=true` (o mesmo bug do F-09 pode existir
em outras tabelas). Gerar migration de hardening para as que aparecerem. Baixo risco (só habilita
RLS onde já há policy), mas requer aprovação de migration para aplicar.

## Depois
- T-07: DOMPurify nos 13 dangerouslySetInnerHTML (verificação por uso).
- Upgrade Next/next-pwa (altas de npm audit de produção) → então subir gate do CI para high.

## Contexto que se perde fácil
- Rotas públicas de proposta agora exigem TOKEN (não proposal_id). Se o front público quebrar
  no aceite/tracking, verificar que está enviando `token` (P15).
- Parsing de planilha só via `src/lib/spreadsheet` (P16). xlsx foi removido.
- X-Frame-Options só no next.config, escopado (P17/D-12). Não re-adicionar no middleware.
