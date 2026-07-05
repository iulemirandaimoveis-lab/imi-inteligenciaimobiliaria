# Completion — Decisão CTO: Partner API v1 (D-15)

**Data**: 2026-07-05 · **Branch**: `claude/imi-saas-platform-design-el33oi` · **Tipo**: decisão de arquitetura (só docs)

## Tarefa
Analisar criticamente o prompt externo "IMI API Platform" (plataforma completa de inteligência
imobiliária para parceiros) e tomar a decisão como CTO, sem tomar o prompt como verdade.

## Resultado
- Tese aceita (API-first, parceiro nunca acessa o banco, IMI = fonte única da verdade).
- Arquitetura maximalista rejeitada (GraphQL/WS/SSE, 18 motores, multi-tenant com domínio,
  OAuth2, PostGIS/tiles/Cesium, marketplace) — cada item adiado com gatilho explícito de reavaliação.
- Aprovada direção: **Partner API v1** — `/api/v1/*` REST read-only, API key com escopos,
  rate limit por chave, ETag+CDN, OpenAPI como fonte de SDK/docs gerados.

## Arquivos
- `docs/PARTNER_API_V1_DESIGN.md` (novo) — análise crítica + arquitetura + roadmap por gatilhos.
- `docs/DECISION_LOG.md` — D-15.
- `.memory/`: ARCHITECTURE_DECISIONS, PROJECT_STATE, NEXT_TASK, CHANGE_RECEIPT, SESSION_MEMORY.

## Pendência
Implementação da Fase 1 **gated em aprovação do dono** (migration `partner_api_keys` + modelo
de auth + definição comercial do piloto com Mano Imóveis). Nenhum código de runtime alterado.
