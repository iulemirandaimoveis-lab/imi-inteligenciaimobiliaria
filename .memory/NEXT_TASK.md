# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-03 (sessão de refinamento — testes + mapa + UX)

## Novidades desta sessão que afetam a fila
- E2E agora tem 7 specs/84 testes — candidato natural a job de CI (rodar contra preview do Vercel via `BASE_URL`).
- Controles mortos no console /users (switcher de empreendimento, sino) — decidir: implementar ou ocultar.
- Visual regression (`toHaveScreenshot` nos mapas) segue pendente (P2 da TESTING_STRATEGY).

## Sem ação pendente do dono no banco
Verificado em produção (projeto zocffccwjjyelwrgunhu): RLS habilitada em todo o schema public
(K-13 limpo). Migration segura de colunas já aplicada. F-09 anônimo não era explorável.

## Próxima tarefa recomendada (sem aprovação)
**T-07 — DOMPurify nos 13 `dangerouslySetInnerHTML`**: verificar por uso; todo HTML de
banco/usuário deve passar por sanitização. Grep: `grep -rn "dangerouslySetInnerHTML" src`.
Baixo risco (adiciona sanitização onde falta).

## Depois
- Upgrade Next/next-pwa (altas de npm audit de produção) → então subir gate do CI para high.
- F-11 (informativo): policies de proposals são org-wide (sem tenant). Só agir se virar multi-tenant.

## Contexto que se perde fácil
- Migrations versionadas ≠ estado real do banco (L-15). Antes de migration de RLS/policy,
  verificar via MCP (pg_policies, relrowsecurity, columns).
- Rotas públicas de proposta exigem TOKEN (P15). Parsing de planilha só via src/lib/spreadsheet (P16).
- X-Frame-Options só no next.config, escopado (P17).
