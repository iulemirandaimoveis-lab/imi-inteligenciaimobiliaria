# Auditoria — Mapa Miguel Marques vs Alto Bellevue

> **Data:** 2026-06-20
> **Tipo:** Diagnóstico técnico **antes da implementação** (exigido pelo briefing CTO).
> **Base:** leitura do código-fonte + 2 screenshots enviados + arquivos CAD (DWG/DXF) e PDF aprovado re-enviados.
> **Complementa:** `docs/AUDITORIA_MAPAS_AB_MM_2026-06-20.md` (auditoria geral já mesclada na main).
> ⚠️ **Nenhum código de produto foi alterado neste documento.**

---

## 0. Conclusão que muda o plano (ler primeiro)

O briefing parte da premissa de que **o Miguel Marques não tem mapa vetorial** e precisa ser **reconstruído do zero** a partir do CAD. **Essa premissa está incorreta.**

**Já existe um mapa vetorial premium do Miguel Marques, em produção**, construído a partir do **mesmo R07 CAD** que você acabou de re-enviar:

| | URL | Componente | O que renderiza |
|---|---|---|---|
| **O que você printou** | `/pt/imoveis/loteamento-miguel-marques` | `SubdivisionPlanView` (via `SubdivisionLotMap`) | **JPG** `miguel-marques-plant.jpg` + hotspots por quadra ("planta escaneada") |
| **O premium que já existe** | `/pt/projetos/miguel-marques` | `MiguelMarquesPlanView` | **1254 lotes vetoriais reais** (polígonos do CAD), cor por status, filtros, card com parcelamento, carrinho/proposta |

➡️ **O problema central não é "construir um mapa vetorial". É (1) roteamento — a página `/imoveis/...` não usa o motor premium — e (2) acabamento — o motor premium ainda não desenha ruas/perímetro/vegetação como o Alto Bellevue.**

Isso reduz drasticamente o escopo e o risco: em vez de criar um **terceiro** mapa do zero (duplicação), o caminho rigoroso é **evoluir o motor premium existente até a paridade total com o AB e roteá-lo para todas as URLs do MM**.

---

## 1. Evidência dos screenshots

**Screenshot 1 (MM):** barra "Arraste · Pinça · Toque numa quadra"; "565 Disponíveis / 361 Vendidos / 29 Negociação"; "Todos 1000"; faixa "R$ 21.650 – R$ 61.210"; legenda Disponível/Vendido/Negociação/Proprietário; **imagem raster da planta com o carimbo técnico (title block) visível no canto inferior direito** e círculos numerados por cima.
→ É inequivocamente o `SubdivisionPlanView` (JPG + hotspots), alimentado por status do Supabase (`subdivision_lots`), **1000 lotes**.

**Screenshot 2 (AB):** "Buscar lote (ex.: A-12)", "Comparar", pílulas "Todos 383 / Disponível 209 / Negociação 3 / Vendido 171", linha de quadras A–M, render vetorial com vegetação, ruas, selos de quadra (A 23/25, B 8/19…), barra "55% disponível · 383 lotes".
→ É o `AltoBellevuePlanView` premium.

---

## 2. Causa-raiz do roteamento

`SubdivisionLotMap` é o wrapper das rotas genéricas (`/imoveis/[slug]`, `/empreendimentos/[slug]`, `/projetos/alto-bellevue`). Ele decide o motor por ID:

```tsx
// SubdivisionLotMap.tsx:1572
developmentId === AB_DEV_ID            // 'ab7d1fc1-…'  (SubdivisionLotMap.tsx:18)
  ? <AltoBellevuePlanView ... />       // AB → vetorial premium
  : <SubdivisionPlanView ... />        // QUALQUER outro (MM incluso) → JPG
```

O MM (`developmentId = '8b9f6835-…'`, `SubdivisionPlanView.tsx:67`) cai no `else` → **JPG**. Não há branch para o `MiguelMarquesPlanView`.

A rota `/projetos/miguel-marques` é a única que usa o premium: `projetos/miguel-marques/page.tsx:159` → `MasterplanSection` → `MiguelMarquesPlanView`.

---

## 3. Fonte de dados CAD — o que já existe

- **Arquivos re-enviados** = os mesmos já processados: `R07 PLANTA LOTEADA.dxf/.dwg` + `Planta Miguel Marques aprovada.pdf`.
- **Pipeline já existente:** `scripts/cad/build_miguel_marques.py`, `scripts/cad/extract_miguel_marques.py`, `scripts/cad/mm/{extract,polygonize,build-map}.mjs`, `scripts/cad/parse_schedule.py`.
- **Saída:** `public/maps/miguel-marques-cad-lots.json` (319 KB), estrutura:

```json
{ "viewBox": "0 0 1200 1385.52", "totalLots": 1254,
  "lots": [ { "id":"A-1","quadra":"A","lote":"1","points":"…","area":247.85,
              "labelX":1089.83,"labelY":258.14,"status":"vendido","price":38727 }, … ],
  "amenities": [], "greenAreas": [], "streets": [], "perimeter": [], "streetLabels": [], "note": "…" }
```

**Cobertura dos lotes (excelente):**
- **1254 lotes**, **100% com `area` e `price`**, polígono real (`points`), centroide (`labelX/Y`).
- **24 quadras**: A–V, X, Z (inclui **G**, que o `lotsData.ts` legado não tinha).
- Status no CAD: disponivel **798**, vendido **397**, proprietario **53**, negociacao **6**.

**Lacuna do pipeline (a corrigir):** `streets`, `perimeter`, `amenities`, `greenAreas`, `streetLabels` estão **presentes porém vazios** — o extrator pegou os lotes mas **não** as ruas/perímetro. O DXF **contém** essa linework: confirmadas **23 vias "RUA PROJETADA 01…23"** no arquivo. Logo, é **viável** extrair ruas/perímetro do CAD e renderizá-las (atende ao requisito "CAD como fonte primária").

---

## 4. Reconciliação de dados (pendência crítica)

Há **duas contagens** de lotes do MM, de fontes diferentes:

| Fonte | Total | Status | Onde é usada |
|---|---:|---|---|
| **CAD JSON** (`miguel-marques-cad-lots.json`) | **1254** | 798/397/53/6 | Mapa premium (`MiguelMarquesPlanView`, `MasterplanSection`) |
| **Supabase** (`subdivision_lots`) | **~1000** | 565/361/29 (screenshot) | Rota JPG (`SubdivisionLotMap`) e overlay de status no premium |
| `lotsData.ts` (legado) | 529 | — | Só metadados SEO de `/projetos/miguel-marques` |
| Hero hardcoded | "800+" | — | `projetos/miguel-marques/page.tsx:131` |

O premium (`MasterplanSection.tsx:48-72`) sobrepõe o status do Supabase por `id` nos lotes do CAD. **Decisão necessária:** qual é a **fonte de verdade comercial** (preço/status) — CAD (quadro de disponibilidade) ou Supabase (vivo)? E o que fazer com os lotes CAD sem correspondência no Supabase (1254 vs 1000)?

---

## 5. Paridade — MM premium (hoje) vs Alto Bellevue

| Recurso | AB (`AltoBellevuePlanView`) | MM premium (`MiguelMarquesPlanView`) | Gap |
|---|---|---|---|
| Lotes vetoriais (polígono real) | ✅ 383 | ✅ 1254 | — |
| Cor por status (mesma paleta) | ✅ | ✅ (`:36-43`) | — |
| Pan/zoom/pinça/duplo-toque | ✅ | ✅ (`:540-610`) | — |
| Tap por `data-lot-id` (DOM-target) | ✅ | ✅ (`:596-608`) | — |
| Card + parcelamento | ✅ (À Vista/12/36/60/120) | ✅ (À Vista/12/36/60/150) (`:251-350`) | — |
| Carrinho / proposta multi-lote | ❌ | ✅ (`:118-238`) | MM tem a mais |
| Filtros status + quadra | ✅ | ✅ (`:646-703`) | — |
| **Ruas desenhadas** | ✅ | ❌ (dados vazios) | **sim** |
| **Perímetro / quadras vetoriais** | ✅ | ❌ | **sim** |
| **Vegetação / textura / profundidade** | ✅ | ⚠️ só gradiente base | **sim** |
| **Áreas comuns / lago (Quadra Z)** | ✅ 15 amenities | ❌ | **sim** |
| **Busca por lote ("A-12")** | ✅ | ❌ | **sim** |
| **Comparar lotes** | ✅ (3) | ❌ | **sim** |
| **Dimensões** (testada/profund./confrontações) | ✅ derivado do polígono | ❌ (tem polígono, não calcula) | **sim** |
| **Acessibilidade do lote** (role/aria/teclado) | ✅ (`:944-957`) | ❌ só `onMouseEnter/Leave` (`:767-781`) | **sim** |
| Card `role="dialog"`/Escape | ✅ | ❌ | **sim** |
| Selos de quadra | ✅ | ✅ (`:805-833`) | — |
| Fullscreen / zoom controls / reset | ✅ | ✅ | — |
| Compartilhar / copiar link / QR | ⚠️ parcial | ❌ | ambos |

**Resumo:** o MM premium já tem a base (lotes, status, interação, card, carrinho). Faltam **camadas visuais (ruas/perímetro/vegetação/lago)**, **a11y**, **busca**, **dimensões** e **comparar** para igualar o AB.

---

## 6. Bugs / problemas encontrados

1. **[P0 produto] Rota errada:** `/imoveis/loteamento-miguel-marques` serve o **JPG** em vez do vetorial premium que já existe. (Causa: `SubdivisionLotMap.tsx:1572` sem branch para o MM.)
2. **[P1] Camadas do CAD não renderizadas:** `useGeometry` lê só `lots` e ignora `streets/perimeter/amenities` (`MiguelMarquesPlanView.tsx:60-91`); além disso esses arrays estão **vazios** no JSON (extrator incompleto).
3. **[P1] Acessibilidade ausente** nos polígonos do MM (sem `role`/`aria-label`/`tabIndex`/`onKeyDown`).
4. **[P1] Contagens divergentes** (1254 vs 1000 vs 529 vs "800+") — risco comercial/credibilidade.
5. **[P2] Card MM** sem `role="dialog"`/`aria-modal`/Escape; botão "fechar" 32px (<44px); sem compartilhar/copiar link.
6. **[P2] Sem busca por lote** e **sem comparar** no MM.
7. **[P2] Dimensões não exibidas** (testada/profundidade/confrontações) apesar de o polígono permitir o cálculo (reuso de `computeDimensions`/`computeSides` do AB).
8. **[P3] Peso morto:** `alto-bellevue-plant.jpg` (1,04 MB) e config AB no `SubdivisionPlanView` nunca usados; `miguel-marques-plant.jpg` (697 KB) deixa de ser necessário quando o MM for roteado ao vetorial.

---

## 7. Modelo de dados — schema desejado vs atual

Schema-alvo do briefing (EN) × tipo atual `Lot` do MM (`projetos/miguel-marques/data/lotsData.ts:1`):

| Campo alvo | Atual MM | Ação |
|---|---|---|
| `id`, `block`(quadra), `lotNumber`(lote), `areaM2`(metragem), `status`, `polygon`(points) | ✅ (nomes PT) | mapear/renomear |
| `developmentId` | ❌ | adicionar (constante MM) |
| `price`(valor) | ✅ | mapear |
| `frontageM`/`leftSideM`/`rightSideM`/`backM` | ❌ | **derivar do polígono** (reuso AB) |
| `entryPayment`/`installments{quantity,value}` | ⚠️ só tabela fixa | estruturar |
| `centroid{x,y}` | ✅ (`labelX/Y`) | mapear |
| `street` | ❌ | preencher após extrair ruas do CAD |
| `highlights`/`commercialNotes`/`whatsappMessage` | ⚠️ parcial | adicionar |
| `LotStatus` EN (`available/sold/...`) | PT (`disponivel/...`) | **decidir taxonomia única** AB+MM |

**Mínimos obrigatórios** (id, developmentId, block, lotNumber, areaM2, status, polygon): hoje atendidos por 1254/1254 lotes do CAD (status/preço presentes). `frontage/sides/street` ficam como **fallback controlado** até a extração de ruas (registrar como pendência, conforme briefing §5).

---

## 8. Plano faseado proposto (mapeado ao briefing)

**Fase 1 — Roteamento (ganho imediato, baixo risco).** Adicionar `MM_DEV_ID` e branch em `SubdivisionLotMap.tsx:1572` para `MiguelMarquesPlanView` (adaptando os `lots` do Supabase ao formato esperado). Resultado: `/imoveis/...` e `/empreendimentos/...` deixam de mostrar o JPG. *Atende §0, §1 (deixar de parecer foto/PDF).* **Sem tocar no AB** (branch isolado).

**Fase 2 — Paridade visual e funcional.**
- 2a. **Extrair ruas/perímetro/lago do DXF** (estender `scripts/cad/`), popular `streets/perimeter/greenAreas/streetLabels` no JSON. *§2, §10, "CAD como fonte".*
- 2b. **Renderizar camadas** no `MiguelMarquesPlanView` (ruas estilo Google Maps, perímetro, vegetação, lago da Quadra Z) reusando os padrões do AB. *§3.2, §10.*
- 2c. **A11y** nos lotes (role/aria/teclado) + **card** `role="dialog"`/Escape + "fechar" ≥44px. *§6, §7.*
- 2d. **Busca por lote**, **dimensões** derivadas (testada/profundidade/confrontações), **legenda completa**, **compartilhar/copiar link**. *§6, §8.*
- 2e. **Reconciliar contagens** (fonte única) e corrigir hero/SEO. *§5.*

**Fase 3 — Arquitetura compartilhada (opcional, maior).** Extrair `components/maps/shared/` (`InteractiveLotMap`, `LotBottomSheet`, `MapLegend`, `MapFilters`, `LotSearch`, `useMapInteraction`…) e fazer AB + MM consumirem o mesmo motor. **Alto risco de regressão no AB** → fazer por último, com testes. *§4.*

---

## 9. Checklist QA (a preencher na implementação)

```md
- [ ] Lotes reconstruídos a partir de fonte CAD/PDF técnica (1254 do R07)
- [ ] Todos os lotes com polígono próprio
- [ ] Todos os lotes com dados mínimos (id/dev/quadra/lote/área/status/polígono)
- [ ] Card abre no desktop (todos os lotes)
- [ ] Bottom sheet abre no mobile (todos os lotes)
- [ ] Nenhum card corta em 320px
- [ ] Nenhum botão inacessível (alvo ≥44px)
- [ ] Busca funciona
- [ ] Filtros (status + quadra) funcionam
- [ ] Legenda funciona e bate com os contadores
- [ ] Contadores = fonte única de dados
- [ ] Visual no padrão Alto Bellevue (ruas/quadras/vegetação/lago)
- [ ] Não parece foto/print/PDF
- [ ] Corretor apresenta um lote em ≤3 toques
- [ ] Performance mobile aceitável (320/360/375/390/414/430px)
- [ ] Sem erros no console
- [ ] Sem regressão no Alto Bellevue
```

---

## 10. Pendências / decisões em aberto
1. **Fonte de verdade comercial** (preço/status): CAD-quadro vs Supabase? E os 1254 vs 1000.
2. **Taxonomia de status** única (PT vs EN) entre AB e MM.
3. **Manter ou aposentar** o JPG (`SubdivisionPlanView` p/ MM) após o roteamento — sugiro manter como fallback até validar a Fase 2.
4. **Escopo da Fase 3** (motor compartilhado) — desejável, mas só após garantir zero regressão no AB.

## 11. Recomendação
Seguir o **plano faseado** (Fase 1 → 2 → 3). É o caminho **mais rigoroso**: reaproveita o CAD já integrado e o motor premium existente, entrega valor imediato (Fase 1) e atinge a paridade total com o AB (Fase 2), evitando criar um terceiro mapa redundante. Confirmar o escopo antes de codar (conforme `CLAUDE.md`).

---

*Diagnóstico. Próximo passo: aprovar a abordagem/escopo. Nenhuma alteração de UI/produto foi aplicada.*
