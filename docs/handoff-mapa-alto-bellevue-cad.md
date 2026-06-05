# Handoff — Mapa Alto Bellevue: leva de precisão geométrica (CAD)

> **Para a próxima sessão/branch.** Continuação direta do trabalho da branch
> `claude/alto-bellevue-map-audit-r0Kby` (PR #233). Esta leva depende dos
> arquivos oficiais **DXF/DWG/PDF**, que o solicitante vai **subir nesta nova
> branch** (computador com suporte a upload).

---

## 0. Missão

Levar o mapa interativo do Alto Bellevue à **precisão geométrica real**, usando o
CAD oficial como **fonte de verdade** (os arquivos oficiais vencem o código atual).
**Não inventar coordenadas.** Onde não houver dado oficial, marcar `pendente`.

---

## 1. Onde estão os arquivos oficiais

O solicitante vai disponibilizar nesta branch um (ou mais) dos seguintes:

- **DXF** (preferível — vetorial, parseável como texto) com layers de lotes,
  perímetro, eixos de via, textos (nomes de rua), e blocos de portaria/áreas comuns.
- **DWG** (converter para DXF se necessário).
- **PDF** da planta de parcelamento (`planta-parcelamento.pdf`) — pode ser lido
  por páginas renderizadas (visual) para conferência.

Locais possíveis (verifique todos):
1. Anexados diretamente no chat da sessão.
2. `public/empreendimentos/alto-bellevue/` (PDF + `manifest.json`).
3. Bucket Supabase **privado** `development-files` (signed URL) e tabela
   `public.development_files` (projeto `zocffccwjjyelwrgunhu`).

> ⚠️ Na branch anterior, esses arquivos **não chegaram** ao remoto e o bucket
> estava **vazio**. Confirme o acesso real antes de prosseguir; se faltar, peça.

> ⚠️ O `manifest.json` mencionado cita **"101 lotes"** — isso diverge do total
> oficial de **383**. Reconcilie: pode ser uma fase, um subconjunto, ou erro de
> metadado. **Não** assuma 101 sem confirmar no CAD/tabela.

---

## 2. Estado atual (o que já foi entregue — PR #233)

Arquivo principal: `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`
Camada de dados: `src/lib/lots/alto-bellevue.ts`
Fonte canônica: `public/maps/alto-bellevue-lots.json`

Entregue (independente de CAD):
- **Áreas comuns clicáveis** → `AmenityBottomSheet` (descrição, função, CTAs
  "Ver no mapa" / WhatsApp). Data-driven via `AMENITY_INFO` + `amenities` do JSON.
- **Rede de segurança de contenção**: o renderer (`MapInner`) calcula o maior anel
  do `perimeter` e **não desenha** lote totalmente fora dele (`pointInPolygon`).
  Quando o B-24 for reposicionado para dentro, ele **volta a aparecer sozinho**.
- **Pipeline de validação** `scripts/validate-lots.mjs`: teste point-in-polygon de
  contenção; o gate (`exit 1`) falha se houver **qualquer lote fora do perímetro**.

---

## 3. Modelo de dados canônico (`public/maps/alto-bellevue-lots.json`)

```
viewBox: "0 0 1200.0 821.86"   // espaço SVG; CAD precisa ser transformado p/ cá
totalLots: 383
lots[]: { id:"A-01", quadra:"A", lote:"01",
          points:"x,y x,y …",          // polígono em coords SVG
          area:356,                      // m² REAIS (da tabela/memorial)
          labelX, labelY,                // centro do rótulo (usado p/ contenção)
          status, price, valor, valorVista, entrada, p12/p36/p60/p120 }
streets[]:      ["x,y x,y …", …]   // 194 eixos de via
perimeter[]:    ["x,y x,y …"]      // 1 anel, 66 vértices (bbox x:180–1090, y:125–736)
brLine[]:       [...]               // linha da BR-423
streetLabels[]: [{x,y,name}, …]    // 16 rótulos de rua
entrance:       {x,y,label}         // acesso externo (fica FORA do perímetro — ok)
amenities[]:    [{id,label,icon,color,x,y}]  // portaria, lazer, …
greenAreas[]:   []                  // VAZIO → pendente (não inventar)
```

Observações de transformação:
- Os polígonos estão em **coords SVG** (não em metros). O pipeline DXF deve aplicar
  uma **transformação afim** (escala + translação + possível inversão de Y, pois
  SVG tem Y para baixo) do espaço CAD (metros) para o viewBox `1200×821.86`.
  Decida: manter o viewBox atual e ajustar a transformação, OU recalcular o viewBox
  a partir do bbox do CAD (e atualizar `AB_VIEWBOX` em `src/lib/lots/alto-bellevue.ts`).
- `area` deve vir dos **m² reais** (tabela/memorial), não do shoelace do polígono.
  `computeDimensions()`/`computeSides()` derivam testada×profundidade via
  `scaleFactor = sqrt(area / areaSVG)` — então polígonos fiéis + área real = medidas certas.

---

## 4. Divergências a corrigir COM o CAD (verificáveis hoje)

Rode `npm run validate:lots` para reproduzir:

| # | Item | Estado atual | Ação com CAD |
|---|---|---|---|
| 1 | **B-24** (833 m², VENDIDO, R$546.703,84) | polígono `1092–1115` → **fora** do perímetro (`@1104,209`) | reposicionar nas coords reais; confirmar quadra/numeração |
| 2 | **Portaria** | amenity `@600,773` (abaixo do perímetro, maxY=736) | extrair bloco/símbolo da portaria no CAD e gravar `x,y` reais |
| 3 | **Área de lazer/clube** | amenity `@600,411` sobre via | dar polígono próprio a partir do CAD |
| 4 | **Quadra O** | só **3 lotes** (O-01..03) | conferir nº de lotes, numeração, metragens, orientação/origem |
| 5 | **Nomes de rua** | 16 labels | conferir grafia/posição/eixo contra a layer de textos do DXF |
| 6 | **D-15** | preço sem lote na planta | resolver no backoffice (planta × tabela) |
| 7 | **greenAreas** | vazio | mapear áreas verdes do CAD (ou manter pendente) |
| 8 | **Reconciliar 383 × "101"** | manifest cita 101 | confirmar total real contra CAD + tabela |

Distribuição por quadra atual (total 383):
`A:25 B:20 C:13 D:24 E:38 F:27 G:21 H:45 I:16 J:24 K:32 L:24 M:27 N:31 O:3 P:13`

---

## 5. Plano sugerido para a nova branch

1. **Confirmar acesso** ao DXF/PDF (seção 1). Se faltar, pedir antes de codar.
2. **Pipeline de parsing** (`scripts/`): DXF → extrair layers → polígonos por lote,
   perímetro, eixos de via, textos de rua, blocos de portaria/áreas. Gerar
   **GeoJSON/JSON normalizado** + a transformação afim para o viewBox.
3. **Regenerar** `public/maps/alto-bellevue-lots.json` com geometria correta
   (B-24, portaria, Quadra O, ruas), preservando a camada comercial (preços/planos).
4. **Validar**: `npm run validate:lots` precisa ficar **verde**
   (0 lotes fora do perímetro, 383 lotes, 0 duplicados, 0 polígono inválido) e
   `npx jest …/alto-bellevue.test.ts` 14/14.
5. **Conferir no preview** (mobile + desktop): zoom/LOD, áreas comuns clicáveis,
   fullscreen, CTA WhatsApp não cobrindo controles.
6. **Atualizar** `docs/auditoria-mapa-alto-bellevue-final.md` com antes/depois,
   prints e checklist (§8 do briefing) fechado.

## 6. Regras (do projeto e do briefing)

- Arquivos oficiais **vencem** o código. Não inventar coordenadas.
- Preservar arquitetura (App Router, Supabase RLS, server/client split).
- Não alterar auth/billing/DB sem aprovação. Não commitar secrets/`.env.local`.
- Só encerrar com evidência objetiva: prints, testes, contagem validada,
  comparação com PDF/DWG/DXF, produção conferida, relatório atualizado.

## 7. Comandos úteis

```bash
npm ci                                            # deps (node 20.x)
npm run validate:lots                             # consistência + contenção
npx jest src/__tests__/lib/lots/alto-bellevue.test.ts
npx tsc --noEmit                                  # 0 erros esperado
npx next lint --file <arquivo>
```
