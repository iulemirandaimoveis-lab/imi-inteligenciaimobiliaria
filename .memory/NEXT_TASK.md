# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-04 (Correção: card no desktop)

## Sessão de hoje
- ✅ **Corrigido**: Card não abria no desktop — adicionado threshold de 3px no drag
- ✅ PR #350 criada (em monitoramento de CI)

## Novidades da sessão de refinamento que afetam a fila
- E2E agora tem 7 specs/84 testes — candidato natural a job de CI (rodar contra preview do Vercel via `BASE_URL`).
- Controles mortos no console /users (switcher de empreendimento, sino) — decidir: implementar ou ocultar.
- Visual regression (`toHaveScreenshot` nos mapas) segue pendente (P2 da TESTING_STRATEGY).

## Spatial Intelligence — próximo passo (Fase 2)
Fase 1 (estabilização do motor de mapas) entregue. Fase 2 candidatos, em ordem:
1. Overlay georreferenciado dos lotes sobre o satélite (bloqueado por ≥3 pontos de
   controle — scripts/cad/geo/); é o desbloqueio das camadas de inteligência no mapa real.
2. Decidir destino do mapbox-gl (só ativa com NEXT_PUBLIC_MAPBOX_TOKEN 'pk.'; checar
   Vercel; se nunca configurado, remover dep e simplificar PropertyMap).
3. Decompor SubdivisionLotMap (1983 l) / AltoBellevueGeoMap (1651 l) antes de
   adicionar camadas novas (heatmap de preço/m², liquidez) — evitar crescer monólitos.

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
