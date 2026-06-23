# Alto Bellevue V2 — Auditoria, Relatório de Impacto e Roadmap

> Documento de governança para a missão "Alto Bellevue V2 — nível Graff Estate".
> Atende à **Etapa 01 (Auditoria Completa)** e estabelece o plano faseado para as
> Etapas 02–15. Regra-mãe da missão: **NÃO QUEBRAR NADA / ZERO REGRESSÕES**.

**Status:** auditoria concluída · fix #1 (mídia) aplicado nesta branch.
**Branch:** `claude/alto-bellevue-v2-platform-vck0i3`
**Data:** 2026-06-23

---

## 1. Mapa da arquitetura atual (Etapa 01)

### 1.1 Componentes de mapa (há 3 implementações)

| Componente | Caminho | Uso atual |
|---|---|---|
| `AltoBellevuePlanView` | `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx` (~2.8k linhas) | **Mapa público real do Alto Bellevue** (renderizado dentro de `SubdivisionLotMap`). SVG nativo com zoom por viewBox, lotes, áreas comuns, comparador, fullscreen. |
| `SubdivisionLotMap` | `src/app/[lang]/(website)/imoveis/components/SubdivisionLotMap.tsx` (~1.8k linhas) | Wrapper público. Recebe `mapAmenities` do servidor e repassa como `amenityOverrides`. |
| `InteractiveLotMap` | `src/components/maps/InteractiveLotMap.tsx` | Mapa genérico/legado (outros loteamentos). Usa `AmenityMediaModal` e busca mídia via fetch client-side. **Já suporta `videos[]`.** |

> **Achado arquitetural:** três engines de mapa coexistem. É a fragmentação que a
> missão aponta ("não tratar como mapa SVG / Digital Twin"). Unificar é trabalho de
> médio prazo (ver Roadmap) — **não** deve ser feito sem plano aprovado, pois é o
> maior risco de regressão do projeto.

### 1.2 Fonte de dados (geometria — "fonte da verdade" atual)

- `public/maps/alto-bellevue-lots.json` — viewBox, lotes (`A-01`…), `streets`,
  `greenAreas`, `perimeter`, `brLine`, `streetLabels`, `entrance`, `amenities`.
- `public/data/alto-bellevue-lots.json` e `public/data/alto-bellevue-prices.json`.
- Loader: `src/lib/lots/alto-bellevue.ts` (`loadAltoBellevueMap`, `AB_VIEWBOX`, type `Amenity`).
- Disponibilidade em tempo real: `src/hooks/use-ab-availability.ts` +
  `src/lib/lots/alto-bellevue-availability.ts`.

### 1.3 Pipeline de mídia das áreas comuns

```
Backoffice (/backoffice/imoveis/[id]/mapa)
  → POST /api/upload?bucket=media&folder=alto-bellevue-areas   (Supabase Storage)
  → PUT  /api/developments/[id]/map-amenities                  (developments.lot_map_amenities JSONB)
Público ([slug]/page.tsx, SSR)
  → lê data.lot_map_amenities → SubdivisionLotMap → AltoBellevuePlanView (amenityOverrides)
```

- Backoffice (`AREA_META`) expõe **8 slots fixos**: `portaria`, `lazer`,
  `coworking`, `recreativa-01/02/03`, `area-verde`, `capela`.
- O mapa canônico (`amenities[]`) hoje tem **6 pontos clicáveis**: `portaria`,
  `lazer`, `coworking`, `recreativa-01/02/03`.
- Campos por área: `title, subtitle, description, fn, photos[], videos[], video, tour360`.

### 1.4 Stack confirmada

Next.js 14 (App Router) · Supabase (SSR + Storage, RLS) · TypeScript · Tailwind ·
Framer Motion · `mapbox-gl`/`maplibre-gl` (presentes nas deps, **não** usados no
mapa do Alto Bellevue, que é SVG) · Sentry · Vercel.

---

## 2. Diagnóstico do "BUG CRÍTICO" de mídia (Etapa 06)

Investigação ponta-a-ponta do porquê "fotos/vídeos/tours não aparecem":

| # | Sintoma | Causa-raiz | Situação |
|---|---|---|---|
| A | **Vídeos enviados não aparecem** | `videos[]` (uploads MP4) era descartado: ausente em `Amenity` (lib), `AmenityInfo`, `getAmenityInfo`, e o sheet só renderizava `video` (iframe único). | ✅ **Corrigido nesta branch** (aditivo). |
| B | Fotos enviadas "não aparecem" para certas áreas | `area-verde` e `capela` existem como slots no backoffice mas **não** como pontos clicáveis no `amenities[]` canônico → não há onde clicar no mapa público. | ⚠️ Pendente (Etapa 04 — exige adicionar pontos geo-referenciados; precisa de plano). |
| C | Tour 360° | Funciona via `tour360`/fallback global. Sem bug confirmado. | ℹ️ OK |

### Correção aplicada (A) — aditiva, zero regressão

Arquivos:
1. `src/lib/lots/alto-bellevue.ts` — `Amenity` ganha `videos?: string[]`.
2. `AltoBellevuePlanView.tsx` — `AmenityInfo` ganha `videos`; `getAmenityInfo`
   propaga `videos: a.videos ?? base.videos`.
3. `AltoBellevuePlanView.tsx` — `AmenityBottomSheet` renderiza bloco
   `<video controls playsInline>` quando `info.videos?.length > 0`.

Por que é seguro: o bloco novo só aparece quando há vídeos enviados; nenhum caminho
existente muda. O mapa legado (`InteractiveLotMap`) já tratava `videos[]`.

---

## 3. Relatório de impacto desta entrega

- **Rotas alteradas:** nenhuma.
- **Contratos de API alterados:** nenhum (schema já aceitava `videos[]`).
- **Migrações de banco:** nenhuma.
- **Componentes refeitos/removidos:** nenhum.
- **Superfície da mudança:** 1 campo de tipo + 3 trechos de render aditivos.
- **Risco de regressão:** mínimo (aditivo, condicional a dado novo).

---

## 4. Roadmap faseado (Etapas 02–15)

Ordem respeita a regra "corrigir o existente antes de novas features".
Cada fase = 1 PR isolado, com relatório de impacto e sem substituir código funcional.

**Fase 1 — Saneamento de mídia (em andamento)**
- [x] Vídeos enviados aparecem no mapa público (este PR).
- [ ] Auditar `/api/upload` (buckets/permissões/RLS) e galeria de fotos por área.
- [ ] Cobrir slots órfãos (`area-verde`, `capela`) — alinhar backoffice ↔ canônico.

**Fase 2 — Paridade de áreas comuns (Etapa 04)**
- [ ] Mapear os ~20 equipamentos oficiais (lista da planta) como pontos/polígonos
      geo-referenciados a partir do DWG/DXF/PDF — fonte única da verdade.
- [ ] Backoffice dinâmico (slots derivados do canônico, sem hardcode de 8).

**Fase 3 — Georreferenciamento real (Etapa 02)**
- [ ] Pipeline DWG/DXF → GeoJSON com âncoras reais (validar vs Google Earth).
- [ ] `npm run validate-map` (Etapa 15): polígonos, coordenadas, mídia.

**Fase 4 — Pista de cooper (Etapa 05)** · traçado, altimetria, distância.

**Fase 5 — Sistema de camadas (Etapa 03)** · alternância de layers.

**Fase 6 — Premium/UX/animações (Etapas 07, 09, 10)** · modais, fly-to, skeletons.

**Fase 7 — Venda/Investidor (Etapas 08, 11, 12)** · CTAs, heatmap, valorização.

**Fase 8 — Performance/Mobile/Validação (Etapas 13–15)** · Lighthouse > 95.

> **Decisão pendente de aprovação do produto:** manter o engine SVG atual e
> evoluí-lo (menor risco) vs. migrar para um engine geográfico (Mapbox/MapLibre —
> já nas deps) para satélite/topografia reais. Recomendação: **híbrido** — manter
> SVG para o masterplan estilizado e adicionar camada geográfica opcional.

---

## 5. Como validar o fix desta branch

1. Backoffice → Imóveis → Alto Bellevue → Mapa/Áreas Comuns → enviar um vídeo
   (ex.: em "Portaria Principal" ou "Área de Lazer") → Salvar.
2. Página pública `/pt/imoveis/alto-bellevue` → abrir a mesma área no mapa →
   o vídeo enviado aparece com player nativo (controles), abaixo da galeria.
