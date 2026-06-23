# Reconciliação Miguel Marques — arquivos OFICIAIS em mãos (2026-06-23)

> **Gatilho:** o dono do produto subiu os arquivos técnicos oficiais (DWG, DXF, PDF aprovado
> e quadro de disponibilidade Mi Gestão). Este documento registra a **extração a partir
> deles** (Sprint 1 — Precisão Cartográfica, continuação do `docs/governance/04-…`) e o que
> ainda **bloqueia** o relabel de identidade (P0) com verificação.
>
> **Princípio (Regra Absoluta 4 do briefing):** não sobrescrever a geometria de produção com
> um rebuild **não verificado**. Geometria não foi alterada nesta entrega.

---

## 1. Arquivos recebidos (sessão)

| Arquivo | Tamanho | Papel |
|---|---|---|
| `R07 … PLANTA LOTEADA.dxf` | 13,1 MB | Geometria + rótulos (fonte primária) |
| `R07 … PLANTA LOTEADA.dwg` | 1,9 MB | Binário equivalente (não re-parseado) |
| `Planta Miguel Marques (aprovada).pdf` | 8,7 MB | Planta aprovada (ground truth visual) |
| `Disponibilidade lotes — Mi Gestão.pdf` | 0,3 MB | Quadro comercial (status/preço/área) — **PDF**, não XLSX |

---

## 2. DXF — verificação direta (confirma a auditoria de 2026-06-22)

`ezdxf 1.4.4`, `AC1018`, `INSUNITS=4 (mm)`. Entidades no modelspace:

| Entidade | Qtd | Layer-chave | Significado |
|---|---:|---|---|
| `LINE` | 11.184 | `A-DETL-THIN/MEDM/DETL` | bordas de lote / ruas / perímetro |
| `MTEXT` | 5.345 | `A-AREA-IDEN` (2.515), `G-ANNO-TEXT` (2.830) | **área + número do lote** / nomes de rua + **letra da quadra** |
| `INSERT` | 35 | **`L-PLNT`** | **vegetação** (ainda não renderizada) |
| `HATCH` | 18 | `A-DETL-GENF` | hachuras (institucional / lago) |
| `LWPOLYLINE`/`POLYLINE` | **0** | — | **não há polígono de lote fechado** (geometria é costurada de `LINE`) |

- **24 letras de quadra** em `G-ANNO-TEXT`, exatamente uma cada: A–V, X, Z (pula W e Y). ✅
- **Número do lote vive em `A-AREA-IDEN`** junto da área (ex.: `"247.85 m²"` + `"01"`) — não em `G-ANNO-TEXT`.
- Conclusão idêntica à auditoria: **a geometria de produção já é fiel ao CAD** (área do polígono = rótulo do agrimensor, erro médio 0,12 m²). O defeito é de **identidade (quadra/lote)**, não de forma.

---

## 3. Quadro de disponibilidade — extração (nova ferramenta)

Ferramenta: **`scripts/cad/mm/parse_schedule_pdf.py`** (pymupdf). O PDF é um print de planilha
humana: 4 colunas de quadras por faixa, **quadras empilhadas** por coluna e **continuações sem
cabeçalho** na página de overflow. O parser lê posicionalmente (sub-colunas LOTE/M2/VALOR/DISP,
descartando a coluna-gutter do contador global) e **costura** as continuações pela regra
`start == max(quadra)+1` quando há **uma** quadra candidata.

**Resultado atual:** `TOTAL=1101` (grade 1065 + 36 costurados), 24 quadras, contíguas em quase
todas. Distribuição de status: 599 disponível · 438 vendido · 58 proprietário · 6 negociação.

**Validação cruzada com a auditoria:** o bloco de continuação que começa no lote 22 costura na
**Quadra K → 53–57 lotes**, batendo com o `XLSX K=57` citado na auditoria §6.2. ✅

### 3.1 Lacuna encontrada (importante)
- O quadro alcançável chega a **~1.148 lotes** (1101 já extraídos + ~83 da página de overflow),
  mas a **geometria tem 1.254**. Ou seja, **o quadro comercial subconta a planta em ~100–150
  lotes** — coerente com a nota da auditoria ("1.270 brutos, ~1.254 após dedupe; contagem
  sensível ao parser"). **O quadro não cobre 1:1 a planta.**
- Pendências do parser (catalogadas, não inventadas):
  - 4 blocos de continuação **ambíguos** (`start-1` casa com 0 ou 2 quadras) → deixados para o
    fallback de adjacência do build, **sem** atribuir identidade no chute.
  - 2 furos pontuais (`B-38`, `X-27`) a conferir contra a planta aprovada.

---

## 4. O que isso significa para o P0 (relabel de identidade)

`build_miguel_marques.py` deriva a quadra **principalmente do quadro** (cada linha
`(quadra,lote,área)` reivindica a face mais próxima da âncora da quadra); faces sem linha caem
no **voto de adjacência** e, por último, na letra mais próxima. Logo:

- Um quadro **mais limpo e contíguo** (como o desta extração) **ancora ~1.100 lotes** com
  identidade confiável; os ~150 restantes dependem do fallback geométrico.
- **Não dá para garantir `(quadra,lote)` único e == quadro para 100% dos lotes** enquanto o
  quadro subcontar a planta. Forçar o rebuild agora **substituiria** os 319 KB de geometria que
  já estão no ar por um resultado **não verificável célula a célula** — proibido pela Regra 4.

### Plano com PORTÃO de aceite (próximo incremento, sob branch/flag)
1. Fechar a costura da página de overflow (capturar os 83 lotes; resolver os 4 blocos ambíguos
   por **área** contra as faces da âncora — não por chute).
2. Rodar `build_miguel_marques.py <dxf> schedule.json --write` em arquivo **paralelo** (não o de
   produção).
3. **Portão (tudo verde, senão não promove):**
   - `validate:lots:mm` → **0** `(quadra,lote)` duplicados (hoje 78);
   - contagem por quadra == quadro (±0) onde o quadro cobre;
   - área do polígono == rótulo do DXF preservada (≤1 m²) — **geometria não pode regredir**;
   - faces sem casamento seguro marcadas **`pendente`** (padrão `B-24` do Alto Bellevue), nunca inventadas.
4. Só então promover ao `miguel-marques-cad-lots.json` + atualizar `MM_STATUS_MAP`.

---

## 5. Entregue agora (seguro, verificado)

- **`projetos/page.tsx`** passa a derivar os números do Miguel Marques de `MIGUEL_MARQUES_STATS`
  (mesma geometria CAD do mapa): `853 lotes → 1.254`, `"mais de 800 lotes" → 1.254`,
  `54% → 64% disponíveis`. **Conclui o §2 da Sprint 1** (o card do portfólio era o único ponto
  que ainda tinha contagem hardcoded; hero/SEO/mapa já usavam a fonte única).
- **`scripts/cad/mm/parse_schedule_pdf.py`** (extração reusável do quadro oficial).
- Nenhuma mudança em geometria, no Alto Bellevue ou em componentes compartilhados.

---

## 6. Decisão pendente (dono do produto)

1. Fechar a costura + promover o relabel sob o portão da §4 (esforço dedicado), **ou**
2. Conseguir o quadro em **XLSX/CSV** (ou DXF/DWG com **polilinhas de lote fechadas**), que
   elimina a ambiguidade do PDF e permite cobertura 1:1 — caminho mais limpo para `duplicadas=0`.

*Sem alteração de geometria. Extração e diagnóstico a partir dos arquivos oficiais.*
