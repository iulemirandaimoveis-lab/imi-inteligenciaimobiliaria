# Modelo de Dados — Mapa de Lotes Alto Bellevue

> Modelo canônico consumido pela planta premium. Implementado em
> `src/lib/lots/alto-bellevue.ts`. Fonte: `public/maps/alto-bellevue-lots.json`.

## 1. Princípios

- **Fonte única de verdade:** `public/maps/alto-bellevue-lots.json` (383 lotes).
- **Validação antes de renderizar:** polígonos inválidos são descartados e logados —
  o mapa nunca quebra por dado ruim.
- **Não inventar dados:** o que não existe na fonte oficial é marcado `pendente`.
- **Sem React:** o módulo é puro (testável em Jest/node) e reusado pela UI e pelos testes.

## 2. Empreendimento

| Campo | Valor |
|---|---|
| `empreendimento_id` (Supabase) | `ab7d1fc1-f069-4e3b-a515-8e1204c11247` |
| Nome | Alto Bellevue — Garanhuns, PE |
| Versão da planta | `public/maps/alto-bellevue-lots.json` (viewBox 1200 × 821.86) |
| Total oficial de lotes | **383** (382 comerciais + 1 ANTENA) |

## 3. Lote (`ABLot`)

```ts
interface ABLot {
  id: string;            // "A-01"
  quadra: string;        // "A"
  lot_number: string;    // "01"
  polygon: [number,number][];  // geometria do lote (coords da planta)
  centroid: [number,number];   // ponto de label
  area_m2: number | null;
  price: number | null;        // preço de tabela
  status: string;        // DISPONIVEL | NEGOCIACAO | VENDIDO | PROPRIETARIO | RESERVADO
  has_polygon: boolean;  // resultado da validação geométrica
  // camada comercial embutida
  valor: number | null;        // tabela
  valorVista: number | null;   // à vista (~20% desc.)
  entrada: number | null;
  plans: { p12?, p36?, p60?, p120? };  // { total, parcela }
}
```

Campos técnicos derivados em runtime (não persistidos):
- **testada / profundidade:** `computeDimensions(polygon, area_m2)` em `AltoBellevuePlanView.tsx`.
- **preço/m²:** `price / area_m2`.

## 4. Contexto urbano (`ABMapData`)

| Camada | Origem | Observação |
|---|---|---|
| `streets` | `streets[]` (194) | eixos das ruas |
| `streetLabels` | `streetLabels[]` (19) | nomes das ruas |
| `perimeter` | `perimeter[]` (1) | limite do empreendimento |
| `brLine` | `brLine[]` (18) | rodovia BR adjacente |
| `entrance` | `entrance` | acesso/portaria |
| `amenities` | `amenities[]` (2) | portaria, área de lazer |
| `pending.greenAreas` | `greenAreas` vazio | **pendente** — sem dado oficial |

## 5. Itens `pendente` (revisar no backoffice)

| Item | Situação |
|---|---|
| Áreas verdes (`greenAreas`) | sem polígonos na fonte |
| Preço `B-24` | ausente na tabela comercial |
| `D-15` | preço sem lote correspondente na planta |
| Laterais/fundos por lote | derivados das arestas quando possível; senão `pendente` |

## 6. Carregamento resiliente (`loadAltoBellevueMap`)

1. **Cache de sessão** (`sessionStorage`, chave `imi:ab-map:v1`) — offline-first na sessão.
2. **Fetch com timeout explícito** (8s, `AbortController`) + **retry** com backoff (3×).
3. Em falha total, lança erro → o componente cai para **fallback estático clicável**
   (`public/images/maps/alto-bellevue-plant.jpg`), nunca tela em branco.

## 7. Status comercial (público)

`DISPONIVEL` · `NEGOCIACAO` · `VENDIDO` · `PROPRIETARIO` · `RESERVADO`.
Status interno e auditoria de alterações ficam no Supabase
(`subdivision_lots`, `lot_reservations`, `lot_status_history`) — ver `MAPA_LOTES_BACKOFFICE_SPEC.md`.

## 8. Validação contínua

`npm run validate:lots` (script `scripts/validate-lots.mjs`) + testes Jest
(`src/__tests__/lib/lots/alto-bellevue.test.ts`) garantem total 383, 0 duplicados,
0 polígonos inválidos. Deve rodar no CI.
