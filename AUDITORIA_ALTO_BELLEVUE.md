# AUDITORIA_ALTO_BELLEVUE.md

> **FASE 0 — Auditoria** do programa _"Alto Bellevue Digital Twin Platform — Homologação → Produção"_.
>
> Regra-mãe da missão: **ZERO REGRESSÕES**. Nenhuma feature nova é implementada antes
> desta auditoria. Nenhum código de produção foi alterado nesta entrega — este documento
> é somente leitura/diagnóstico.
>
> - **Branch:** `claude/alto-bellevue-digital-twin-o550nd`
> - **Data:** 2026-06-23
> - **Ambiente de produção (NÃO TOCAR):** `/pt/imoveis/alto-bellevue`
> - **Ambiente de homologação (alvo de evolução):** `/pt/projetos/alto-bellevue`

---

## 0. Sumário executivo

O Alto Bellevue hoje é uma **ferramenta comercial madura e funcional**, mas é um **"mapa
ilustrativo" vetorial (SVG)**, não um Digital Twin georreferenciado. O coração da plataforma
(dados de lotes, preços, disponibilidade ao vivo, score IMI, comparador, CTA WhatsApp) já está
implementado e em uso real em apresentações. A lacuna central para atingir o "padrão Graff
Estate / Kredium / Streetscape / Felt" é **a ausência de um sistema de referência geográfico
real (CRS)**: toda a geometria está em **pixels de viewBox SVG** (`0 0 1200 821.86`), não em
`lat/lng`. Isso inviabiliza, sem retrabalho, camadas de satélite, terreno 3D, sobreposição com
Google Earth e a "coincidência visual com a implantação real" exigida na FASE 3.

**Diagnóstico em uma frase:** a camada de _dados, lógica e banco_ já é sólida; a camada de
_georreferenciamento e renderização_ é que precisa evoluir — e deve evoluir **em homologação**,
sem tocar na ferramenta de produção.

### Top achados (por severidade)

| # | Sev | Achado | Evidência |
|---|-----|--------|-----------|
| 1 | **S0** | Sem CRS real — geometria 100% em pixels SVG (`AB_VIEWBOX = 1200×821.86`). Bloqueia satélite/3D/terreno/Google Earth (FASES 2,3,6,7,8) | `src/lib/lots/alto-bellevue.ts:16` |
| 2 | **S1** | **Três engines de mapa** coexistem (`AltoBellevuePlanView` ~3,2k linhas, `SubdivisionLotMap` wrapper, `InteractiveLotMap` genérico) — fragmentação de renderização | ver §2.1 |
| 3 | **S1** | Página de produção `[slug]/page.tsx` faz **special-case por `slug === 'alto-bellevue'`** — qualquer mudança no componente compartilhado afeta produção | `imoveis/[slug]/page.tsx:379` |
| 4 | **S1** | Áreas comuns: o mapa canônico expõe **apenas 6 pontos**; a FASE 4 exige ~19 áreas com polígono real, mídia e CTA | `public/maps/alto-bellevue-lots.json` (`amenities[]`) |
| 5 | **S1** | Pista de cooper é **marcador**, não rota (sem percurso/distância/elevação/waypoints) — FASE 5 | inexistente no canônico |
| 6 | **S2** | Dois JSONs de lotes divergentes: canônico (`public/maps`, 383 lotes) vs legado corrompido (`public/data`, 426 entradas, duplicados) | `src/lib/lots/alto-bellevue.ts:3-8` |
| 7 | **S2** | Disponibilidade ao vivo depende de **uma planilha Google via CSV público** hardcoded para o AB | `src/lib/lots/alto-bellevue-availability.ts:12` |
| 8 | **S2** | Homologação (`/projetos/alto-bellevue`) ainda é **uma página enxuta** (hero + mapa + 3 cards + CTA) — não tem ainda galeria, áreas comuns, localização, inteligência da página de produção | `projetos/alto-bellevue/page.tsx` |

> **Nota de contexto:** já existem auditorias anteriores relevantes que esta consolida e referencia:
> `AUDITORIA_MAPA_ALTO_BELLEVUE.md`, `docs/AUDITORIA_IMI_SPATIAL_ENGINE_2026-06-19.md`,
> `docs/alto-bellevue/AUDITORIA_E_ROADMAP_V2.md`, `docs/AUDITORIA_MAPAS_AB_MM_2026-06-20.md`.

---

## 1. Estratégia de ambientes (homologação → produção)

| Ambiente | Rota | Arquivo | Papel |
|----------|------|---------|-------|
| **Produção** | `/[lang]/imoveis/alto-bellevue` | `src/app/[lang]/(website)/imoveis/[slug]/page.tsx` (`slug === 'alto-bellevue'`) | **Imutável.** Ferramenta comercial em uso. |
| **Homologação** | `/[lang]/projetos/alto-bellevue` | `src/app/[lang]/(website)/projetos/alto-bellevue/page.tsx` | **Alvo de evolução.** Já existe e renderiza `SubdivisionLotMap`. |

**Risco arquitetural #1:** a homologação **reutiliza os mesmos componentes** da produção
(`SubdivisionLotMap` → `AltoBellevuePlanView`). Logo, "evoluir só em homologação" **não está
isolado por padrão**: editar `AltoBellevuePlanView.tsx` muda os dois ambientes ao mesmo tempo.

**Recomendação de isolamento (pré-requisito da FASE 1):** introduzir um _feature flag_ /
namespace de componentes para homologação — por exemplo `components/digital-twin/*` consumidos
exclusivamente pela rota `/projetos/alto-bellevue`, deixando os componentes de `imoveis/components/*`
congelados. Promoção para produção = trocar o import na página `[slug]` (atômico, com rollback
imediato). Isso materializa a "PROMOÇÃO PARA PRODUÇÃO" do briefing sem migração destrutiva.

---

## 2. Arquitetura atual

### 2.1 Engines de mapa (fragmentação)

| Componente | Caminho | Linhas | Papel |
|------------|---------|-------:|-------|
| `AltoBellevuePlanView` | `imoveis/components/AltoBellevuePlanView.tsx` | ~3,2k | Mapa premium real do AB (SVG nativo, zoom por viewBox, lotes, áreas comuns, comparador, fullscreen) |
| `SubdivisionLotMap` | `imoveis/components/SubdivisionLotMap.tsx` | ~1,8k | Wrapper público (lista + planta, score IMI, rankings, smart filters, modal de lote, comparador) |
| `InteractiveLotMap` | `components/maps/InteractiveLotMap.tsx` | ~1,2k | Engine genérico/legado (outros loteamentos); já suporta `videos[]` |

> Unificar os três é trabalho de **médio prazo e alto risco** — não fazer sem plano aprovado.

### 2.2 Fonte de dados (geometria)

- **Canônico:** `public/maps/alto-bellevue-lots.json` — `viewBox`, 383 `lots`, `streets` (194),
  `greenAreas`, `perimeter`, `brLine`, `streetLabels`, `entrance`, `amenities` (6).
- **Legado (corrompido):** `public/data/alto-bellevue-lots.json` (426 entradas, duplicados) — a
  desativar/remover após confirmação.
- **Preços:** `public/data/alto-bellevue-prices.json` (lazy-loaded ao abrir um lote).
- **Loader:** `src/lib/lots/alto-bellevue.ts` (`loadAltoBellevueMap`, `AB_VIEWBOX`, `AB_MAP_VERSION = 5`).
- **Banco:** Supabase `subdivision_lots` (RLS), consultado por `SubdivisionLotMap`.

### 2.3 Disponibilidade em tempo real

```
Google Sheets (CSV público)  →  parseAvailabilityCSV  →  use-ab-availability (hook, ~60–90s)
                                                              │
subdivision_lots (Supabase) ─────────────────────────────────┤→ resolveLotStatus
public/maps canônico (snapshot) ─────────────────────────────┘   (live > canônico > banco)
```

- `src/lib/lots/alto-bellevue-availability.ts` · `src/hooks/use-ab-availability.ts`
- API: `src/app/api/developments/alto-bellevue/availability` · cron `expire-reservations`.

### 2.4 Pipeline de mídia das áreas comuns

```
Backoffice /backoffice/imoveis/[id]/mapa
  → POST /api/upload?bucket=media&folder=alto-bellevue-areas   (Supabase Storage)
  → PUT  /api/developments/[id]/map-amenities                  (developments.lot_map_amenities JSONB)
Público (SSR) [slug]/page.tsx → lot_map_amenities → SubdivisionLotMap → AltoBellevuePlanView
```

- Backoffice expõe **8 slots fixos**; canônico tem **6 pontos clicáveis**.
- Campos por área: `title, subtitle, description, fn, photos[], videos[], video, tour360`.
- Tour 360°: Kuula (`kuula.co`), aberto externamente — **URL imutável** (ver
  `.claude/ALTO_BELLEVUE_LOCATION.md`).

### 2.5 Camada comercial / CRM

- `src/lib/lotmap/` → `cart.ts`, `compare.ts`, `engine.ts`.
- Tabelas (migration `20260614_lotmap_crm_engine.sql`): `brokers`, `development_users`,
  `lot_proposals` (com RLS).
- API: `/api/lots`, `/api/lots/reserve`, `/api/lotmap`, `/api/lotmap/negotiate`,
  `/api/intelligence/lots`, `/api/intelligence/lots/recommend`.
- Frontend atual do mapa já entrega: **comparar**, **score IMI**, **rankings**, **smart filters**,
  **modal com planos de pagamento**, **CTA WhatsApp**.

### 2.6 Inteligência imobiliária (já existente)

- `SubdivisionLotMap` computa client-side: `investment`, `living`, `costBenefit`, `liquidity`,
  tags ("Melhor custo-benefício", "Lote de esquina"…), e rankings top-3.
- `src/lib/intelligence/`, `src/lib/invest/`, `src/lib/valuation/` disponíveis para reaproveitar.

### 2.7 Stack confirmada

Next.js 14 (App Router) · Supabase (SSR + Storage, RLS) · TypeScript · Tailwind · Framer Motion ·
`mapbox-gl`/`maplibre-gl` (presentes nas deps, **não usados** no AB) · Sentry · Vercel · Jest + Playwright.

---

## 3. Gap analysis — estado atual vs. as 12 fases do briefing

| Fase | Tema | Estado atual | Gap |
|------|------|--------------|-----|
| 1 | Correções críticas (mídia/tours/vídeos/uploads/sync) | Pipeline existe e funciona | Validar cada slot; cobrir com testes; sync planilha resiliente |
| 2 | Digital Twin Foundation (GeoJSON/polígonos/metadados) | Polígonos em **px SVG** | **Faltando CRS real.** Gerar GeoJSON `lat/lng` a partir de DWG/DXF/PDF/Google Earth |
| 3 | Georreferenciamento (coincidência com implantação) | Inexistente | **Faltando.** Tolerância zero exigida |
| 4 | Áreas comuns reais (~19 itens) | 6 pontos | Mapear ~13 áreas restantes com polígono + mídia + CTA |
| 5 | Pista de cooper (rota) | Marcador | **Faltando** percurso/distância/elevação/waypoints |
| 6 | Motor de camadas (técnica/comercial/satélite/noturna/…) | Camadas SVG limitadas | Faltando satélite/topografia/infra/noturna reais |
| 7 | Experiência Graff-level (fly-to/smooth zoom/cluster) | Zoom por viewBox, hover, fullscreen | Faltando fly-to, agrupamento, virtualização |
| 8 | Visual premium (terreno/vegetação/sombras/3D) | SVG plano | **Faltando** (depende da FASE 2) |
| 9 | Inteligência imobiliária (score/heatmap/solar/demanda) | Score/ranking/tags ✔ | Faltando heatmap, incidência solar, mapa de demanda |
| 10 | Experiência comercial (comparar/favoritar/reservar/proposta) | Comparar ✔, WhatsApp ✔, reserva (API) parcial | Faltando favoritar, agendar, simular, gerar proposta no front de homologação |
| 11 | Analytics (eventos/heatmap/conversão) | `EngagementTracker`, tracking de links | Faltando eventos por lote/quadra/área e conversão |
| 12 | Testes (`validate-map`, mobile, a11y, Lighthouse, regressão visual) | `validate:lots`, Jest, Playmoke/critical | Faltando `validate-map`, a11y, Lighthouse, regressão visual |

---

## 4. Banco de dados, buckets e APIs

- **Tabelas:** `developments` (inclui `lot_map_amenities`, `virtual_tour_url`, `lot_map_enabled`,
  `development_commercial_config`), `subdivision_lots`, `brokers`, `developers`,
  `development_users`, `lot_proposals`, `lot_reservations`.
- **Storage:** bucket `media` (pasta `alto-bellevue-areas`), bucket `avatars`.
- **Migrations-chave:** `20260516_subdivision_lots`, `20260518_alto_bellevue_lots`,
  `20260529_alto_bellevue_official_prices`, `20260602_lot_map_fields`,
  `20260603_lot_reservations`, `20260604_alto_bellevue_lot_availability`,
  `20260614_lotmap_crm_engine`.
- **RLS:** leitura pública nas tabelas comerciais; escrita restrita a manager/admin. Páginas
  públicas usam `supabaseAdmin` (bypass de RLS) no servidor — manter esse padrão.

---

## 5. Débitos técnicos e riscos

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Homologação compartilha componentes com produção | **Alta** | Namespace `digital-twin/*` + feature flag antes de qualquer evolução |
| Sem CRS — bloqueia metade das fases | **Alta** | FASE 2 dedicada: pipeline DWG/DXF → GeoJSON (georreferência com pontos de controle do Google Earth) |
| Planilha Google como fonte de disponibilidade | Média | Fallback resiliente + cache; plano de migração para `subdivision_lots` como fonte única |
| JSON legado corrompido em `public/data` | Média | Confirmar não-uso e remover; testes garantindo só o canônico |
| 3 engines de mapa | Média | Unificação só com plano aprovado (médio prazo) |
| Componente AB de ~3,2k linhas | Baixa | Refatorar incrementalmente em homologação |

---

## 6. Roadmap recomendado (sprints, com portões de aprovação)

> Cada sprint segue o ciclo obrigatório: **criar testes → validar testes → build → mobile →
> desktop → acessibilidade** antes de qualquer merge.

1. **Sprint 0 — Isolamento (pré-requisito):** namespace de componentes de homologação + flag,
   garantindo ZERO impacto em `/imoveis/alto-bellevue`. Snapshot/regressão visual da produção
   como baseline.
2. **Sprint 1 — FASE 1 (mídia):** auditar e cobrir com testes cada slot de foto/vídeo/tour;
   tornar o sync da planilha resiliente.
3. **Sprint 2 — FASE 2/3 (Digital Twin Foundation + georreferenciamento):** pipeline
   DWG/DXF/PDF → GeoJSON `lat/lng`; validação de coincidência com a implantação real.
4. **Sprint 3 — FASE 4/5 (áreas comuns reais + pista de cooper como rota).**
5. **Sprint 4 — FASE 6/7/8 (motor de camadas + experiência + visual premium).**
6. **Sprint 5 — FASE 9/10/11 (inteligência + comercial + analytics).**
7. **Sprint 6 — FASE 12 (`validate-map`, a11y, Lighthouse, regressão visual) + RELATORIO_FINAL /
   CHECKLIST_PRODUCAO / PLANO_ROLLBACK.**

**Promoção:** somente após aprovação explícita, trocar o import na página `[slug]` (ou flag) para
apontar a produção ao componente homologado, mantendo rollback imediato.

---

## 7. Critérios de "auditoria concluída" (FASE 0) — checklist

- [x] Arquitetura atual mapeada (engines, dados, banco, buckets, APIs, mídia, sync)
- [x] Estratégia homologação→produção documentada com risco de acoplamento identificado
- [x] Gap analysis contra as 12 fases
- [x] Débitos técnicos e riscos com mitigação
- [x] Roadmap por sprints com portões de aprovação
- [x] Nenhuma alteração em código de produção nesta entrega

---

> **Próximo passo sugerido (requer seu aval):** iniciar o **Sprint 0 (Isolamento)** — criar o
> namespace de componentes de homologação para que toda a evolução do Digital Twin ocorra sem
> qualquer risco para a página comercial de produção. Nada será implementado até sua aprovação.
</content>
</invoke>
