# IMI Partner API v1 — Guia de Integração

> API B2B read-only para imobiliárias parceiras. Spec completa: `openapi-partner-v1.yaml` (mesma pasta).
> Decisão de arquitetura: D-15 (`docs/DECISION_LOG.md`) · Design: `docs/PARTNER_API_V1_DESIGN.md`.

## Autenticação

Toda requisição leva a chave no header (server-to-server; **nunca** exponha a chave em frontend):

```bash
curl -H "Authorization: Bearer imi_pk_SUACHAVE" \
  https://www.iulemirandaimoveis.com.br/api/v1/developments
```

- Escopos por chave: `developments:read`, `lots:read`, `maps:read`, `prices:read`.
- Sem o escopo `prices:read`, os campos `price_range` (empreendimento) e `price` (lote) não aparecem.
- Rate limit: **120 req/min por chave** → `429` + `Retry-After`.
- Erros: `{ "error": { "code": "...", "message": "..." } }`.

## Endpoints

| Endpoint | Escopo | O que devolve |
|---|---|---|
| `GET /api/v1/developments` | `developments:read` | Lista paginada por cursor (`?limit=&cursor=`) |
| `GET /api/v1/developments/{id}` | `developments:read` | Detalhe por UUID **ou slug** (ex.: `alto-bellevue`) |
| `GET /api/v1/developments/{id}/lots` | `lots:read` | Todos os lotes (`?status=disponivel` filtra) |
| `GET /api/v1/developments/{id}/map` | `maps:read` | GeoJSON WGS84 por camadas (lots, streets, perimeter, green_areas, amenities, street_labels) |
| `GET /api/v1/lots/{id}` | `lots:read` | Detalhe de um lote |
| `GET /api/v1/availability` | `lots:read` | Snapshot de status por lote — **endpoint de polling** |

## Polling de disponibilidade (o jeito certo)

Guarde o `ETag` da resposta e mande-o de volta; enquanto nada mudar você recebe `304` sem corpo:

```bash
# 1ª chamada
curl -sD - -H "Authorization: Bearer imi_pk_..." \
  "https://www.iulemirandaimoveis.com.br/api/v1/availability?development=alto-bellevue" \
  | grep -i etag
# → etag: W/"3f2a…"

# chamadas seguintes (a cada 30–60s)
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer imi_pk_..." \
  -H 'If-None-Match: W/"3f2a…"' \
  "https://www.iulemirandaimoveis.com.br/api/v1/availability?development=alto-bellevue"
# → 304 (nada mudou) ou 200 (novo corpo + novo ETag)
```

Para o Alto Bellevue o status combina banco + planilha comercial ao vivo (`"source": "db+live_sheet"`).
Vocabulário de status (fechado): `disponivel · reservado · vendido · em_negociacao · bloqueado`.

## Mapa em MapLibre / Mapbox GL / Leaflet

`GET /developments/alto-bellevue/map` devolve `data.layers.*` como FeatureCollections EPSG:4326:

```js
const { data } = await fetch(mapUrl, { headers }).then(r => r.json())
map.addSource('imi-lots', { type: 'geojson', data: data.layers.lots })
map.addLayer({ id: 'lots-fill', type: 'fill', source: 'imi-lots',
  paint: { 'fill-color': '#94a3b8', 'fill-opacity': 0.6 } })
// Junte com /availability pelo feature.properties.id (código "A-01") para colorir por status.
```

`georeference: "approximate"`: a geometria dos lotes é exata entre si; a âncora geográfica é aproximada até o ajuste por pontos de controle do levantamento.

## Emissão / revogação de chaves (interno IMI)

```bash
node scripts/partner/create-partner-key.mjs --name "Mano Imóveis" \
  --scopes developments:read,lots:read,maps:read,prices:read
```

A chave aparece **uma única vez** no terminal de quem emitiu; o banco guarda só o hash.
Revogar: `UPDATE partner_api_keys SET active=false, revoked_at=now() WHERE id='...';` (efeito imediato).
