# Auditoria GEOESPACIAL — Miguel Marques (2026-06-26)

> **Pedido:** auditar a base geoespacial (CAD→DXF→GeoJSON→Frontend) antes de qualquer UX.
> **Veredito: a geometria de produção está MATERIALMENTE INCORRETA.** Os polígonos dos
> lotes divergem da área levantada (rótulos do agrimensor) em **mediana 34,7%** — a
> reclamação está correta. Auditorias anteriores que diziam "fiel ao CAD (0,12 m²)" estavam
> **erradas**: comparavam o campo `area` do JSON (que é o próprio rótulo copiado) contra o
> rótulo — nunca mediram o polígono. Correção registrada aqui.

---

## 1. CRS / cadeia de transformação

Não há CRS geográfico — o desenho é planar local em **milímetros** (`$INSUNITS=4`). Cadeia:

`DXF (mm, local)` → **snap grade 40 mm** (`round(v/40)*40`) → `shapely.polygonize` →
rotação **−41°** → escala p/ `viewBox` largura 1200 → SVG no front.

- Não há perda por "CRS" (não há projeção geográfica). A perda está na **reconstrução**
  (snap + polygonize) — itens 2–4.
- O georreferenciamento (lat/long p/ basemap satélite) **ainda não existe** e depende das
  coordenadas (Fase 2).

## 2. Simplificação excessiva de polígonos
- Vértices/lote: mediana **7**, máx 35. Não há *over*-simplificação grosseira de contorno;
  o problema **não é** número de vértices.
- O problema é **topológico**: o polígono captura partes erradas do lote (ver §6).

## 3. Validação de fechamento
- `validate:lots:mm`: **0** polígonos inválidos, **0** sem polígono, **0** área nula — todos
  fecham. Fechamento **não é** o defeito.

## 4. Precisão de coordenadas
- As linhas do DXF têm precisão **sub-mm** (ex.: `51495.292, 1266774.418`).
- A pipeline **destrói** essa precisão com o **snap de 40 mm**: cada vértice é movido até
  ±28 mm para a grade. Em arestas de ~8 m isso é visível como **serrilhado** quando se dá
  zoom (exatamente o que o drill-in passou a expor).

## 5. Comparação geometria renderizada × planta oficial
- A planta aprovada (PDF) e o DXF **não contêm polígono de lote fechado**
  (`LWPOLYLINE/POLYLINE = 0`; o PDF tem 12.063 linhas soltas, 0 paths fechados). O lote é um
  **aglomerado de segmentos `LINE`**.
- Sobrepondo as linhas reais do CAD aos polígonos de produção, os polígonos **não coincidem**
  com as linhas: são fatias/uniões erradas dos segmentos.

## 6. Relatório de divergência percentual por lote  → `miguel-marques-divergencia-por-lote.csv`

Área do **polígono** vs área **rotulada** (agrimensor), 1.254 lotes:

| Métrica | Valor |
|---|---|
| Divergência **mediana** | **34,7 %** |
| p75 / p90 / máx | 46,7 % / 54,5 % / 251 % |
| Lotes com >10 % | **1.078 (86 %)** |
| Lotes com >25 % / >50 % | 787 / 241 |

Exemplos: `B-6` rótulo 160 m² → polígono **73 m²** (−54 %); `A-2` 137→77; `G-10` 160→220
(+38 %). Os polígonos ficam aleatoriamente **maiores ou menores** (581 vs 587) → erro de
**forma por lote**, não um erro de escala global.

### Causa-raiz
A camada **`A-DETL-THIN`** (8.263 linhas curtas) mistura **divisas reais de lote** com
**linhas internas/construção** que **fatiam** os lotes em sub-faces erradas. Evidência:
polygonizando só **`A-DETL-MEDM`** (linhas-tronco longas, ~22,7 m) + `A-DETL`, a divergência
cai para **0,21 % de mediana** — mas sub-segmenta (faces = fileiras inteiras). Ou seja, as
divisas boas e o ruído estão **entrelaçados** na mesma camada e não se separam por
camada/comprimento.

---

## 7. Caminho de correção (validado em protótipo)

**Montagem guiada por área** (region-grow): superdividir finamente e, a partir do rótulo de
área de cada lote, **agregar faces adjacentes até bater a área levantada**. Protótipo:
divergência **mediana 34,7 % → 1,09 %**, 72 % dos lotes < 3 %. Ainda não-produtível: 154
conflitos de semente e uma cauda (máx 123 %) a resolver, + limpeza de polígono + re-transferir
a identidade reconciliada + revalidar. É um **incremento dedicado**, não um patch.

**Alternativa mais limpa e exata:** obter do agrimensor um **DXF/DWG com as polilinhas de lote
FECHADAS** (`LWPOLYLINE` por lote) — o DWG original quase certamente as tem; o DXF atual
(export cloudconvert) as achatou em linhas. Com polígonos fechados, a fidelidade é **exata** e
trivial, sem heurística.

---

## 8. Recomendação

1. **Não** prosseguir para features (basemap/3D) até a geometria estar fiel — de acordo.
2. Decisão necessária: **(a)** buscar o DXF/DWG com polilinhas de lote fechadas (caminho
   exato), **ou (b)** autorizar o rebuild in-house por montagem-guiada-por-área (eu finalizo;
   meta divergência <2% por lote, polígonos limpos, identidade preservada, render lado-a-lado
   vs planta).

*Auditoria diagnóstica. Nenhuma geometria de produção foi alterada nesta entrega.*
