# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-05 · Decisão CTO — Partner API v1 (análise do prompt "IMI API Platform")

## Contexto vivo
- Dono trouxe prompt externo pedindo plataforma completa de inteligência imobiliária para servir
  imobiliárias parceiras (Mano Imóveis etc.) — GraphQL, WebSocket, 18 motores, multi-tenant com
  domínio/branding, OAuth2, PostGIS/vector tiles/Cesium, marketplace/ERP — e pediu decisão como CTO,
  sem tomar o prompt como verdade.
- Fatos que decidiram: repo é monólito de produção single-tenant (F-11 sem tenant_id), sem PostGIS
  (geo = GeoJSON + motor CAD próprio), 275 rotas internas que NÃO podem virar superfície de parceiro,
  drift de migration já causou incidente (FX-10), time de 1, zero parceiros integrados hoje.
- **Decisão (D-15)**: Partner API v1 — superfície nova `/api/v1/*`, REST-only, read-only,
  API key com escopos (hash, prefixo `imi_pk_`), rate limit por chave, ETag+CDN. Todo o resto
  adiado com gatilhos explícitos (tabela §3.2 do design). SDK/docs gerados da spec OpenAPI.
- Design completo: `docs/PARTNER_API_V1_DESIGN.md`. Fase 1 = 1 migration (`partner_api_keys`)
  + 6 endpoints GET + OpenAPI + testes de contrato. Piloto: Mano Imóveis.
- **GATE**: nada implementado nesta sessão — auth/banco exigem aprovação explícita do dono.
  Se o dono aprovar, a Fase 1 começa pela migration + `withPartnerAuth()` + `/api/v1/developments`.
- Branch: `claude/imi-saas-platform-design-el33oi` (PR draft, só documentação).
