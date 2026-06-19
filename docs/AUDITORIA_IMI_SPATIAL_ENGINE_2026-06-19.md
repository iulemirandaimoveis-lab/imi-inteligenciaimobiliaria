# Auditoria — IMI Spatial Engine (Alto Bellevue → Miguel Marques)

> **Fase 1 do briefing "PROMPT MESTRE — MIGUEL MARQUES GEOINTELLIGENCE MAP".**
> O briefing exige: _"Antes de escrever qualquer linha de código: AUDITE COMPLETAMENTE
> o módulo Alto Bellevue (…). Crie um relatório completo. Nenhuma implementação deve
> iniciar antes da auditoria."_ Este documento é essa auditoria. **Nenhum código de
> feature foi alterado** nesta entrega.
>
> Data: 2026-06-19 · Branch: `claude/amazing-brahmagupta-tyqj7r`
> Fontes oficiais recebidas (Miguel Marques): `DXF` (13,1 MB, AutoCAD 2004),
> `DWG` (1,9 MB, AC 2007–2009), `PDF` aprovado (90 págs, 8,7 MB).

---

## 0. Sumário executivo

A plataforma **não é "um único motor geoespacial"** — é, hoje, **três renderizadores
SVG independentes** que não compartilham renderização nem contrato de dados:

| Stack | Arquivo principal | Linhas | Serve | Maturidade |
|---|---|---:|---|---|
| **AB premium** | `imoveis/components/AltoBellevuePlanView.tsx` | 3.262 | `/imoveis/[slug]`, `/empreendimentos/[slug]`, `/projetos/alto-bellevue` | Alta |
| **Genérico** | `components/maps/InteractiveLotMap.tsx` (+`useLotMap`) | 1.199 | `/empreendimentos/[slug]/mapa`, `/test-lot-map` | Média |
| **Miguel Marques** | `projetos/miguel-marques/components/InteractiveMasterplan.tsx` | 453 | `/projetos/miguel-marques` | Baixa (geometria fictícia) |

Diagnóstico central, em uma frase: **a camada de dados/lógica/banco já é razoavelmente
unificada, mas a camada de renderização e de _sourcing_ de geometria está fragmentada —
e, no caso do Miguel Marques, a geometria é inventada**, violando a regra absoluta do
briefing ("Proibido inventar geometria / aproximar lotes / simplificar quadras").

### Top 10 achados (por severidade)

| # | Sev | Achado | Evidência |
|---|---|---|---|
| 1 | **S0** | Geometria do Miguel Marques é **100% sintética** (grade uniforme 22×30 px, lago = elipse perfeita) — a fonte oficial (DXF/PDF) **nunca foi processada** | `projetos/miguel-marques/data/masterplanLayout.ts:11-51` |
| 2 | **S0** | **4+ "verdades" conflitantes** de lotes/quadras no Miguel Marques, nenhuma reconciliada com o CAD | ver §3 |
| 3 | **S1** | **Três renderizadores** duplicam zoom/pan/seleção/tooltip; "um motor" é aspiracional | §1 |
| 4 | **S1** | Não há **CRS real**: tudo em coordenadas SVG em pixel. Inviabiliza Cesium/Deck.gl/3D/drone/satélite sem retrabalho | nenhum lot-map usa `maplibre-gl` |
| 5 | **S1** | Sync de disponibilidade é **hardcoded p/ Alto Bellevue**; Miguel Marques não tem sync ao vivo; a planilha do briefing não está ligada | `hooks/use-ab-availability.ts`, `lib/lots/alto-bellevue-availability.ts:12` |
| 6 | **S1** | `engine.ts` aponta Miguel Marques p/ `/maps/miguel-marques-lots.json` que **não existe** (404); blocos `A–N` (14) divergem dos dados (19–24 quadras) | `lib/lotmap/engine.ts:200-213` vs `public/maps/` |
| 7 | **S2** | Parser da planilha só reconhece **QUADRA A–P** e layout fixo de 3 colunas → quebra em loteamentos maiores (MM vai até Z) | `lib/lots/alto-bellevue-availability.ts:74-75` |
| 8 | **S2** | Camadas avançadas do briefing **ausentes**: topografia, orientação solar, distâncias, IMI Score, modo Explorar, modo Investidor | base de dados sem campos de altitude/declividade/solar |
| 9 | **S2** | Comparação existe só no AB, **limitada a 3 lotes e sem radar chart**; MM não tem comparação | `AltoBellevuePlanView.tsx:69` (`MAX_COMPARE = 3`) |
| 10 | **S2** | Monólito de 3.262 linhas (AB) mistura render + dados + UI + comparação + WhatsApp; difícil de generalizar | `AltoBellevuePlanView.tsx` |

> Severidades: **S0** = viola regra explícita do briefing / bloqueia o objetivo · **S1** =
> estrutural, exige refdatoração antes de escalar · **S2** = relevante p/ qualidade/feature ·
> **S3** = polimento.

### Nota metodológica
Auditoria feita por leitura de código (todos os arquivos citados), análise do banco
(migrations) e **parsing direto das fontes oficiais** do Miguel Marques (DXF e PDF) para
avaliar viabilidade. `node_modules` não está instalado no ambiente desta sessão, então
`build`/`lint`/`test`/`jest` **não foram executados** aqui — os comandos de verificação
estão no §9 e devem ser rodados após `npm ci`.

---

## 1. Arquitetura real hoje (o que existe de fato)

```
                        ┌───────────────────────────────────────────────┐
   DADOS / LÓGICA       │  Supabase: developments, subdivision_lots,     │  ✅ unificado
   (razoavelmente       │  lot_status_history, reservas, RLS, RPCs       │
    compartilhado)      │  lib/lotmap/engine.ts (status, permissões,     │  ⚠️ registro
                        │  registro DEVELOPMENTS, WhatsApp)              │     parcial
                        └───────────────────────────────────────────────┘
                                  │                │                │
   RENDER (FRAGMENTADO)   ┌───────┴──────┐  ┌──────┴───────┐  ┌─────┴───────────┐
                          │ AB premium   │  │ Genérico     │  │ Miguel Marques  │
                          │ Subdivision  │  │ Interactive  │  │ Interactive     │
                          │ LotMap →     │  │ LotMap +     │  │ Masterplan      │
                          │ AltoBellevue │  │ useLotMap    │  │ (grade fictícia)│
                          │ PlanView     │  │              │  │                 │
                          │ (SVG)        │  │ (SVG)        │  │ (SVG)           │
                          └──────────────┘  └──────────────┘  └─────────────────┘
   FONTE DE GEOMETRIA      public/maps/         JSON URL          data/*.ts
                          alto-bellevue-        (404 p/ MM)        (inventado à mão)
                          lots.json (383)
```

**Famílias de rota (sprawl):** `/imoveis/[slug]`, `/imoveis/[slug]/lp`,
`/empreendimentos/[slug]`, `/empreendimentos/[slug]/mapa`, `/empreendimentos/[slug]/dashboard`,
`/empreendimentos/[slug]/crm`, `/projetos/alto-bellevue`, `/projetos/miguel-marques`,
`/test-lot-map`. `imoveis/[slug]/page.tsx` chega a importar **dois** renderizadores
(`SubdivisionLotMap` **e** `InteractiveLotMap`).

**O que está bom (preservar):**
- O **modelo de banco** (`subdivision_lots`, `developments`, `lot_status_history`,
  reservas com expiração, RLS, auditoria) é sólido e já é multi-empreendimento.
- `lib/lotmap/engine.ts` é o **embrião correto** do motor único: status canônico,
  normalização DB↔UI, papéis/permissões, registro `DEVELOPMENTS`, template WhatsApp.
- O **pipeline CAD do Alto Bellevue** (`scripts/cad/*`) e a camada `lib/lots/alto-bellevue.ts`
  (loader resiliente: timeout + retry + cache de sessão + versionamento + validação
  point-in-polygon) são maduros e devem virar a **base genérica** do motor.

---

## 2. Geometria & Cartografia

### 2.1 (S0) Miguel Marques: geometria inventada
`data/masterplanLayout.ts` é uma **grade estilizada**, não a planta:
- `CANVAS_W=2400, CANVAS_H=2100`; comentário explícito _"Lot standard: 22px wide × 30px deep"_.
- Quadras como retângulos uniformes `cols × rows` (`masterplanLayout.ts:57-123`).
- Lago = **elipse perfeita** `{cx:1780, cy:680, rx:260, ry:180}` (`:44`).
- Áreas verdes/ruas = retângulos fixos.

O renderizador atribui cada lote a uma célula **por índice de array**
(`InteractiveMasterplan.tsx:310` → `const lot = quadraLots[pos.lotIndex]`), ou seja, a
posição do lote no mapa **não tem relação com a posição real**. Isso é exatamente o que o
briefing proíbe.

### 2.2 (S0) A fonte oficial existe e nunca foi usada
Parsing direto do DXF recebido (`R07 — Planta de piso — PLANTA LOTEADA`):
- **32.084 `LINE`** + 5.867 `MTEXT` + 522 `DIMENSION` + 46 `INSERT` + 18 `HATCH`.
- Layers: `G-IMPT` (18.282), `A-DETL-THIN`, `A-ANNO-DIMS-1100`, `G-ANNO-TEXT`,
  `A-AREA-IDEN` (2.515 — identificação de áreas/lotes), `L-PLNT`.
- Textos reais: **rótulos de rua "RUA PROJETADA 01–23"**, **"ÁREA INSTITUCIONAL"**,
  números de lote (1–80) e **cotas em metros** (`8.00`, `18.90`, `8.84`…).

**Implicação técnica:** ao contrário do DXF do Alto Bellevue (que tinha `REGIAO_LOTES`
com polígonos fechados), **este DXF tem os lotes como segmentos de reta soltos** em layers
genéricas (padrão AIA), **sem polígono fechado por lote**. Reconstruir exige:
1. **Poligonizar** os 32 mil segmentos em anéis fechados (montagem de loops);
2. **Associar** cada `MTEXT` (nº do lote, cota) ao polígono que o contém (point-in-polygon);
3. **Agrupar** lotes em quadras (clusterização espacial + conferência com o PDF);
4. **Transformação afim** CAD(m) → espaço de render, como já feito no AB.

É trabalho de engenharia (não um parse trivial), mas **viável** e é o caminho correto —
o PDF aprovado de 90 páginas serve de conferência visual e provavelmente contém a tabela
oficial de áreas (extração via OCR/`poppler` no pipeline).

### 2.3 (S1) Sem CRS / sem coordenadas geográficas
Todos os mapas de lote são SVG em **pixel arbitrário**; `maplibre-gl`/`mapbox-gl` só são
usados em `components/maps/PropertyMap.tsx` (pin de imóvel avulso). Não há lat/long, nem
projeção métrica, nem _vector tiles_, nem PostGIS. **Consequência:** os futuros do briefing
(Cesium, Deck.gl, Drone Mode, IMI Atlas, satélite) ficam bloqueados até a geometria existir
em um CRS real (recomendado: armazenar em **UTM/metros** + WGS84, e projetar para o render).

---

## 3. (S0) Integridade de dados — Miguel Marques tem 4+ verdades

| Fonte | Total lotes | Quadras | Observações |
|---|---:|---|---|
| `data/lotsData.ts` (frontend em produção) | **516** | 19 (A–S sem G; +Z) | 37 lotes com **160 m²/R$ 25.000** idênticos (placeholder); D só tem 5 |
| `data/masterplanLayout.ts` (grade) | ~**1.000 células** | 23 (A–Z sem G,W,Y) | D = 38×2 = **76 células** mas dados têm 5 → bloco renderiza vazio |
| DB seed `subdivision_lots` (`20260516` + `20260520`) | ~**800** | A–S + Z | lacunas (B sem 38; D pula 26–59 e 65–74); lotes "from PDF pattern" inventados |
| `developments.description` / hero | **"800+" / "24 quadras (A–Z)"** | 24 | `page.tsx:131` diz "23 Quadras" |
| `lib/lotmap/engine.ts` | — | **blocos A–N (14)** | `engine.ts:206` |

Nenhuma bate com a outra **nem com o CAD**. Além disso:
- `MasterplanSection.tsx:24-49` sobrepõe status do Supabase por chave `${quadra}-${lot_number}`
  ('A-1'), mas a **planilha viva do briefing não está conectada** ao Miguel Marques.
- Migrations seedam preços repetidos (`160 m² / R$ 27.000`, `/R$ 31.000`…) e comentam
  _"lots 21–42 from PDF pattern"_ (`20260520_miguel_marques_map_fixes.sql:83`) — ou seja,
  **extrapolação**, não leitura da fonte.

Há ainda um **5º artefato**: `templates/subdivision/miguel-marques.template.ts`
(+`packages/imi-cad-generator`) com defaults genéricos (120 lotes, 300 m²) — não é a planta,
mas o gerador tem alvo `gltf` (útil para o futuro 3D).

---

## 4. (S1) Disponibilidade / Google Sheets

Estado atual (`lib/lots/alto-bellevue-availability.ts`, `hooks/use-ab-availability.ts`,
`api/developments/alto-bellevue/availability/route.ts`):
- ✅ Sync por CSV do Sheets, revalidate 60s + SWR no CDN, fallback silencioso, polling 90s + refoco.
- ❌ **Hardcoded p/ Alto Bellevue** (rota, hook, URL). Não é genérico por empreendimento.
- ❌ Planilha apontada é `…/1htpZAtQDDg…` — **diferente da do briefing** (`…/1LuvTEaI_wre…`,
  presumivelmente do Miguel Marques). MM **não tem** sync ao vivo (usa status do DB seedado).
- ❌ Parser amarrado a **QUADRA A–P** (`QUADRA_RE = /^QUADRA\s+([A-P])$/i`) e a 3 colunas
  fixas (`GROUP_STARTS=[0,4,8]`) — quebra em layout/quadras diferentes (MM vai até Z).
- ❌ O briefing pede **cache + logs + versionamento + fallback + validação + auditoria**;
  hoje só há cache + fallback. Faltam logs estruturados, versionamento do snapshot,
  validação de schema da planilha e trilha de auditoria das mudanças de status.

---

## 5. UX / UI / Mobile / Performance / Acessibilidade

### 5.1 UX/UI (S2/S3)
- **Inconsistência de identidade visual** entre stacks: AB tem painel premium, legenda,
  camada técnica, comparação; MM tem paleta/tipografia próprias (`Playfair`, verde/dourado)
  e tooltip simples. Dois empreendimentos parecem **dois produtos**, não "a mesma plataforma".
- **Áreas comuns clicáveis** existem no AB (`AmenityBottomSheet`) mas **não no MM** (o
  briefing exige modal com imagens/descrição/benefícios/lotes próximos em todas as áreas).
- `vendido` no MM é mudo (`InteractiveMasterplan.tsx:186` retorna sem ação) — sem feedback
  do porquê o clique não abre nada.

### 5.2 Mobile (S2) — prioridade 95% no briefing
- AB respeita a `UI_REGRESSION_POLICY` (sticky correto, grid `lg:col-span-8/4`, MobileStickyBar).
- MM: zoom/pan/pinch implementados à mão (`InteractiveMasterplan.tsx:141-182`), mas o alvo
  de toque do lote é **~21×29 px** — abaixo do mínimo recomendado (44 px). Em loteamento
  com 800 lotes, a seleção por toque fica imprecisa; falta _hit-area_ ampliada e _haptics_.
- Três implementações de gesto = três comportamentos sutis diferentes (inconsistência).

### 5.3 Performance (S2)
- MM renderiza **todos** os lotes como `<rect>` sempre (sem virtualização/LOD por zoom).
  Para 800–1.000 lotes em SVG já pesa; o objetivo (loteamentos, condomínios, bairros) vai
  estourar. AB tem LOD/rede de contenção — outro motivo para **unificar no renderizador maduro**.
- `lotsData.ts` (837 linhas, ~516 lotes) é embutido no bundle do cliente; deveria vir de
  JSON versionado/CDN como no AB (`?v=` + cache de sessão).

### 5.4 Acessibilidade (S2)
- AB tem `aria-*`/`role` em pontos-chave (32 ocorrências) — bom, mas incompleto para um
  mapa interativo (faltam alternativas de teclado e leitura por leitor de tela do "mapa").
- MM **não tem** `aria`/teclado no mapa: navegação só por mouse/toque. Lotes são `<rect>`
  sem rótulo acessível. Precisa de modo lista navegável por teclado como _fallback_ A11y.

---

## 6. (S2) Camadas avançadas do briefing — ausentes

Nada disto existe hoje (nem dados, nem UI):
- **Topografia** (altitude min/máx/média, declividade, classificação Plano/Leve/Moderado/Forte)
  — a fonte existe (curvas de nível `MDT1_CURVAS` no CAD do AB; o DXF do MM tem cotas), mas
  não há pipeline nem campos no banco.
- **Orientação solar** (nascente/poente, sol manhã/tarde por lote).
- **Sistema de distâncias** (até entrada, áreas verdes, lazer, equipamentos).
- **IMI Score** (0–100: valorização, liquidez, topografia, insolação, posição, escassez, R$/m²).
- **Modo Explorar** (experiência tipo Google Earth/War Watch) e **Modo Investidor**.
- **Comparação**: existe no AB (tabela, `MAX_COMPARE=3`, **sem radar**); briefing quer **4
  lotes + tabela + radar + ranking**, e disponível em todos os empreendimentos.
- **Backoffice**: upload de DWG/DXF/PDF e edição de mídia/preço/disponibilidade sem
  desenvolvedor — parcial (há reservas/RPCs e specs), mas sem ingestão CAD self-service.

---

## 7. Arquitetura-alvo: **UM** motor (proposta)

Princípio do briefing: _"Toda melhoria criada para Miguel Marques deve automaticamente
beneficiar Alto Bellevue. Não criar dois sistemas."_ Proposta:

```
┌─ FONTE DA VERDADE ──────────────────────────────────────────────┐
│ CAD/PDF por empreendimento → pipeline `scripts/cad/<dev>` →      │
│ GeoJSON normalizado (lotes, quadras, ruas, perímetro, áreas,     │
│ amenities) em CRS métrico (UTM) + transformação p/ render        │
└──────────────────────────────────────────────────────────────────┘
                              │  artefatos derivados, versionados (?v=)
┌─ DADOS ─────────────────────────────────────────────────────────┐
│ Supabase (subdivision_lots + developments + camadas: topo/solar/ │
│ distâncias/score) · planilha viva por empreendimento (genérica)  │
└──────────────────────────────────────────────────────────────────┘
                              │
┌─ MOTOR (lib/lotmap) ────────────────────────────────────────────┐
│ engine.ts expandido: contrato `LotMapData` único + loader        │
│ resiliente genérico (extrair de lib/lots/alto-bellevue.ts) +     │
│ resolveLotStatus + camadas computadas (topo/solar/dist/score)    │
└──────────────────────────────────────────────────────────────────┘
                              │  adapters de render (sem lock-in)
┌─ RENDER ────────────────────────────────────────────────────────┐
│ <LotMap engine=… renderer="svg"> hoje (1 só renderizador maduro);│
│ amanhã renderer="maplibre"/"deck"/"cesium" pelo mesmo contrato   │
└──────────────────────────────────────────────────────────────────┘
```

Decisões-chave:
1. **Um renderizador** (evoluir o do AB para `developmentConfig`-driven), aposentar os
   outros dois aos poucos (sem regressão — `UI_REGRESSION_POLICY`).
2. **Contrato de dados único** (`LotMapData`) que AB e MM produzem; geometria sempre do CAD.
3. **CRS métrico** persistido → habilita 3D/satélite/drone sem retrabalho.
4. **Sync de planilha genérico** por empreendimento (URL no `developments`/env), parser
   tolerante a A–Z e a layouts variados, com logs/versionamento/validação/auditoria.

---

## 8. Roadmap priorizado (cada fase beneficia AB **e** MM)

| Fase | Entrega | Por quê primeiro |
|---|---|---|
| **F0 (feito)** | Esta auditoria + plano | Exigência do briefing |
| **F1** | **Pipeline CAD do Miguel Marques** (DXF→poligonização→GeoJSON) + reconciliação das 4 "verdades" + `public/maps/miguel-marques-lots.json` | Desbloqueia tudo; elimina a violação S0 |
| **F2** | **Motor único**: extrair loader genérico de `lib/lots/alto-bellevue.ts`, `LotMapData` único; MM passa a usar o renderizador maduro do AB (config-driven) | Mata a fragmentação S1 |
| **F3** | **Sync de planilha genérico** (inclui a planilha do briefing p/ MM) + logs/versionamento/validação/auditoria/fallback | Disponibilidade ao vivo real, multi-dev |
| **F4** | **Camadas computadas**: topografia (curvas/cotas), orientação solar, distâncias; campos no banco | Diferencial "geointelligence" |
| **F5** | **IMI Score** + **Comparação** reconstruída (4 lotes, radar, ranking) em ambos | Modo Investidor |
| **F6** | **Modo Explorar** + áreas clicáveis em todos + mobile 95% + A11y | Experiência premium |
| **F7** | **Backoffice** ingestão CAD/mídia self-service | Operação sem desenvolvedor |
| **Futuro** | Adapter MapLibre/Deck/Cesium, Drone Mode, IMI Atlas | Habilitado pelo CRS da F1 |

---

## 9. Verificação reproduzível (rodar após `npm ci`)

```bash
npm ci
npm run validate:lots                                   # consistência + contenção (AB)
npx jest src/__tests__/lib/lots/alto-bellevue.test.ts   # suíte AB
npx tsc --noEmit                                         # 0 erros esperado
npm run build                                            # deploy-safe
# Fonte MM (após pipeline): node scripts/cad/<...> + validate equivalente
```

## 10. Regras imutáveis observadas nesta auditoria
- **Não inventar coordenadas** — onde a fonte não basta, marcar `pendente`.
- **Alto Bellevue**: link do Google Maps e tour Kuula **imutáveis** (`.claude/ALTO_BELLEVUE_LOCATION.md`).
- **Sem regressão de UI** (`.claude/UI_REGRESSION_POLICY.md`); preservar App Router / RLS / split server-client.
- Não alterar auth/billing/DB sem aprovação; nunca commitar secrets.

---

## Apêndice A — Inventário de arquivos auditados

**Render/ dados:** `imoveis/components/AltoBellevuePlanView.tsx` (3.262),
`imoveis/components/SubdivisionLotMap.tsx` (1.770), `imoveis/components/SubdivisionPlanView.tsx` (1.035),
`imoveis/components/SubdivisionErrorBoundary.tsx` (69),
`components/maps/InteractiveLotMap.tsx` (1.199), `components/maps/useLotMap.ts` (390),
`components/maps/LotDetailPanel.tsx` (515), `components/maps/PropertyMap.tsx` (Mapbox),
`projetos/miguel-marques/components/{MiguelMarquesPlanView(954),InteractiveMasterplan(453),MasterplanSection(165),MasterplanFilters(186),LotDetailsPanel(222)}`,
`projetos/miguel-marques/data/{lotsData.ts(837),masterplanLayout.ts(132)}`.

**Motor/lib:** `lib/lotmap/engine.ts` (250), `lib/lots/alto-bellevue.ts` (271),
`lib/lots/alto-bellevue-availability.ts` (106), `hooks/use-ab-availability.ts` (58).

**API/DB:** `api/developments/alto-bellevue/availability/route.ts`,
`supabase/migrations/{20260516_subdivision_lots,20260520_miguel_marques_map_fixes,20260614_lotmap_crm_engine,…}.sql`.

**Pipeline CAD existente (AB):** `scripts/cad/*` (extract-dxf, build-transform, build-lots,
global-rematch, …), `scripts/validate-lots.mjs`.

**Fontes oficiais MM (recebidas, não commitadas):** DXF/DWG/PDF — tratadas como fonte da verdade.

## Apêndice B — Achados de dados crus (parsing direto das fontes)
- DXF MM: 32.084 `LINE`, 5.867 `MTEXT`, 21 layers; ruas `RUA PROJETADA 01–23`,
  `ÁREA INSTITUCIONAL`, cotas em metros; **lotes sem polígono fechado** (segmentos soltos).
- `lotsData.ts`: 516 lotes, 19 quadras, 37 placeholders idênticos (160 m²/R$ 25.000), R$/m² 156–250.
- `masterplanLayout.ts`: 23 quadras em grade; contagem de células ≠ contagem de dados (ex.: D).
