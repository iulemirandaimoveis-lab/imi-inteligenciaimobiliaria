# Completion — Partner API v1: Fase 1 implementada (D-15)

**Data**: 2026-07-05 · **Branch**: `claude/imi-saas-platform-design-el33oi` · **Aprovação**: dono (piloto Mano Imóveis)

## Entregue
- **Banco**: `supabase/migrations/20260705_partner_api_keys.sql` — versionada e aplicada em produção
  via MCP (RLS on + forced, 0 policies; verificação pós-aplicação). Estado real checado antes (L-15).
- **Auth**: `src/lib/partner-api/auth.ts` — Bearer `imi_pk_…` → SHA-256 → escopos → rate limit
  120/min por chave → `last_used_at`. Respostas 401/403/429 padronizadas `{error:{code,message}}`.
- **Contrato**: `types.ts` + `mappers.ts` (coluna a coluna, zero linha crua; preço gated por
  `prices:read`; status de lote em vocabulário fechado) + `response.ts` (ETag/304).
- **Rotas** (`src/app/api/v1/`): developments (list cursor + detail por uuid/slug), lots por
  empreendimento (+filtro status), lot detail, map (GeoJSON WGS84 do Alto Bellevue por camadas),
  availability (polling com ETag; overlay da planilha ao vivo do AB).
- **Docs**: `docs/api/openapi-partner-v1.yaml` (OpenAPI 3.1) + `docs/api/PARTNER_API_GUIDE.md`
  (guia de integração com exemplos curl/MapLibre) + API_MAP atualizado.
- **Emissão de chave**: `scripts/partner/create-partner-key.mjs` (chave exibida uma única vez,
  local; banco guarda só hash).
- **Testes**: `src/__tests__/api/v1/partner-api.test.ts` — 14 contratos (401/403/429, gating de
  preço, ETag/304, vazamento de coluna, mappers).

## Gates
tsc ✅ · lint ✅ · jest 64 suítes / 889 passed (5 skipped) ✅

## Pendências
- Dono: emitir chave da Mano Imóveis (script) e enviar por canal seguro.
- Fase 2 (gatilho: piloto consumindo de verdade): webhooks de saída assinados, SDK TS gerado da
  spec, Postman/Redoc.
