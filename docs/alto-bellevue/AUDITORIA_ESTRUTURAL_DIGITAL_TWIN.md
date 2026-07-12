# Alto Bellevue — Auditoria Estrutural (pré-Digital Twin)

> Auditoria **somente leitura**. Nenhuma implementação foi feita.
> Objetivo: comprovar, com evidências do código, se a fundação suporta evoluir
> para um Digital Twin nível Graff Estate **sem reescrita**.
> Data: 2026-06-23 · Base: `main` (pós-merge #306).

---

## 1. MAPA

| Item | Situação real (evidência) |
|---|---|
| Tecnologia | **SVG nativo** renderizado em React (`AltoBellevuePlanView.tsx`). **Não** usa Mapbox/Leaflet/MapLibre para o Alto Bellevue (essas libs existem nas deps, mas só são usadas em `PropertyMap` da seção "Localização"). |
| Sistema de coordenadas | **Cartesiano local de SVG** — `viewBox "0 0 1200 821.86"`. **Não** é lat/lng, **não** é UTM, **não** tem projeção. |
| Formato dos lotes | Polígonos como string SVG `points` (ex.: `"1029.55,187.93 1018.06,191.66 …"`). 383 lotes. Cada lote tem `area`, `status`, `price`, parcelamento (`p12/p36/p60/p120`), `labelX/Y`. |
| Formato das ruas | 194 polilinhas SVG (`streets[]`, mesmas coordenadas SVG). |
| Áreas comuns | 6 pontos `{id,label,icon,color,x,y}` (x,y em SVG) + 9 `greenAreas` (pontos). |
| Perímetro / BR | `perimeter` (1 anel SVG) e `brLine` (polilinhas) — também SVG. |
| Origem dos dados | **JSON** `public/maps/alto-bellevue-lots.json`, **gerado a partir do DXF** via pipeline `scripts/cad/` (`extract-dxf.mjs` → `build-transform.mjs` → `build-lots.mjs`). |

**Conclusão (1):** a fonte é **DWG/DXF → (parser) → transform afim → SVG/JSON**.
Não é GeoJSON nem banco geográfico. Os dados de geometria vivem em **arquivo
estático**, não no Supabase.

### Fato crítico (positivo): existe um transform afim CAD↔SVG validado
`scripts/cad/build-transform.mjs` recupera, por mínimos quadrados, a transformação
afim entre os centróides dos lotes do CAD (copy 1) e os do SVG atual, com
**resíduo ≈ 0,03 unidades SVG** (mean). Isso significa que **o SVG é uma imagem
afim fiel do CAD** — a malha de lotes/ruas/perímetro **coincide com o DWG**.
Os coeficientes (`M`), o resíduo e pontos-chave ficam em `.cache/transform.json`.

---

## 2. ÁREAS COMUNS

### 2.1 Pontos clicáveis que existem hoje (`amenities[]` canônico)

| id | nome | coord (SVG) | tipo | fotos? | vídeos? | tour? | no mapa? | posição |
|---|---|---|---|---|---|---|---|---|
| portaria | Portaria Principal | 1030.5, 181.5 | acesso | default | via backoffice | herda global | ✅ | ✅ **CAD-real** (GUARITA) |
| lazer | Área de Lazer / Clube | 1028.5, 145.5 | clube | default (5) | via backoffice | ✅ global | ✅ | ✅ **CAD-real** (PISCINA) |
| coworking | Coworking · Bloco Adm. | 1035, 192.5 | adm | — | via backoffice | — | ✅ | ⚠️ **aproximada** (CAD tem "BLOCO ADM" extraído mas **não aplicado**) |
| recreativa-01 | Área Recreativa 01 | 1018.66, 149.23 | esporte | default | via backoffice | — | ✅ | ⚠️ **aproximada** (empilhada no canto sup. dir.) |
| recreativa-02 | Área Recreativa 02 | 724.89, 159.77 | esporte | default | via backoffice | — | ✅ | ⚠️ aproximada |
| recreativa-03 | Área Recreativa 03 | 393.05, 563.48 | esporte | default | via backoffice | — | ✅ | ⚠️ aproximada |
| area-verde (×9) | Área Verde 01–09 | greenAreas[] | paisagismo | default | — | — | ✅ (dots) | ✅ **CAD-real** (rótulos "ÁREA VERDE NN") |

### 2.2 Slot do backoffice **órfão** (sem ponto no mapa)
- `capela` — existe no editor (`AREA_META`) e em texto, mas **não há ponto clicável**
  no mapa. Quem subir mídia ali não vê nada. (O CAD tem "BLOCO ADM"/"ACESSO" mas
  não extrai capela hoje.)

### 2.3 Equipamentos oficiais (planta) **NÃO mapeados** como pontos/polígonos
Da lista oficial "Equipamentos", **não existem** como entidades clicáveis:
Pórtico de Acesso, Guarita (separada), Acesso de Serviço, Prédio Administrativo,
**Quadra Poliesportiva, Quadra Society, Quadras de Areia**, Capela, Marco e Mirante,
**Piscina coberta aquecida**, **Piscina descoberta**, Vestiários, **Espaço Grill**,
**Fire Pit**, **Espaço Gourmet**, **Academia (Espaço Fit)**, Salão de Festas (200p),
Coworking (ponto real), **Pista de Cooper**.
→ Hoje são, na melhor hipótese, *tags* dentro do modal do "Clube" (`CLUBE_EQUIPAMENTOS`),
**não** posições reais no mapa.

**Conclusão (2):** 2 áreas em posição CAD-real (portaria, lazer) + 9 áreas verdes reais;
4 áreas aproximadas; ~14 equipamentos oficiais sem geometria; 1 slot órfão (capela).

---

## 3. MÍDIA (fluxo completo)

```
Backoffice  /backoffice/imoveis/[id]/mapa
  └─ POST /api/upload?bucket=media&folder=alto-bellevue-areas
       • auth obrigatória (supabase.auth.getUser)
       • valida tipo: jpg/png/webp/pdf/mp4/mov/avi/webm
       • limite: vídeo 500MB · imagem 50MB
       • usa admin client (bypassa RLS) se SUPABASE_SERVICE_ROLE_KEY existir
       • retorna { url: publicUrl }  (Supabase Storage, bucket "media")
  └─ PUT /api/developments/[id]/map-amenities
       • grava developments.lot_map_amenities (JSONB) com as URLs
Público  [slug]/page.tsx (SSR)
  └─ lê data.lot_map_amenities → SubdivisionLotMap → AltoBellevuePlanView
       • overrideMap por id → merge sobre o default editorial
       • render no AmenityBottomSheet
```

| Mídia | Render no mapa público | Evidência | Status |
|---|---|---|---|
| Fotos | carrossel horizontal (`info.photos.map`) + lightbox | `AmenityBottomSheet` | ✅ funciona (para áreas com ponto clicável) |
| Tour 360° | `<iframe>` Kuula + fallback global `virtual_tour_url` | idem | ✅ funciona |
| Vídeo embed (YouTube) | `<iframe>` (`info.video`) | idem | ✅ funciona |
| **Vídeos enviados (uploads)** | `<video controls>` (`info.videos[]`) | corrigido no PR #306 | ✅ **agora funciona** |

**Limitação de evidência:** não há banco/storage de produção acessível neste
ambiente para anexar prints. A comprovação aqui é **por rastreamento de código de
ponta a ponta** (upload → JSONB → SSR → render), todos os caminhos verificados.
A prova visual final deve ser feita em produção (passo em §"validar").

**Conclusão (3):** o pipeline de mídia está **funcional e consistente** após #306.
A única lacuna remanescente é **destino**: mídia só aparece em áreas que possuem
ponto clicável (capela é órfã; equipamentos do clube não têm ponto próprio).

---

## 4. GEORREFERENCIAMENTO

**Resposta: B) PARCIALMENTE georreferenciado.**

Justificativa técnica:
- ✅ **Fidelidade ao CAD:** lotes, ruas, perímetro e áreas verdes são **imagem afim
  do DXF** (resíduo ≈0,03 SVG). Internamente a planta é **métricamente coerente**
  com o parcelamento aprovado (coincide com o DWG).
- ❌ **Sem projeção geográfica:** não há transform SVG→WGS84/UTM. O mapa **não pode
  ser sobreposto** a satélite/Google Earth/Maps no estado atual. O único dado
  geográfico é o **ponto único** `development.location.coordinates` (lat/lng),
  usado isoladamente no `PropertyMap` da seção "Localização" — **desconectado** da
  malha SVG.
- ⚠️ **Áreas comuns:** só portaria/lazer/áreas-verdes têm posição CAD-real; o resto
  é aproximado/ausente.

Ou seja: **georreferenciado em relação ao CAD (frame local), porém não
georreferenciado em relação ao mundo (geodésico).**

---

## 5. DIGITAL TWIN — evolução sem reescrita?

**Resposta: PARCIALMENTE (SIM, de forma incremental — sem reescrita).**

Por que é viável sem reescrever:
1. **O transform CAD↔SVG já existe e é confiável** → adicionar uma camada
   SVG→geográfica precisa apenas de **2–3 pontos de controle** (cantos conhecidos
   via Google Earth) para derivar a projeção. Nenhuma geometria precisa ser refeita.
2. **As entidades do DXF já estão extraídas/cacheadas** (`.cache/cad-entities.json`)
   → dá para extrair os ~20 equipamentos reais por layer/label, reaproveitando
   `extract-dxf.mjs` + `build-transform.mjs`.
3. **Modelo de mídia + backoffice + API** já existem e funcionam (§3).
4. **Mapbox/MapLibre já estão instalados** → uma base de satélite/topografia pode
   ser adicionada como camada opcional sob o SVG, sem trocar o engine atual.

Limitações reais a endereçar (não são reescrita, são extensão):
- **L1 — sem projeção geodésica** (bloqueia satélite/Google Earth real).
- **L2 — amenities hardcoded/aproximadas e incompletas** (faltam ~14 equipamentos,
  capela órfã, coworking não usa a posição CAD já disponível).
- **L3 — pista de cooper inexistente** (nem geometria, nem dados).
- **L4 — geometria em arquivo estático**, não no banco → para um "twin" com
  disponibilidade/CRM na mesma fonte da verdade, parte disso deve migrar para o DB.
- **L5 — engine único (SVG)**; sistema de camadas (técnica/satélite/topografia)
  ainda não existe como abstração.

**Veredito:** a fundação é **sólida e reaproveitável**. Não há necessidade de
reescrever o mapa; o caminho é **estender** (geo-anchor + extração total do CAD +
camadas). O risco está em tratar isso como "trocar de engine" — isso, sim, seria
reescrita desnecessária e arriscada.

---

## 6. ROADMAP TÉCNICO (sprints)

**Sprint 1 — Correções obrigatórias (fundação correta)** — _em andamento_
- [x] **Publicar `npm run validate:map`** (`scripts/validate-map.mjs`) — valida estrutura,
      limites de coordenadas, integridade das áreas comuns, **alcance de mídia**
      (detecta slots órfãos) e **cobertura dos equipamentos**. Saída atual (prova):
      `erros 0`, `avisos 3` → órfão `capela`; clusters `portaria↔coworking (11.9u)` e
      `lazer↔recreativa-01 (10.5u)`; cobertura `3/20 (15%)`.
- [ ] Aplicar `coworking` na posição CAD real (`BLOCO ADM`). **Bloqueado neste ambiente:**
      depende de `scripts/cad/.cache/transform.json` + DXF, que **não estão versionados**
      no repo (gerados localmente a partir do DWG). Requer rodar `scripts/cad/extract-dxf`
      + `build-transform` + `build-lots` na máquina que tem o DWG. **Não inventar coordenada.**
- [ ] Resolver slot órfão `capela` (extrair ponto do CAD ou remover o slot do backoffice).
- [ ] Cobertura de teste do merge de mídia por id.

**Sprint 2 — Georreferenciamento**
- Definir 2–3 pontos de controle (cantos do perímetro) via Google Earth.
- Derivar transform **SVG↔WGS84** e persistir (`transform-geo.json`).
- Validar: reprojetar perímetro e conferir contra satélite (tolerância documentada).

**Sprint 3 — Áreas comuns reais**
- Extrair os ~20 equipamentos do DXF (layers/labels) como pontos/polígonos.
- Backoffice dinâmico (slots derivados do canônico, fim do hardcode de 8).
- Pista de cooper: traçado real (polilinha CAD) + extensão/altimetria.

**Sprint 4 — Camadas GIS**
- Abstração de layers (Técnica / Comercial / Satélite / Topografia / Disponibilidade).
- Base opcional Mapbox/MapLibre sob o SVG usando o transform do Sprint 2.

**Sprint 5 — Digital Twin**
- Migrar geometria de áreas comuns + disponibilidade para o banco (fonte única).
- Sincronizar DWG/DXF ↔ mídia ↔ disponibilidade ↔ CRM.

**Sprint 6 — Experiência Graff Estate**
- Fly-to cinemático, modais premium, heatmap de interesse, investidor, mobile parity,
  metas Lighthouse > 95.

> Regra de processo: **auditar → propor → executar**, 1 sprint = 1 PR, com relatório
> de impacto e sem substituir código funcional.

---

## Como obter a prova visual da mídia (produção)
1. Backoffice → Alto Bellevue → Áreas Comuns → enviar foto **e** vídeo em "Portaria"
   ou "Área de Lazer" → Salvar.
2. `/pt/imoveis/alto-bellevue` → abrir a área → conferir carrossel + player nativo.
3. (Opcional) inspecionar `developments.lot_map_amenities` no Supabase para ver as URLs.
