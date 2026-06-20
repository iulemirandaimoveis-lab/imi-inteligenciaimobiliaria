# Auditoria (Corrigida) dos Mapas IMI — Alto Bellevue + Miguel Marques

> **Data:** 2026-06-20
> **Tipo:** Re-auditoria **baseada no código-fonte** (não em inspeção de DOM ao vivo).
> **Metodologia:** leitura direta dos componentes, hooks e dados, com **evidência `arquivo:linha`** para cada afirmação. Nenhuma alteração de código foi feita — este documento é só diagnóstico.
> **Motivo:** corrigir uma auditoria anterior (baseada em DOM/eventos sintéticos) cujos achados "P0 críticos" **não se confirmam no código**.

---

## 0. TL;DR (Veredito)

1. **A auditoria anterior é, em sua maior parte, imprecisa.** Os três bugs "P0 críticos" que ela destacava (toque não funciona no AB; card estoura a viewport; MM é um JPG estático sem lotes vetoriais) **são contraditos pelo código atual**. Implementá-los "corrigiria" código que já funciona e arriscaria **regressão** — proibida por `.claude/UI_REGRESSION_POLICY.md`.
2. **A causa provável do erro da auditoria anterior:** existem **dois sistemas de mapa** coexistindo, e **qual deles o usuário vê depende da rota**. A auditoria comparou, sem perceber, o **AB premium** contra a **versão JPG legada do MM**.
3. **O problema real e legítimo é de consistência e de dados**, não de interação quebrada:
   - O Miguel Marques tem **duas experiências** (vetorial premium em `/projetos/miguel-marques` vs JPG legado nas rotas genéricas).
   - **Três contagens divergentes** de lotes do MM: hero "800+", metadados SEO 529, mapa renderizado ≈1254.
   - O mapa **vetorial do MM não tem acessibilidade** (sem `role`/`aria-label`/teclado), ao contrário do AB.
4. Achados ergonômicos menores (alvo de toque pequeno em zoom mínimo; botão "fechar" < 44px) são **reais, porém P2**.

---

## 1. Realidade da Arquitetura (a peça que faltava)

Há **dois motores de mapa** no projeto:

| Sistema | Componente | Tipo | Onde é usado |
|---|---|---|---|
| **AB premium** | `imoveis/components/AltoBellevuePlanView.tsx` (~3.320 linhas) | SVG **vetorial** por lote | Sempre que o empreendimento é o Alto Bellevue |
| **MM premium** | `projetos/miguel-marques/components/MiguelMarquesPlanView.tsx` | SVG **vetorial** por lote (CAD real) | **Somente** `/[lang]/projetos/miguel-marques` |
| **Genérico legado** | `imoveis/components/SubdivisionPlanView.tsx` (via `SubdivisionLotMap.tsx`) | **Imagem JPG** + hotspots de quadra | Todos os demais empreendimentos, **inclusive o MM nas rotas genéricas** |

**O roteador é o `SubdivisionLotMap`**, usado por `projetos/alto-bellevue/page.tsx:169`, `empreendimentos/[slug]/page.tsx:106` e `imoveis/[slug]/page.tsx:387,396`. Dentro dele:

```tsx
// SubdivisionLotMap.tsx:1572
developmentId === AB_DEV_ID
  ? <AltoBellevuePlanView ... />   // AB → vetorial premium
  : <SubdivisionPlanView ... />    // qualquer outro (MM incluso) → JPG + hotspots
```

`AB_DEV_ID = 'ab7d1fc1-…'` (`SubdivisionLotMap.tsx:18`).

**Consequência prática:**

| Empreendimento | `/projetos/<slug>` | `/imoveis/[slug]` e `/empreendimentos/[slug]` |
|---|---|---|
| **Alto Bellevue** | Vetorial premium | Vetorial premium (branch p/ `AltoBellevuePlanView`) |
| **Miguel Marques** | **Vetorial premium** (`MasterplanSection` → `MiguelMarquesPlanView`, `projetos/miguel-marques/page.tsx:159`) | **JPG legado** (`SubdivisionPlanView` + `miguel-marques-plant.jpg`, `SubdivisionPlanView.tsx:67-68`) |

➡️ **É quase certo que a auditoria anterior abriu o MM por uma rota genérica** (JPG) e o AB pela rota premium — daí "MM = panfleto estático" vs "AB = render premium". Os dois mapas premium são, na verdade, **gêmeos** em arquitetura.

---

## 2. Reconciliação dos "Bugs" da Auditoria Anterior

| # | Alegação anterior | Veredito | Evidência no código |
|---|---|---|---|
| **01** | AB: seleção de lote só por teclado; tap resolvido por **geometria**; abre lote errado/"A-01" | ❌ **Falso** | O tap é resolvido **subindo o DOM a partir do `e.target` real** até achar `data-lot-id` — **não** por geometria: `dispatchTapFromTarget` (`AltoBellevuePlanView.tsx:2373-2397`), chamado em `handlePointerUp` (`:2494-2505`). Abre o lote tocado. O `<g>` ter só `onKeyDown` (`:944-957`) é **proposital** (eventos sobem para o container). |
| **01b** | "Tap nunca funciona no mobile" | ❌ **Falso** | Os casos de mobile citados **já estão corrigidos com comentários**: "tap slop" de 12px no toque (`:2478-2486`); **não** capturar ponteiro de toque p/ evitar `pointercancel` no iOS (`:2404-2411`); resolver tap também no `pointercancel` (`:2521-2529`). |
| **02** | AB: hit-areas ~4×4px → impossível tocar | ⚠️ **Exagerado** | Em zoom mínimo os lotes são pequenos, **mas o tap resolve pelo alvo do DOM independentemente do tamanho**, e há **duplo-toque** (`:2412-2425`) e **pinça** (`:2442-2466`) p/ ampliar. É polimento ergonômico (P2), não bug crítico. |
| **03** | AB: card sem `max-height`, ~766px, estoura a viewport; valor cortado | ❌ **Falso (essência)** | Bottom sheet já tem `maxHeight: '92vh'` + `overflow-y-auto` e é `role="dialog"`/`aria-modal` (`:1337-1346`); fecha com **Escape** (`:1297`) e **clique fora** (`:1329`). **Verdade parcial:** botão fechar ~34px (`:1710`) < 44px (P2). |
| **04** | MM é **JPG estático** com hotspots; sem lotes vetoriais; sem `data-lot-id`; 0 acessibilidade | ❌ **Falso na rota premium** | `/projetos/miguel-marques` renderiza **polígonos vetoriais** com `data-lot-id` e gradientes de terreno (`MiguelMarquesPlanView.tsx:737-783`), geometria **CAD real** (`:15-17`, `GEO_URL` `:17`). O JPG existe **só** no `SubdivisionPlanView` legado (rotas genéricas). |
| **05** | "565 de 1000"; "955 ≠ 1000"; faltam W/Y/Z; "Negociação"="Proprietário" | ⚠️ **Números errados, mas há um problema real** | `negociacao` e `proprietario` são status **distintos por design** (`lotsData.ts:1`; somados separadamente em `MasterplanSection.tsx:113-116`). Quadras vetoriais = **23** (A–F,H–V,X,Z; pulam G/W/Y), batendo com o hero "23"; **Z existe** (beira-lago). **Problema real (ver §5):** contagens divergentes 800+/529/≈1254. |
| **06** | MM: card só tem metragem/valor/R$m²/agendar/compartilhar; sem planos de pagamento | ❌ **Em boa parte falso** | O card do MM tem badge de status, beira-lago, **À Vista (-20%)**, tabela, R$/m², área e **tabela completa de condições** (À vista/12/36/60/150) (`MiguelMarquesPlanView.tsx:251-350`), além de **carrinho/"Proposta"** multi-lote com WhatsApp (`:118-238`) — recurso que o AB **não** tem. **Verdade parcial:** faltam testada/profundidade/confrontações/rua (P2). |
| **07** | Performance: FCP ~5s no AB; JPG 713KB cru no MM | ⚠️ **Parcial / mal direcionado** | O JPG de 713KB (`miguel-marques-plant.jpg`) **só carrega nas rotas legadas**, não na premium. Existe também `alto-bellevue-plant.jpg` de **1,04 MB** que, por causa do branch (`:1572`), **nunca** é usado pelo AB (peso morto). FCP não foi medido aqui. |

**Placar:** dos 7 itens, **3 são falsos** (01, 03, 04), **3 são parciais/exagerados** (02, 06, 07) e **1 tem um núcleo verdadeiro porém com números errados** (05).

---

## 3. Estado Real do Alto Bellevue (verificado)

**Maturidade alta.** `AltoBellevuePlanView.tsx` + dados em `public/maps/alto-bellevue-lots.json` (374 KB) e `public/data/alto-bellevue-prices.json` (144 KB, carregado sob demanda — `usePrices` `:411-432`).

Capacidades confirmadas:
- **Interação robusta:** pan/pinça/duplo-toque/scroll-zoom; tap resolvido por `data-lot-id` (`:2373-2397`); tratamento explícito de iOS/`pointercancel` e "tap slop".
- **Acessibilidade do lote:** `role="button"`, `aria-label` completo, `tabIndex=0`, `onKeyDown` (`:944-957`).
- **Card (bottom sheet/desktop):** `role="dialog"`/`aria-modal`, `maxHeight 92vh`, scroll interno, Escape, clique-fora (`:1297,1329,1337-1346,1687,1944`). CTAs **"Tenho Interesse"** e **"Agendar Visita"** + WhatsApp (`:1568-1590`).
- **Busca por lote** ("ex.: A-12") (`:2202-2203,2688-2703,2757-2766`).
- **Comparar** até 3 lotes (`MAX_COMPARE=3`, `:69`; `multiSelectMode`/`compareIds`).
- **Dados ricos derivados:** testada/profundidade (`computeDimensions`), confrontações (`computeSides`), rua de acesso (`nearestStreet`), planos p12/p36/p60/p120 (`:47`).
- **Camadas:** terreno/relevo/vegetação/ruas/BR + **áreas comuns** (portaria, lazer, áreas verdes) clicáveis com `aria-label` (`:824-928`).
- **Segurança comercial:** status desconhecido vira **"Indisponível"** (cinza), **nunca** "Disponível" (`:148-156`) — ótimo.
- **Legenda = barra de stats** data-driven (`:2346,3141`).

Pontos de atenção (reais, não-críticos):
- **A11y over-exposure:** os ~383 lotes têm `tabIndex=0` → ~383 paradas de Tab para varrer o mapa. Considerar `tabIndex=-1` + navegação por setas/lista. (P2)
- **Monólito de ~3.320 linhas** mistura render + dados + UI + comparação + WhatsApp. Manutenção difícil; já existe infra parcialmente compartilhada em `src/components/maps/`. (P2, dívida técnica)
- **Asset morto:** `alto-bellevue-plant.jpg` (1,04 MB) + config em `SubdivisionPlanView.tsx:100-110` nunca usados pelo AB. (P3, limpeza)

---

## 4. Estado Real do Miguel Marques (verificado)

### 4a. Premium (`/projetos/miguel-marques`) — `MiguelMarquesPlanView.tsx`
**Espelha o AB em arquitetura**, com extras e algumas lacunas:
- **Vetorial CAD real** (`/maps/miguel-marques-cad-lots.json`, 319 KB; ≈1254 lotes) (`:15-17,60-91,737-783`).
- Mesmo modelo de ponteiro + tap por `data-lot-id` (`:540-610`), "tap slop" 12px (`:576-578`), sem captura de toque (`:546-548`).
- **Status com a mesma linguagem visual do AB** (`:36-43`).
- **Filtros** por status e por quadra (`:54,646-703`); **barra de stats** (`:936-980`).
- **Card** com À Vista (-20%), tabela, R$/m², área e **condições de pagamento** completas (`:251-350`); `maxHeight 82vh` + scroll.
- **Carrinho / "Proposta de Compra"** multi-lote com cálculo por condição e envio ao WhatsApp (`:118-238`) — **diferencial sobre o AB**.

Lacunas reais vs AB:
- **❗ Acessibilidade ausente:** os polígonos têm só `onMouseEnter/Leave`; **sem `role`, `aria-label`, `tabIndex`, `onKeyDown`** (`:767-781`). Mapa **não navegável por teclado nem por leitor de tela**. (P1)
- **Card sem `role="dialog"`/`aria-modal` e sem Escape**; "fechar" 32px < 44px (`:293-299`). (P2)
- **Sem camada de áreas comuns / lago / vias** ("sem ruas/lago sintéticos", `:738`), apesar de o lago (Quadra Z) ser destaque comercial. (P2)
- **Sem busca por lote** (o AB tem). (P2)
- **Legenda incompleta:** a barra mostra só Disponível/Negociação/Vendido, omitindo Proprietário/Igreja, que existem nos dados (`:964-975`). (P2)
- Menor: `onPointerLeave` reusa `handlePointerUp` (`:715`) — em teoria pode disparar um "tap" ao sair do container; risco baixo.

### 4b. Legado (rotas genéricas) — `SubdivisionPlanView.tsx`
- **`<image>` JPG** (`miguel-marques-plant.jpg`, 697 KB) + **hotspots por quadra** (`PLAN_CONFIGS['8b9f6835-…']`, `:66-99`). Visual de planta, sem cor por status no mapa, sem lotes vetoriais.
- **Conjunto de quadras diferente** do vetorial: a config inclui **W** (e G/Z) — quadras que o CAD vetorial **não** tem. Ou seja, as duas versões do MM mostram **quadras divergentes**.

➡️ **Esta dualidade é o verdadeiro "gap de qualidade"** que a auditoria anterior percebeu — mas a causa é **arquitetural/roteamento**, não "o MM é um panfleto".

---

## 5. Integridade de Dados (achados legítimos)

| Item | Evidência | Severidade |
|---|---|---|
| **3 contagens divergentes de lotes (MM)**: hero **"800+"** + "23 quadras" *hardcoded* (`page.tsx:131-133`); **metadados SEO = 529** (`ALL_LOTS` de `lotsData.ts`, `page.tsx:6,15-16,21,25`); **mapa/section ≈1254** (CAD JSON, `MasterplanSection.tsx:12,31-46`). O `<title>`/OG dirá "529 lotes" enquanto a página mostra ≈1254. | **P1** |
| **`lotsData.ts` (529) virou fonte órfã**: o mapa ignora e usa o CAD JSON. Duplicação de fonte → risco de divergência. | **P1** |
| **Quadras divergentes entre as duas versões do MM** (vetorial: 23 sem G/W/Y; JPG: inclui W/G). | **P2** |
| **Asset morto AB**: `alto-bellevue-plant.jpg` (1,04 MB) nunca servido (branch `:1572`). | **P3** |
| AB: relatos antigos de lote sem preço (ex.: `N-09`) — não reverificado aqui; conferir `aria-label` x `prices.json`. | **P3** |

> Observação: `negociacao` ≠ `proprietario` **por design** (`lotsData.ts:1`). A taxonomia está **correta**; a auditoria anterior errou nesse ponto.

---

## 6. Achados Reais, Priorizados

### P0 — (nenhum)
Não há bug crítico de interação/render confirmado. Os "P0" anteriores não se sustentam.

### P1 — Consistência e dados
1. **Unificar a experiência do MM.** Decidir: ou as rotas genéricas do MM passam a usar o vetorial premium (preferível), ou se aposenta o caminho JPG para o MM. *Arquivos:* `SubdivisionLotMap.tsx:1572`, `SubdivisionPlanView.tsx:66-99`, `imoveis/[slug]/page.tsx`, `empreendimentos/[slug]/page.tsx`.
   - **Aceite:** o MM mostra o mesmo mapa (vetorial) em todas as rotas; nenhuma rota serve `miguel-marques-plant.jpg`.
2. **Fonte única de verdade para contagens do MM.** Derivar hero + metadados do **mesmo** dataset do mapa (CAD JSON). *Arquivos:* `projetos/miguel-marques/page.tsx:15-16,131-133`, `MasterplanSection.tsx:75-85`, `lotsData.ts`.
   - **Aceite:** hero, `<title>`/OG e barra do mapa exibem **o mesmo número**.
3. **Acessibilidade do mapa vetorial do MM.** Adicionar `role="button"`, `aria-label`, `tabIndex` e `onKeyDown` aos polígonos (espelhar o AB `:944-957`). *Arquivo:* `MiguelMarquesPlanView.tsx:767-781`.
   - **Aceite:** lotes do MM selecionáveis por teclado e anunciados por leitor de tela.

### P2 — Paridade e polimento
4. **Alvo de toque "fechar" ≥ 44px** nos cards (AB `:1710`; MM `:293-299`).
5. **MM:** `role="dialog"`/`aria-modal` + Escape no card; legenda completa (incluir Proprietário/Igreja, `:964-975`); **busca por lote**; camada de **áreas comuns/lago**.
6. **AB:** reduzir paradas de Tab (lista/`tabIndex=-1` + setas); enriquecer o card do MM com testada/profundidade/confrontações (o MM já tem `points`, dá para usar `computeDimensions`/`computeSides` do AB).
7. **Ergonomia de zoom:** "zoom-into-quadra" opcional para ampliar alvos em zoom mínimo (vale p/ AB e MM).

### P3 — Limpeza / dívida técnica
8. Remover `alto-bellevue-plant.jpg` + config AB morta em `SubdivisionPlanView`.
9. Extrair componentes compartilhados (`LotBottomSheet`, `MapLegend`, `MapFilters`, `useMapInteraction`) para AB e MM — reduzindo o monólito de ~3.320 linhas. (Já há base em `src/components/maps/`.)

---

## 7. Recomendação de Performance (a verificar com medição real)
- Servir **plantas JPG via `next/image`** (WebP/AVIF, `sizes`, lazy) **enquanto** o caminho legado existir; ou eliminá-lo (P1.1).
- Medir LCP/INP reais em 4G antes de agir no AB (o "FCP ~5s" anterior não foi reproduzido aqui).
- Avaliar custo de hidratação/parse dos JSONs (`alto-bellevue-lots.json` 374 KB; `miguel-marques-cad-lots.json` 319 KB).

---

## 8. Relação com Auditorias Já Existentes no Repositório
Este documento **complementa** (não substitui) trabalhos recentes — evitar duplicar:
- `docs/AUDITORIA_IMI_SPATIAL_ENGINE_2026-06-19.md` (já mapeia os dois motores, o monólito e a comparação limitada a 3 lotes).
- `docs/auditoria-mapa-alto-bellevue-final.md`, `AUDITORIA_MAPA_ALTO_BELLEVUE.md`, `MAPA_LOTES_UX_SPEC.md`, `MAPA_LOTES_DATA_MODEL.md`, `docs/handoff-mapa-alto-bellevue-cad.md`.

---

## 9. Índice de Evidências (arquivo:linha)

**Roteamento / arquitetura**
- `imoveis/components/SubdivisionLotMap.tsx:14,18,974,1572-1585` — branch AB premium vs JPG.
- `imoveis/components/SubdivisionPlanView.tsx:66-111` — `PLAN_CONFIGS` (MM `8b9f6835` → JPG; AB `ab7d1fc1` → JPG morto).
- `projetos/miguel-marques/page.tsx:159` → `MasterplanSection.tsx:8,183` → `MiguelMarquesPlanView`.
- Usos do wrapper: `projetos/alto-bellevue/page.tsx:169`, `empreendimentos/[slug]/page.tsx:106`, `imoveis/[slug]/page.tsx:387,396`.

**AB (`AltoBellevuePlanView.tsx`)**
- Tap por DOM-target: `2373-2397`, `2494-2505`; lote só `onKeyDown`: `944-957`.
- Mobile: `2404-2411`, `2478-2486`, `2521-2529`; zoom: `2412-2425`, `2442-2466`.
- Card: `1297`, `1329`, `1337-1346`, `1568-1590`, `1687`, `1710`, `1944`.
- Busca/Comparar/dados: `69`, `2202-2203`, `2688-2703`, `2757-2766`, `47`, `276-347`.
- Status seguro: `148-156`; legenda: `2346`, `3141`.

**MM (`MiguelMarquesPlanView.tsx`)**
- Vetorial CAD: `15-17`, `60-91`, `737-783`; tap: `540-610`; **sem a11y nos polígonos:** `767-781`.
- Card/condições/carrinho: `46-52`, `251-350`, `118-238`; legenda parcial: `964-975`.

**Dados**
- `projetos/miguel-marques/page.tsx:6,15-16,21,25,131-133` (800+/529); `MasterplanSection.tsx:12,31-46,75-85` (CAD ≈1254); `lotsData.ts:1` (status distintos).
- Assets: `public/images/maps/miguel-marques-plant.jpg` (713.575 B), `public/images/maps/alto-bellevue-plant.jpg` (1.088.539 B), `public/maps/*.json`.

---

*Documento de diagnóstico. Nenhuma mudança de código foi aplicada. Próximo passo sugerido: aprovar o escopo P1 antes de qualquer alteração (conforme `CLAUDE.md` e `.claude/UI_REGRESSION_POLICY.md`).*
