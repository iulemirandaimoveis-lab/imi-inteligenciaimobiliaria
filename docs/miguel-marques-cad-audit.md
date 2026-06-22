# Auditoria CAD — Loteamento Miguel Marques

> **Data:** 2026-06-22
> **Tipo:** Auditoria geométrica e de dados **a partir dos arquivos técnicos oficiais** (DWG/DXF/PDF/XLSX), conforme exigido pelo briefing "PROMPT CTO MASTER — Miguel Marques V2" (seção **AUDITORIA CAD** / **Etapa 1 — Validação CAD**).
> **Metodologia:** parsing direto dos arquivos (ezdxf 1.4.4, openpyxl 3.1.5, pypdf) + reconciliação com a geometria já gerada em `public/maps/`, com números reproduzíveis. **Nenhum código de produto foi alterado** — este documento é o **portão** que antecede qualquer componente.
> **Hierarquia de confiança aplicada (do briefing):** DWG → DXF → PDF técnico → render → imagem estática.

---

## 0. TL;DR (Veredito)

1. **A geometria já é fiel ao CAD — não é "olhômetro".** As áreas dos polígonos em produção batem com os **rótulos de área impressos pelo próprio agrimensor no DXF** com erro **médio de 0,12 m²** (máx. 5,47 m²) sobre 1.254 lotes. A regra absoluta do briefing ("NÃO DESENHAR NO OLHÔMETRO") **já está atendida para a geometria**.
2. **O defeito real é de IDENTIDADE, não de forma.** Existem **78 chaves `(quadra,lote)` duplicadas** (ex.: `B-18` + `B-18_2`) e um **cluster de quadras mal rotuladas** (B, C, D, E, F, K, L) onde o lote certo recebeu a **quadra errada**. Isso fere "cada lote tenha identificação correta" e quebra deep-link (`?lot=`), carrinho e seleção.
3. **Parte das camadas de contexto JÁ É RENDERIZADA** (ver §0.1 — corrigido após leitura do código de render). O **arquivo de lotes** (`miguel-marques-cad-lots.json`) tem `streets/perimeter/amenities/greenAreas = []`, **mas** um arquivo separado — `miguel-marques-cad-context.json` — fornece **`roads` (158 paths) + `perimeter` (2)** nas mesmas coords, **já desenhados** com terreno/relevo no `MiguelMarquesPlanView`. O que **realmente falta** no visual: **vegetação** (35 blocos `L-PLNT` no DXF), o **lago/água da Quadra Z** (hoje só badge "Beira-lago"; o código diz "sem lago sintéticos") e a **área institucional de 7.762,11 m²**.
4. **Há confusão de fontes/dados** que precisa de decisão do dono do produto antes de codar (preço/quadra/status: CAD baked vs planilha comercial vs Supabase). Ver §8.

> **Conclusão que muda o plano:** o Miguel Marques **não** precisa ser "redesenhado do zero" — nem sequer precisa de "construir o mapa vetorial" (já existe, roteado e com ruas/perímetro/terreno/carrinho). Precisa de (a) **reconciliação de identidade** lote↔quadra contra a planilha comercial (o defeito mais grave), (b) **completar o visual** (vegetação + lago + institucional) e (c) **paridade funcional** com o AB (busca, comparar, a11y) + features novas (carrinho no AB, deep-link, apresentação, exportação). O trabalho geométrico pesado já existe e é preciso.

---

## 0.1. Estado JÁ implementado (verificado no código — corrige premissas do briefing)

O briefing e auditorias anteriores (2026-06-20) descrevem um estado que **já evoluiu**. Verificado em código nesta data:

| Item | Estado | Evidência |
|---|---|---|
| Rota `/imoveis/loteamento-miguel-marques` usa o **mapa vetorial premium** (não o JPG) | ✅ **FEITO** | `SubdivisionLotMap.tsx:1235-1306` (early-return p/ `MM_DEV_ID` → `<MiguelMarquesPlanView>`); o JPG (`SubdivisionPlanView`) virou caminho morto p/ o MM |
| Status vivo do Supabase sobreposto no mapa do MM | ✅ FEITO | `SubdivisionLotMap.tsx:1238-1244` (`MM_STATUS_MAP`) |
| **Ruas + perímetro** desenhados | ✅ FEITO (derivados: "envelope − lotes") | `miguel-marques-cad-context.json` (`roads`=158, `perimeter`=2) + `MiguelMarquesPlanView.tsx:819-845` |
| **Terreno / relevo / textura** | ✅ FEITO | `MiguelMarquesPlanView.tsx:796-817` |
| **Carrinho de lotes** (multi-lote + condições + WhatsApp) | ✅ FEITO no MM | `MiguelMarquesPlanView.tsx:136-166` (`CartPanel`) |
| **Vegetação / lago (Quadra Z) / institucional** desenhados | ❌ falta | comentário `:815` "sem lago sintéticos"; sem camada de árvores |
| Busca por lote · Comparar · a11y nos polígonos (MM) | ❌ falta | (AB tem; MM não) |
| Carrinho no **Alto Bellevue** · deep-link `?lot=` · modo apresentação · export PDF/link | ❌ falta | features novas do briefing |

➡️ Ou seja: **ruas, perímetro, terreno, roteamento e carrinho do MM já existem.** Este documento, na §5.2/§7, foi corrigido para não superestimar a lacuna visual.

---

## 1. Arquivos auditados (fonte primária)

| Arquivo | Tamanho | Formato | Observações |
|---|---|---|---|
| `R07 — PLANTA DE PISO / PLANTA LOTEADA.dxf` | 13,1 MB | DXF **AC1018 (AutoCAD 2004)** | Exportado por **cloudconvert** (`$LASTSAVEDBY`); `INSUNITS = 4` (**milímetros**). Fonte geométrica primária utilizável (o DWG é binário equivalente). |
| `R07 — PLANTA DE PISO / PLANTA LOTEADA.dwg` | 1,9 MB | DWG (binário) | Mesmo desenho do DXF (não re-parseado; DXF é a leitura canônica). |
| `Planta Miguel Marques (aprovada).pdf` | 8,7 MB | PDF (1 prancha A0) | **Planta APROVADA** — title block + quadro de áreas. Ground truth oficial. |
| `Disponibilidade lotes — Miguel Marques (Mi Gestão).xlsx` | 193 KB | XLSX | **Quadro comercial vivo** (quadra/lote/m²/valor/disponibilidade) + log de negociação. |

### 1.1 Ground truth oficial (PDF aprovado)

- **Empreendimento:** LOTEAMENTO MIGUEL MARQUES LTDA — CNPJ 54.327.847/0001-04.
- **Local:** Sítio Frexeiras, **São João — PE** (INCRA cód. 950.092.409.588-7). *(NB: é São João/PE — não confundir com Garanhuns, que é o Alto Bellevue.)*
- **Aprovação / prancha:** 12/12/2024 · escala **1:1100** · prancha 01.01 — A0 · projeto de legalização · resp. técnico **Eng. Lucas José Lopes de Medeiros (CREA-PE)** · Quadro de Áreas ref. R.06.2.
- **Área Total da gleba:** **40,7469 ha = 407.469 m²**.
- **Área Institucional:** **7.762,11 m²** (1 polígono — ver §4 e §5; é o outlier corretamente excluído dos lotes vendáveis).
- **Lote padrão (medidas do PDF):** testada **8,00 m**, profundidade **~18,9–20,0 m** → **área ~160 m²** (o bucket dominante).

---

## 2. Quantidade de lotes e quadras

| Fonte | Lotes | Quadras | Observação |
|---|---:|---:|---|
| **DXF** (rótulos de área `A-AREA-IDEN`) | **1.255** rótulos `m²` | — | inclui 1 rótulo de **7.762,11 m²** (institucional). 1.254 são lotes vendáveis. |
| **XLSX** (Mi Gestão) | **~1.254** (1.270 brutos, ~1.254 após dedupe) | **24** (A–V, X, Z) | layout em blocos lado-a-lado; contagem por quadra sensível ao parser. |
| **JSON produção** (`miguel-marques-cad-lots.json`) | **1.254** | **24** | `totalLots: 1254`, `viewBox "0 0 1200 1385.52"`. |

- **Quadras (24):** A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, **X**, **Z** — **pula W e Y** (confirmado no PDF e na planilha). A quadra **Z** é a beira-lago (destaque comercial).
- **Convergência de total:** as três fontes convergem em **1.254 lotes vendáveis** — número confiável.

---

## 3. Áreas encontradas

### 3.1 Distribuição (JSON de produção, 1.254 lotes)
- min **99,27 m²** · max **298,98 m²** · média **169,76 m²** · **soma 212.882 m²**.
- 100% dos lotes têm `area` numérica (0 nulos) e `points` (0 sem polígono).
- Bucket dominante **150–174 m²** (~1.018 lotes) → coerente com o lote padrão 8×20 do PDF.

### 3.2 QA geométrico — polígono vs rótulo impresso no CAD *(o teste mais forte)*
Comparação dos **1.255 rótulos de área impressos no DXF** (o que o agrimensor escreveu) contra a **área calculada (shoelace) dos polígonos** do JSON:

| Métrica | Valor |
|---|---|
| Lotes comparados | 1.254 |
| **Erro médio \|Δárea\|** | **0,12 m²** |
| Erro máximo | 5,47 m² |
| Lotes com Δ > 1 m² | 54 |
| Histogramas (bucket 25 m²) | batem bucket-a-bucket (ex.: 1.021 vs 1.018 no bucket 150–174) |

➡️ **Veredito: a geometria dos polígonos é fiel ao CAD (erro sub-0,1%).** Não é aproximação visual. (Detalhe técnico: o pipeline de produção reconstrói o contorno a partir das linhas do CAD; o resultado preserva a área impressa.)

### 3.3 Reconciliação de área XLSX ↔ JSON
- Soma de áreas: XLSX ~**214.717 m²** vs JSON **212.882 m²** (Δ ~0,9%, explicada por linhas extras/duplicadas na planilha).
- Em chaves `(quadra,lote)` **comuns** (1.158): Δárea **média 0,8%**, porém **52 lotes com Δ > 5%** — exatamente os lotes **mal identificados/duplicados** (ver §6).

---

## 4. Composição do DXF (o que existe na fonte)

DXF `AC1018`, modelspace, **12 layers**: `0`, `A-ANNO-DIMS`, `A-ANNO-DIMS-1100`, `A-AREA-IDEN`, `A-DETL`, `A-DETL-GENF`, `A-DETL-MEDM`, `A-DETL-THIN`, `Defpoints`, `G-ANNO-TEXT`, `G-IMPT`, `L-PLNT`.

| Entidade | Qtd. | Layer principal | Significado |
|---|---:|---|---|
| `LINE` | **11.184** | `A-DETL-THIN` (8.263), `A-DETL-MEDM`, `A-DETL` | **bordas de lote, ruas, perímetro** (linhas soltas) |
| `MTEXT` | **5.345** | `G-ANNO-TEXT` (2.830), `A-AREA-IDEN` (2.515) | nº de lote + nomes de rua; **rótulos de área** ("247.85 m²") |
| `DIMENSION` | 522 | `A-ANNO-DIMS` | cotas (testadas/profundidades) |
| `ARC` | 46 | `A-DETL` | curvas (esquinas/cul-de-sac) |
| `INSERT` | 35 | **`L-PLNT`** | **vegetação** (blocos de árvore/paisagismo) |
| `HATCH` | 18 | `A-DETL-GENF` | **áreas hachuradas** (institucional/lazer/lago) |
| **`LWPOLYLINE`/`POLYLINE`** | **0** | — | **não há polígonos fechados** (ver §6.1) |

- **23 ruas** confirmadas: textos `"RUA PROJETADA 01"` … `"RUA PROJETADA 23"`.
- **Extents** ~854 m × 890 m (em mm), coerente com a gleba de 40,7 ha.

---

## 5. Inconsistências, geometrias inválidas e polígonos incompletos

### 5.1 Polígonos inválidos / incompletos
- **0 polígonos inválidos** no JSON de produção (todos com `points` e área > 0).
- **0 lotes sem área** e **0 sem polígono**.
- ✅ Nenhuma geometria inválida ou polígono incompleto pendente.

### 5.2 Camadas de contexto — o que falta de fato (corrigido)
Atenção: os arrays `streets/perimeter/amenities/greenAreas` estão `[]` **no arquivo de lotes** (`miguel-marques-cad-lots.json`), **porém** o render usa um arquivo **separado** (`miguel-marques-cad-context.json`) e já desenha ruas+perímetro+terreno (ver §0.1).

| Camada | Render hoje | Existe no DXF? | Ação |
|---|---|---|---|
| Ruas (`roads`) | ✅ **desenhada** (158 paths, derivados "envelope − lotes") | Sim — 23 vias + linhas | opcional: rotular as 23 "RUA PROJETADA" sobre as vias |
| Perímetro | ✅ **desenhado** (2 polígonos, dourado tracejado) | Sim | ok |
| Terreno/relevo | ✅ **desenhado** (gradientes) | n/a | ok |
| **Vegetação** | ❌ **falta** | Sim — `L-PLNT` (35 inserts) | extrair blocos → árvores estilizadas |
| **Lago / água (Quadra Z)** | ❌ **falta** (só badge no card) | Sim — HATCH/linhas | extrair polígono de água → renderizar azul |
| **Institucional (7.762 m²)** | ❌ **falta** | Sim — 1 hachura/rótulo | extrair → amenity institucional |

➡️ O MM **já tem** lotes vetoriais, ruas, perímetro e terreno. O que ainda o deixa "menos premium" que o AB é a ausência de **vegetação, lago e institucional** — além das **features** de paridade (busca/comparar/a11y) e novas (carrinho no AB, deep-link, apresentação, export).

### 5.3 Área institucional órfã
O polígono de **7.762,11 m²** (institucional, confirmado no PDF) aparece como **1 rótulo de área no DXF** mas **não** é capturado como `amenity`/`greenArea` no JSON — apenas corretamente **excluído** dos lotes vendáveis. Deve ser **preservado como amenity institucional**, não descartado.

---

## 6. Nomenclaturas inconsistentes (o achado crítico)

### 6.1 Por que acontece — causa raiz (evidenciada)
O DXF **não tem polígonos fechados** (§4): cada lote é um aglomerado de `LINE` soltas, e a identidade vem de **dois textos separados** — o **nº do lote** (`G-ANNO-TEXT`) e a **área** (`A-AREA-IDEN`) — que o pipeline associa por **proximidade espacial**, inferindo a quadra pela região. Quando um lote fica perto da **fronteira entre quadras**, a inferência erra a quadra.

O próprio gerador admite o resíduo:
- `scripts/cad/build_miguel_marques.py:160-161` imprime **`residual duplicate (quadra,lote) suffixed`** — ou seja, colisões de chave são **sufixadas com `_2`** em vez de resolvidas.

### 6.2 Evidência quantitativa
- **78 chaves `(quadra,lote)` duplicadas** no JSON de produção → **78 ids `_2`** (ex.: `B-18` + `B-18_2`, `C-2` + `C-2_2`, …). `1.254` lotes mas só **1.176** chaves únicas.
- **Divergência de quadra XLSX × JSON** (mesma geometria, quadra diferente):

| Quadra | XLSX (comercial) | JSON (CAD) | Δ área |
|---|---:|---:|---:|
| A | 29 | 29 | 1,3% |
| **D** | **64** | **20** | **69%** |
| **C** | 60 | **86** | 44% |
| **B** | 45 | **62** | 38% |
| **K** | 57 | **32** | 42% |
| F | 70 | 57 | 20% |
| L | 50 | 60 | 18% |
| **I / T / U / Z** | 72/44/46/38 | 72/44/46/38 | **0,0% (batem ao m²)** |

➡️ O fato de **I, T, U, Z baterem exatamente** (contagem **e** soma de área ao m²) prova que **são os mesmos lotes físicos** — a falha é **só o rótulo de quadra/lote** num cluster (B, C, D, E, F, K, L), não a geometria.

### 6.3 Impacto
- **Deep-link `?lot=Q-12` ambíguo** (duas geometrias com a mesma chave).
- **Carrinho/seleção/enriquecimento Supabase** por chave `QUADRA-lote` casam no lote errado.
- **Contadores por quadra** divergem do material comercial impresso.

### 6.4 Correção recomendada (sem olhômetro)
Reconciliar **geometria CAD ↔ planilha comercial** usando a **planilha "DISPONIBILIDADE MIGUEL MARQUES" como verdade de identidade** (quadra/lote/área/valor/status): casar cada polígono à linha da planilha por **(quadra, ordem espacial, área)** — em vez de inferir quadra por proximidade de rótulo. Onde não houver casamento seguro, marcar **`pendente`** (não inventar), como já se faz com o `B-24` do Alto Bellevue.

---

## 7. Diferenças entre PDF e CAD

| Item | PDF (aprovado) | DXF / JSON | Veredito |
|---|---|---|---|
| Nº de lotes vendáveis | ~1.254 (rótulos) | 1.254 | ✅ converge |
| Quadras | A–V, X, Z (24) | 24 | ✅ converge |
| Ruas | RUA PROJETADA 01–23 | 23 no DXF / **renderizadas** via `context.json` (derivadas) | ✅ desenhadas (falta só rotular nomes) |
| Perímetro | borda externa | **renderizado** (context.json) | ✅ |
| Área institucional | **7.762,11 m²** | 1 rótulo no DXF / **não desenhada** | ⚠️ capturar como amenity |
| Lago / Quadra Z | beira-lago | **não desenhado** (só badge) | ⚠️ extrair água |
| Área total da gleba | **40,7469 ha** | n/d no JSON | registrar como metadado |
| Lote padrão | 8,00 m × ~20 m ≈ 160 m² | bucket dominante 150–174 m² | ✅ converge |

Não há **conflito** PDF×CAD nas geometrias. Ruas/perímetro/terreno já são desenhados; falta **subextração** de **vegetação, lago e institucional** (presentes no CAD, não levados ao render).

---

## 8. Confusão de fontes/dados (decisões em aberto — bloqueiam o build correto)

Há **três** artefatos de dados do MM, com papéis sobrepostos:

| Arquivo | Geometria | Status/Preço | Quem consome |
|---|---|---|---|
| `public/maps/miguel-marques-cad-lots.json` (319 KB) | **polígonos reais** (multi-vértice) | **baked** (798 disp / 397 vend / 53 prop / 6 neg; preço 15.511–46.716) | **PRODUÇÃO** — `MiguelMarquesPlanView.tsx:17`, `MasterplanSection.tsx:12` |
| `public/maps/loteamento-miguel-marques-lots.json` (234 KB) | **caixas axis-Voronoi** (área-correta, forma aproximada) | status **vivo** (Supabase), **dedupe de id** | gerado por `scripts/cad/mm/build-map.mjs` — **não** é carregado pela view |
| `/maps/miguel-marques-lots.json` (config `engine.ts:205`) | — | — | **NÃO EXISTE** — `mapJsonUrl` obsoleto no registry do motor |

Decisões necessárias **antes** de implementar (impactam carrinho, comparação, deep-link, contadores):

1. **Fonte de verdade COMERCIAL (preço/status): ✅ DECIDIDO (2026-06-22) — importar a planilha "Mi Gestão" (XLSX) para o Supabase**, que passa a ser a fonte única viva; o mapa lê status/preço de lá. Motivo da decisão: o JSON tem preço **baked** (15.511–46.716) que **diverge** da planilha (17.861–74.745) → preços do mapa estavam **desatualizados**.
2. **Geometria canônica:** consolidar em **um** arquivo (recomendo o de **polígonos reais**, após reconciliar identidade) e aposentar/realinhar os outros dois caminhos.
3. **Taxonomia de status** única AB+MM (o motor `engine.ts` já define o canônico EN; o JSON usa PT). 

---

## 9. Checklist de QA geométrico (estado atual)

```md
[x] Lotes reconstruídos a partir de fonte CAD/PDF técnica (R07)        — 1.254
[x] Todos os lotes com polígono próprio                                — 1.254/1.254
[x] Todos os lotes com área                                            — 1.254/1.254
[x] Área do polígono = área impressa no CAD (≤1 m²)                     — 1.200/1.254 (96%); média 0,12 m²
[x] 0 polígonos inválidos / incompletos
[ ] Identidade (quadra,lote) ÚNICA                                     — ✗ 78 duplicadas (_2)
[ ] Quadra de cada lote = planilha comercial                           — ✗ cluster B,C,D,E,F,K,L
[x] Ruas desenhadas (derivadas, alinhadas aos lotes)                   — ✓ 158 paths (context.json)
[x] Perímetro desenhado                                                — ✓ 2 polígonos
[x] Terreno/relevo                                                     — ✓
[ ] Vegetação / lago (Quadra Z) / institucional desenhados             — ✗
[ ] Preço/status com fonte única definida                             — ✗ (decisão: importar XLSX→Supabase, §8)
```

---

## 10. Plano de correção priorizado (CAD → produto)

> Atende às etapas do briefing (Validação → Conversão → Reconstrução vetorial → Comparação com PDF → QA geométrico) **sem reconstruir o que já está correto**.

**P0 — Identidade (corrige "identificação correta"; desbloqueia deep-link/carrinho)**
1. Reconciliar `(quadra,lote)` da geometria contra a planilha comercial (casar por quadra+ordem espacial+área); eliminar os 78 `_2`; marcar `pendente` o que não casar com segurança. *Pipeline:* `scripts/cad/build_miguel_marques.py` + nova etapa de match com o XLSX.
   - **Aceite:** 0 ids duplicados; contagem por quadra = planilha (±0); deep-link `?lot=` resolve 1 lote.

**P1 — Completar o visual (ruas/perímetro/terreno JÁ feitos) + paridade funcional**
2. Extrair do DXF e renderizar **vegetação** (`L-PLNT`, 35 inserts → árvores), **lago/água da Quadra Z** (HATCH/linhas → polígono azul) e **institucional 7.762 m²** (amenity). *Pipeline:* estender `scripts/cad/mm/extract.mjs`; alinhar via transformada afim empírica (lotes DXF↔JSON).
3. Paridade funcional com o AB no MM: **busca por lote**, **comparar (até 3)**, **a11y** nos polígonos (role/aria/teclado), `role="dialog"`+Escape no card.
   - **Aceite:** mapa do MM com vegetação + lago + institucional; busca/comparar/teclado funcionando.

**P1b — Features novas do briefing (nos dois empreendimentos)**
4. **Carrinho no Alto Bellevue** (espelhar o `CartPanel` do MM); **deep-link `?lot=`** (centraliza+destaca+abre card); **modo apresentação**; **export PDF + link compartilhável** (WhatsApp já existe no MM).

**P2 — Fonte única e metadados**
5. **Decisão tomada (§8): importar a planilha "Mi Gestão" (XLSX) → Supabase**, que vira a fonte única viva (status/preço); o mapa lê de lá. Consolidar num único JSON canônico de geometria; corrigir `engine.ts:205` (`mapJsonUrl` aponta p/ `/maps/miguel-marques-lots.json` inexistente); registrar metadados oficiais (40,7469 ha, institucional 7.762 m²).
   - **Aceite:** hero/SEO/contadores/mapa exibem o **mesmo** número; preço/status de uma só fonte (Supabase).

---

## 11. Reprodutibilidade

```bash
# Dependências de auditoria (ambiente):
pip install ezdxf openpyxl pypdf

# Os scripts de extração/validação usados pelo pipeline existente:
node scripts/cad/mm/extract.mjs       # extrai do DXF
node scripts/cad/mm/build-map.mjs     # gera o JSON no contrato do motor
python3 scripts/cad/build_miguel_marques.py   # gera miguel-marques-cad-lots.json (PROD)
npm run validate:lots                 # validação contínua (hoje cobre o AB)
```

> **Recomendação:** estender `npm run validate:lots` para cobrir o MM (total 1.254, 0 ids duplicados, 0 polígonos inválidos, contagem por quadra = planilha) e rodar no CI, espelhando a garantia que já existe para o Alto Bellevue.

---

## 12. Relação com auditorias existentes

Este documento é a **auditoria CAD geométrica** exigida pelo briefing (não existia neste caminho). Complementa, sem duplicar:
- `docs/AUDITORIA_MAPAS_AB_MM_2026-06-20.md` (arquitetura/roteamento dos dois motores).
- `docs/auditoria-mapa-miguel-marques-vs-alto-bellevue.md` (gap funcional MM × AB + plano faseado).
- `docs/AUDITORIA_IMI_SPATIAL_ENGINE_2026-06-19.md`, `MAPA_LOTES_DATA_MODEL.md`, `MAPA_LOTES_UX_SPEC.md`.

---

*Auditoria de diagnóstico. Nenhuma alteração de produto foi aplicada. Próximo passo: aprovar o escopo P0–P2 e as decisões da §8 antes de codar (conforme `CLAUDE.md` e `.claude/UI_REGRESSION_POLICY.md`).*
