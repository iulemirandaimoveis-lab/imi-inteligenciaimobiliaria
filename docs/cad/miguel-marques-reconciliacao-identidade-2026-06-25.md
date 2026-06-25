# Reconciliação de IDENTIDADE — Miguel Marques (2026-06-25)

> **Escopo:** reconciliar a identidade `(quadra, lote)` de cada lote renderizado contra a
> fonte oficial — **sem tocar em geometria**. Geometria, coordenadas, projeção, status,
> preço e o Alto Bellevue permanecem intactos.
> **Gatilho:** P0 da auditoria CAD (`docs/miguel-marques-cad-audit.md` §6) — 78 chaves
> `(quadra,lote)` duplicadas (ids `_2`) + cluster de quadras trocadas (B,C,D,E,F,K,L).
> **Fontes oficiais:** XLSX "Disponibilidade Mi Gestão" (agrupamento por quadra + área +
> status) e DXF "R07 PLANTA LOTEADA" (número do lote impresso pelo agrimensor).

---

## 1. Critérios de aceite (todos atendidos)

| Critério | Resultado |
|---|---|
| Mapeamento 1:1 lote oficial ↔ lote renderizado | ✅ 1.254 ↔ 1.254 (4 linhas extras da planilha sinalizadas, §4) |
| `duplicated = 0` | ✅ 0 (eram 78 ids `_2`) |
| `orphaned = 0` | ✅ 0 — toda face recebe identidade única |
| IDs determinísticos | ✅ `{quadra}-{lote}`, sem sufixo `_N` |
| Geometria preservada **exatamente** | ✅ `points/area/labelX/labelY/status/price` byte-idênticos (diff = 0; área total 212.882 m² inalterada) |
| Fonte oficial antes de inferência | ✅ XLSX+DXF como verdade; espacial só desempata |
| Inferência isolada e substituível | ✅ toda a lógica em `scripts/cad/mm/reconcile_identity.py`; cada lote tem `idSource` |
| `validate:lots:mm --strict` | ✅ exit 0 |

---

## 2. Método — *seed-and-fix* (determinístico, conservador)

A geometria de produção **já é fiel ao CAD** (área do polígono = rótulo do agrimensor, erro
médio 0,12 m²) e a maioria dos rótulos já estava correta. Portanto **não** redesenhamos do
zero (isso regrediria quadras corretas). Em vez disso:

1. **Bridge geométrico:** re-extrai as 1.254 faces do DXF, projeta com a MESMA transformada
   do pipeline e casa 1:1 com o JSON existente por centróide — **maxdist 0,000 px** (prova de
   que a geometria é idêntica; só rótulos mudam).
2. **Seed (mantém):** toda face cuja identidade atual **já casa** o quadro oficial
   (mesma quadra+lote, área ≤0,6 m², sem `_N`) é **preservada intacta** → **1.124 lotes**.
   Ex.: `A-5` (224,92 m², a 73 px da âncora A, área oficial 224,92) permanece `A-5`.
3. **Fix (re-deriva):** as **130** faces quebradas (78 duplicatas `_2` + 52 rótulos fora do
   range/cluster) são reatribuídas por **casamento ótimo 1:1** (`scipy.linear_sum_assignment`)
   aos slots oficiais abertos. Custo = `|Δárea|·50 + |dxf# − posição|·10 + dist_regional·1`,
   onde **dist_regional** = distância às faces JÁ confirmadas da quadra-alvo (sinal espacial
   preciso para quadras alongadas — não a âncora-letra única que causava o bug original).
4. Lote = nº oficial (coluna íntegra) ou nº do DXF; quadras com coluna de lote corrompida na
   planilha (B, G — *drag-fill*/linhas duplicadas) usam posição na sequência.

Determinístico (sem aleatoriedade) e re-executável: trocar o XLSX por uma versão corrigida
regenera os rótulos sem tocar na geometria.

---

## 3. Antes → Depois

| Métrica | Antes | Depois |
|---|---:|---:|
| Total de lotes | 1.254 | 1.254 |
| Chaves `(quadra,lote)` duplicadas | **78** | **0** |
| IDs com sufixo `_N` | 78 | 0 |
| Lotes com identidade movida | — | 127 (107 mudaram de quadra) |
| Lotes mantidos (confirmados pela planilha) | — | 1.124 |
| Distribuição/quadra = planilha oficial | ✗ (ex.: C=86 vs 60; V=47 vs 14) | ✅ 20/24 exatas; 4 com −1 (§4) |

**Confiança da relabel (`idSource` por lote):**
- `official` (mantido, casa planilha) — **1.124** (89,6%)
- `area` (re-derivado, área casa o slot oficial ≤0,6 m²) — **106** (8,5%)
- `inferred` (re-derivado, resolvido por espacial/ordem; ou quadra de fonte corrompida) — **24** (1,9%)

→ **98,1% confirmado por dados oficiais**; 1,9% inferido e **sinalizado** para revisão.

### Exemplos de correção
```
# duplicatas _2 eliminadas (área confirma a quadra vizinha real)
B-44_2 → D-44   (160,0 m²)        B-18_2 → D-19   (159,99 m²)
B-43_2 → D-43   (160,0 m²)        C-2_2  → D-18   (159,99 m²)

# cluster de quadra trocada corrigido (dxf# casa a posição da nova quadra)
B-46 → F-47 (dxf#46)   C-2_2 → D-18 (dxf#2)   B-19_2 → D-20 (dxf#19)
```
Os fluxos dominantes (C→D 27, B→D 12, L→K 11, E→F 8, J→K 7) são todos entre quadras
**adjacentes** — coerente com o diagnóstico de fronteira da auditoria.

---

## 4. Divergência planilha × planta (sinalizar no backoffice)

A planilha oficial, após limpeza (remoção de 2 linhas exatas duplicadas na G), lista **1.258**
lotes; a planta/CAD tem **1.254** polígonos. As **4 linhas oficiais sem polígono** ficam sem
casamento (não inventamos geometria):

| Slot oficial | Área | Status | Observação |
|---|---:|---|---|
| `C-5`  | 242,63 m² | disponível | área distinta; único lote 242,6 está em R-3 (longe da C) |
| `E-5`  | 261,95 m² | vendido | área distinta; único lote 262,0 está em S-14 (longe da E) |
| `D-42` | 160,0 m² | vendido | 160 genérico; D tem 63 polígonos vs 64 na planilha |
| `O-28` | 160,0 m² | disponível | 160 genérico; O tem 43 polígonos vs 44 na planilha |

➡️ São **over-counts da planilha comercial** (não falhas de geometria). Recomendação: revisar
esses 4 registros na Mi Gestão. A quadra B também tem a **coluna de lote corrompida por
drag-fill** (valores fracionários `13,34`, `14,49`…) — os números foram reconstruídos pela
ordem das linhas; corrigir na planilha consolida a fonte.

---

## 5. Reprodutibilidade e isolamento

```bash
pip install ezdxf shapely openpyxl numpy scipy pymupdf
python3 scripts/cad/mm/reconcile_identity.py \
  --dxf "<R07 PLANTA LOTEADA.dxf>" --xlsx "<Disponibilidade Mi Gestão.xlsx>" \
  --in  public/maps/miguel-marques-cad-lots.json \
  --out public/maps/miguel-marques-cad-lots.json \
  --map docs/cad/miguel-marques-identity-map.json
npm run validate:lots:mm -- --strict     # porta de aceite (0 dup / 0 órfão / 1254 / 24)
```

- **Camada de inferência isolada:** toda a lógica vive em `reconcile_identity.py`. A geometria
  nunca é reescrita por ele (asserção interna `GEOMETRY/commercial fields changed == 0`).
- **Artefato auditável/substituível:** `docs/cad/miguel-marques-identity-map.json` registra
  cada decisão (`old_id → new_id`, área, dxf#, `source`). Trocar o XLSX por uma versão
  corrigida e re-rodar substitui os rótulos **sem** mexer em geometria.

*Sem alteração de geometria, projeção, status, preço, lógica de render ou Alto Bellevue.*
