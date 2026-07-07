# Completion — IMI Geo Intelligence Engine v1 (fundação)

**Data**: 2026-07-06 · **Branch**: `claude/imi-geo-intelligence-engine-vyix5f`

## Objetivo
Transformar o mapa de cada empreendimento numa plataforma de inteligência geográfica,
começando por uma **fundação enterprise, aditiva e provider-agnóstica** — sem reescrever
o motor de mapas já existente e sem quebrar nada.

## Auditoria (feita antes de qualquer código)
- Motor de mapas maduro já existe: `AltoBellevueGeoMap` (1498 l), `SubdivisionLotMap` (2038 l),
  `PropertyMap`, `AerialSatelliteMap`, `JazzBoulevardViewer`, `AmenityLayer` (SVG).
- Lógica de POI **fragmentada**: 3 rotas (`/api/pois`, `/api/developments/[id]/pois`,
  `/api/intelligence/pois`), 2 tabelas de cache (`poi_cache`, `property_pois`), 2 sistemas de tipos.
- Utilitários reaproveitáveis: `lib/geocode.ts` (Nominatim), `lib/rate-limit.ts` (`limiters.public`,
  `getClientIP`), haversine em `lib/poi-service.ts`.

## Entregue
Módulo novo `src/geo/` (types, `config/categories.ts` com 20 camadas parametrizadas, providers
OSM/Google/Mapbox atrás de `GeoProvider` + `ProviderRegistry` com fallback, `getGeoIntelligence`,
cache TTL/LRU em memória, isócronas radiais, geocoding, observabilidade, `usePOIs`). Rotas
`GET /api/geo/pois` e `/api/geo/health`. Doc completa em `docs/GEO_INTELLIGENCE_ENGINE.md`.

## Validação
- `npm run type-check`: 0 erros.
- `src/__tests__/geo/engine.test.ts`: 14/14 (sem rede).
- `eslint` no módulo: limpo.
- Sem migration de banco (invariante respeitado). Zero alteração em rotas/componentes existentes.

## Reuso (padrões seguidos)
- P1 (route handler: RL → zod → lógica), P4 (import dinâmico não necessário aqui), chaves só
  server-side (A5), `limiters.public` + `getClientIP` reaproveitados, `lib/geocode.ts` envolvido.

## Não feito (roadmap por design)
Painel lateral premium, camadas no mapa, heatmaps, assistente IA, backoffice, bottom sheet mobile —
interfaces tipadas prontas; fases F2–F10 no doc. Escopo mantido revisável e sem regressão.

## Rollback
Puramente aditivo: remover `src/geo/`, `src/app/api/geo/`, `src/__tests__/geo/` e reverter as
linhas do `.env.local.example`. Rotas de POI legadas seguem intactas.
