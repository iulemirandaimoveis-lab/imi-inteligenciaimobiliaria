# Validação de Lotes — Alto Bellevue

> Relatório de consistência das fontes de dados. Reproduza com `npm run validate:lots`.
> Total oficial esperado: **383 lotes** (382 comerciais + 1 ANTENA).

## 1. Resultado

**Fonte canônica `public/maps/alto-bellevue-lots.json`: ✓ OK**
(esperado 383, encontrado 383, duplicados 0, polígonos inválidos 0)

## 2. Comparação das fontes

| Verificação | `public/maps/...` (canônico) | `public/data/...` (legado, em uso) |
|---|---|---|
| Total de lotes | **383** | 426 |
| IDs únicos | 383 | 416 |
| Duplicados | **0** | **10** (`E-20`, `E-21`, `H-13..H-17`, `H-20`, `K-10`, `K-11`) |
| Polígonos inválidos | **0** | **176** |
| Sem status | 0 | 0 |
| Sem área | 0 | 26 (inclui IDs lixo `D-??`, `M-??-2`) |
| Sem preço | 2 (`N-09` ANTENA, `B-24`) | 26 |
| Contexto urbano | **SIM** — ruas 194, perímetro 1, labels 19, amenities 2 | não |
| viewBox | 1200 × 821.86 | 1000 × 707 (fixo no componente) |

## 3. Lotes por quadra (fonte canônica — 383)

```
A:25  B:20  C:13  D:24  E:38  F:27  G:21  H:45
I:16  J:24  K:32  L:24  M:27  N:31  O:3   P:13
```

Distribuição do arquivo legado diverge (ex.: `O:27`, `H:51`, `C:15`) — confirmando
corrupção, não fonte alternativa válida.

## 4. Status comercial (fonte canônica)

```
DISPONIVEL: 194    VENDIDO: 177    NEGOCIACAO: 12
```

## 5. Divergência planta × tabela comercial

- `prices.json`: **382** entradas de preço.
- **Em planta canônica sem preço:** `B-24`, `N-09` → `N-09` é ANTENA (sem preço por
  natureza); `B-24` deve ser marcado **`pendente`** para revisão comercial.
- **Com preço fora da planta:** `D-15` → preço sem lote correspondente na planta;
  registrar para revisão no backoffice.

## 6. Itens `pendente` (não inventar dados)

| Item | Situação | Ação |
|---|---|---|
| `greenAreas` | vazio no canônico (0 polígonos) | mapear quando houver fonte; exibir `pendente` |
| `B-24` preço | ausente na tabela | revisar com comercial |
| `D-15` | preço sem lote na planta | revisar com comercial |
| Laterais/fundos por lote | derivar das arestas quando possível; senão `pendente` | calcular em runtime |

## 7. Decisão

Adotar **`public/maps/alto-bellevue-lots.json`** como fonte canônica única e descontinuar
o `public/data/alto-bellevue-lots.json` (corrompido). A rotina `validate:lots` deve
rodar no CI e falhar (exit 1) se a fonte canônica regredir (total ≠ 383, duplicados,
polígonos inválidos).
