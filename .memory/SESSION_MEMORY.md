# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-05 · Partner API v1 — Fase 1 implementada (D-15 aprovada; piloto Mano Imóveis)

## Contexto vivo
- Dono aprovou a Fase 1 da D-15 e definiu a Mano Imóveis (repo iulemirandaimoveis-lab/ManoImoveis-MI.Tech)
  como primeiro parceiro a receber chave.
- Implementado: `partner_api_keys` (migration versionada + aplicada em produção; RLS on+forced,
  0 policies), `withPartnerAuth` (Bearer imi_pk_ → SHA-256 → escopos → RL 120/min por chave →
  last_used_at fire-and-forget), mappers coluna a coluna (colunas verificadas em produção via MCP),
  6 rotas GET `/api/v1/*`, OpenAPI 3.1, guia de integração, script de emissão de chave, 14 testes.
- Decisões de implementação que se perdem fácil:
  - ETag é função SÓ dos dados — nunca pôr timestamp no corpo de resposta com ETag (mata o 304).
  - supabase-js: `.or()` tem que vir ANTES de `.order()/.limit()` (transform builder não tem .or).
  - Select dinâmico (string) → supabase não infere tipo; cast `any[]` + mapper tipa a saída.
  - Availability do AB: overlay da planilha (fetch revalidate 60) por cima do banco, código "A-01"
    via `lotCode(quadra, lot_number)`; falha da planilha degrada para o status do banco.
  - Mapa v1: só alto-bellevue (import estático do JSON canônico + builders geojson existentes);
    MM retorna 404 map_not_available até ter transform geo.
- **Pendente do dono**: emitir a chave da Mano localmente (script) — nunca em chat/CI.
- Fase 2 (gatilho: piloto consumindo): webhooks assinados de saída + SDK gerado da spec + Postman.
- Branch: `claude/imi-saas-platform-design-el33oi` (recriado do main pós-merge do PR #358).
