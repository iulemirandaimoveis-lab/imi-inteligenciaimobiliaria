# IMI Geo Intelligence Engine

> Camada de inteligência geográfica em tempo real para o motor de mapas da IMI.
> Módulo independente, provider-agnóstico e **parametrizado por empreendimento**
> (nunca específico de um único).
>
> **Status:** v1 (fundação) — entregue. Fases seguintes no [Roadmap](#roadmap).

---

## 1. Por que este módulo existe

O repositório já tinha lógica de POIs **fragmentada** em 3 rotas com contratos
diferentes e 2 tabelas de cache:

| Rota legada | Fonte | Cache | Tipos |
|---|---|---|---|
| `GET /api/pois` | Google Places → OSM fallback | `poi_cache` | `@/types/poi` |
| `GET /api/developments/[id]/pois` | Overpass (`getOrFetchPOIs`) | `property_pois` | `poi-service.ts` |
| `GET /api/intelligence/pois` | Overpass (`fetchNearbyPOIs`) | — | `poi-service.ts` |

Sem abstração de provedor, sem fallback padronizado, sem observabilidade, com
chaves lidas de forma _ad hoc_. O Geo Intelligence Engine **unifica** isso atrás
de um único contrato (`GeoProvider`) e um único tipo de saída (`GeoIntelligence`),
sem reescrever nem quebrar as rotas existentes.

## 2. Princípios

1. **Provider-agnóstico** — Google, OSM/Overpass, Mapbox e banco IMI implementam
   a mesma interface `GeoProvider`. Trocar de fornecedor = trocar a ordem do
   registry, nada mais muda.
2. **Parametrizado** — o consumidor passa `{ center, radius, profile }`. Nada é
   específico de Alto Bellevue/Jazz/Miguel Marques.
3. **Superset de dados** — `GeoPOI` carrega nome, categoria, coordenadas,
   telefone, website, horário, nota, nº de avaliações, ícone, distância e
   **tempos de deslocamento** (carro/caminhada/bicicleta/transporte).
4. **Nunca depende de scraper** — OSM/Overpass é a base confiável e sem chave.
   Scraper/banco IMI entram só como enriquecimento.
5. **Chaves só no servidor** — providers são instanciados apenas dentro de
   `/api/geo/*`. O cliente usa `usePOIs`, que fala com a rota. Zero segredo no bundle.
6. **Aditivo e sem regressão** — nenhum componente de mapa existente foi tocado.

## 3. Estrutura de pastas

```
src/geo/
  types/            index.ts        # GeoPOI, GeoProvider, GeoIntelligence, Isochrone…
  config/           categories.ts   # catálogo parametrizado de todas as camadas + perfis
  providers/
    registry.ts                     # ProviderRegistry (fallback + observabilidade)
    index.ts                        # buildDefaultRegistry() (lê env server-side)
    osm/OverpassProvider.ts         # OpenStreetMap/Overpass (sem chave) — baseline
    google/GooglePlacesProvider.ts  # Google Places (enriquecimento, atrás de chave)
    mapbox/MapboxProvider.ts        # scaffold (indisponível até integração)
  services/
    pois/index.ts                   # orquestrador getGeoIntelligence()
    geocoding/index.ts              # geocode() (envolve lib/geocode.ts)
    isochrones/index.ts             # computeIsochrones() (radial v1)
  cache/            index.ts        # GeoCache + MemoryGeoCache (TTL/LRU)
  observability/    index.ts        # métricas em ring buffer + logs [geo]
  utils/            distance.ts, travel-time.ts
  hooks/            usePOIs.ts      # hook SWR (client) → /api/geo/pois
  index.ts                          # barrel público

src/app/api/geo/
  pois/route.ts                     # GET unificado (zod + rate limit + cache)
  health/route.ts                   # GET saúde dos providers + métricas
```

## 4. Fluxo de dados

```
Client (usePOIs)                Server (/api/geo/pois)              Providers
     │  lat,lng,profile               │                                 │
     ├──────────────────────────────► │ zod + rate limit                │
     │                                │ getGeoIntelligence()            │
     │                                │   ├─ cache.get() ──► MemoryGeoCache
     │                                │   ├─ registry.fetchWithFallback ┤
     │                                │   │      Google? → OSM → Mapbox  │ (1º com dados vence)
     │                                │   ├─ dedupe + travel times       │
     │                                │   ├─ score por categoria + geral │
     │                                │   └─ cache.set()                 │
     │ ◄──────── GeoIntelligence ─────┤                                 │
```

Cada tentativa de provider é cronometrada e registrada em
`src/geo/observability` (buffer em memória, exposto por `/api/geo/health`).

## 5. Uso

**Servidor:**
```ts
import { getGeoIntelligence, computeIsochrones } from '@/geo'

const intel = await getGeoIntelligence({
  center: { lat: dev.latitude, lng: dev.longitude },
  profile: 'residencial',          // 'residencial' | 'short_stay' | 'comercial' | 'full'
})
// intel.score, intel.categories[], intel.pois[], intel.providers[]

const iso = computeIsochrones({ lat, lng }, 'driving', [5, 10, 15, 20])
```

**Cliente:**
```tsx
import { usePOIs } from '@/geo/hooks/usePOIs'

const { categories, score, isLoading } = usePOIs({ lat, lng, profile: 'residencial' })
```

## 6. Camadas / categorias suportadas

Definidas em `src/geo/config/categories.ts` (cada uma com `osmTags`,
`googleTypes`, `radius`, `weight`, `icon`, `color`):

escolas · universidades · hospitais · farmácias · supermercados · academias ·
restaurantes · padarias · postos · shopping · bancos · transporte · áreas verdes ·
lazer · praia · cartórios · hotéis · imobiliárias · construtoras · empresas.

Perfis prontos: `residencial`, `short_stay`, `comercial`, `full`. Adicionar uma
camada nova = uma entrada no catálogo; providers, score e UI a absorvem sozinhos.

## 7. Segurança

- Chaves (`GOOGLE_PLACES_API_KEY`, `MAPBOX_TOKEN`) só server-side; nunca `NEXT_PUBLIC_`.
- `/api/geo/*` é público → **rate limit por IP** (`limiters.public`).
- `zod` valida e faz _clamp_ de lat/lng/radius.
- `/api/geo/health` revela só disponibilidade (boolean/motivo) e timings — nunca valores de chave.
- Cache agressivo (processo + edge) reduz superfície de abuso e custo de API.

## 8. Performance

- Cache TTL (`GEO_CACHE_TTL_HOURS`, default 7 dias) + `s-maxage`/`stale-while-revalidate`.
- `MemoryGeoCache` LRU reaproveitado entre requisições na mesma lambda quente.
- Chave de cache com coords arredondadas (~11m) → lookups próximos reaproveitam.
- Overpass com `AbortController`/timeout; Google com `Promise.allSettled` por categoria.
- Módulo isolado: **nenhum** peso adicionado ao bundle dos mapas existentes.

## 9. Observabilidade

`src/geo/observability` mantém um ring buffer (200 amostras) com provider,
operação, tempo, sucesso/erro e contagem. `getProviderStats()` agrega em
`{ calls, failures, avgMs }` por provider — consumido por `/api/geo/health` e,
futuramente, pelo painel de backoffice.

---

## Roadmap

Fundação (**v1, entregue**): tipos, catálogo, providers OSM/Google/Mapbox,
registry com fallback, orquestrador, cache em memória, isócronas radiais,
geocoding, observabilidade, rota `/api/geo/pois` + `/api/geo/health`, hook
`usePOIs`, testes.

| Fase | Escopo | Gatilho / dependência |
|---|---|---|
| **F2 — Painel lateral premium** | Ao clicar num lote, painel com distâncias/tempos até centro, escola, hospital, farmácia, supermercado, shopping, universidade, academia, praia. Reusa `LotDetailPanel` + `usePOIs`. | UI_REGRESSION_POLICY (screenshot antes/depois) |
| **F3 — Camadas no mapa** | Toggles de layer sobre `AltoBellevueGeoMap`/`SubdivisionLotMap` renderizando `GeoPOI` (extensão do `AmenityLayer` SVG existente). | F2 |
| **F4 — Isócronas roteadas** | Substituir aproximação radial por Mapbox Isochrone / OSRM atrás do mesmo `IsochroneSet` (`method: 'routed'`). | `MAPBOX_TOKEN` |
| **F5 — Heatmaps** | Valorização (preço/m² de `subdivision_lots`), densidade comercial, verticalização, serviços, expansão, concorrentes. Reusa `PriceHeatmap`/`WidgetHeatmap`. | dados já em `subdivision_lots.price/area_m2` |
| **F6 — Cache Supabase** | `SupabaseGeoCache` (interface `GeoCache` já pronta) para persistência cross-instância. | **AÇÃO DO DONO**: aprovar migration `geo_cache` |
| **F7 — Assistente IA** | Linguagem natural controlando o mapa ("lotes perto da escola", ">400m²"). Motor em `src/lib/intelligence/` já existe; conectar às ações do mapa. | F3 |
| **F8 — Backoffice** | Painel admin: ativar/desativar camadas, escolher providers, limpar cache, monitorar APIs (consome `/api/geo/health`). | F3 |
| **F9 — Mobile** | Bottom sheet, gestos, filtros rápidos. Reusa `use-is-mobile`. | F2 |
| **F10 — Consolidar rotas legadas** | Migrar `/api/pois`, `/api/developments/[id]/pois`, `/api/intelligence/pois` para delegar ao engine, mantendo os contratos de resposta (adapters). Depois depreciar `lib/poi-service.ts`. | v1 estável em produção |

## Plano de migração das rotas legadas (F10)

1. Adicionar adapters `toConvenienceData()` / `toLegacyPOIResult()` em
   `src/geo/services/pois/adapters.ts` que traduzem `GeoIntelligence` para os
   shapes antigos (`ConvenienceData`, `POIResult`).
2. Reescrever cada rota legada para chamar `getGeoIntelligence()` + adapter,
   **sem alterar o JSON de resposta** (contrato preservado; testado por E2E).
3. Só então marcar `lib/poi-service.ts` como `@deprecated` e planejar remoção.
4. Unificar `poi_cache`/`property_pois` no `SupabaseGeoCache` (F6) — nunca antes.

## Plano de testes

- **Unit (entregue):** `src/__tests__/geo/engine.test.ts` — distância,
  travel-time, isócronas, integridade do catálogo, fallback do registry,
  orquestração + cache (14 testes, sem rede).
- **Contrato (F10):** snapshot do JSON das rotas legadas antes/depois da migração.
- **E2E (F2/F3):** painel do lote abre e mostra distâncias; toggles de layer
  adicionam/removem marcadores; `expectNoHorizontalOverflow`.
- **Provedores (opcional):** testes de integração _gated_ por chave, fora do gate de CI.

## Plano de rollback

O módulo é **puramente aditivo** — nenhuma rota ou componente existente foi
alterado. Rollback = remover `src/geo/`, `src/app/api/geo/` e
`src/__tests__/geo/` (e reverter as linhas do `.env.local.example`). As 3 rotas
de POI legadas continuam funcionando exatamente como antes. Nenhuma migration
de banco foi aplicada; nada a reverter no Supabase.
