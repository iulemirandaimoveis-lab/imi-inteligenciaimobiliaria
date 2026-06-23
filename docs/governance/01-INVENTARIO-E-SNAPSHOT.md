# 01 — Inventário de Funcionalidades + Snapshot Técnico (CONGELAMENTO)

> **Snapshot de referência:** commit `058cdc0` (`main` @ 2026-06-23).
> Tudo listado como **APROVADO / EM PRODUÇÃO** está **CONGELADO**: não pode ser removido
> nem piorado por nenhuma sprint. Evoluções só **aditivas** ou **sob feature flag**.

---

## 1. Os três motores de mapa (realidade arquitetural)

| Motor | Componente | Tipo | Onde renderiza | Maturidade |
|---|---|---|---|---|
| **AB premium** | `imoveis/components/AltoBellevuePlanView.tsx` (~3.344 linhas) | SVG vetorial por lote | Sempre que dev = Alto Bellevue | 🟢 Referência |
| **MM premium** | `projetos/miguel-marques/components/MiguelMarquesPlanView.tsx` (1.143 linhas) | SVG vetorial CAD real | **Só** `/[lang]/projetos/miguel-marques` | 🟡 Avançado |
| **Genérico legado** | `imoveis/components/SubdivisionPlanView.tsx` (via `SubdivisionLotMap.tsx`) | Imagem JPG + hotspots de quadra | Demais empreendimentos **+ MM nas rotas genéricas** | 🔴 Legado |

**Roteador:** `SubdivisionLotMap.tsx`
- `AB_DEV_ID = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247'` (`:27`)
- `MM_DEV_ID = '8b9f6835-1bd0-4850-80b0-aaef2223300d'` (`:28`)
- Branch de render: `:1235` (AB ou MM + viewMode plan) · `:1304` (MM → `MiguelMarquesPlanView`).

> ⚠️ **A dualidade do MM (premium vetorial × JPG legado) é a causa raiz** da percepção de
> "quadras genéricas / SVG colorido". Não é geometria errada no premium — é a rota legada.

---

## 2. Inventário Alto Bellevue (🟢 REFERÊNCIA — CONGELADO)

Fonte: `AltoBellevuePlanView.tsx` + `public/maps/alto-bellevue-lots.json` (374 KB) +
`public/data/alto-bellevue-prices.json` (144 KB, sob demanda).

| Funcionalidade | Evidência | Classe |
|---|---|---|
| Lotes vetoriais por polígono (~383) | `alto-bellevue-lots.json` | Crítica/Produção |
| Pan / pinça / duplo-toque / scroll-zoom | `:2412-2466` | Crítica/Produção |
| Tap resolvido por `data-lot-id` (DOM-target, não geometria) | `:2373-2397`, `:2494-2505` | **Crítica** (fix mobile #290+) |
| Tratamento iOS / `pointercancel` + "tap slop" 12px | `:2404-2411`, `:2478-2486`, `:2521-2529` | **Crítica** (regressão mobile) |
| Acessibilidade do lote (`role`, `aria-label`, `tabIndex`, `onKeyDown`) | `:944-957` | Aprovada |
| Card bottom-sheet/desktop (`role=dialog`, `aria-modal`, `maxHeight 92vh`, Escape, clique-fora) | `:1297,1329,1337-1346` | Crítica/Produção |
| CTAs "Tenho Interesse" + "Agendar Visita" + WhatsApp | `:1568-1590` | Crítica/Produção |
| Busca por lote ("ex.: A-12") | `:2202-2203,2688-2703` | Aprovada |
| Comparar até 3 lotes (`MAX_COMPARE=3`) | `:69` | Aprovada |
| Dados derivados: testada/profundidade/confrontações/rua | `computeDimensions`/`computeSides`/`nearestStreet` | Aprovada |
| Planos de pagamento p12/p36/p60/p120 | `:47,276-347` | Aprovada |
| Camadas: terreno/relevo/vegetação/ruas/BR + áreas comuns clicáveis | `:824-928` | Aprovada |
| **Segurança comercial:** status desconhecido → "Indisponível" (nunca "Disponível") | `:148-156` | **Crítica** |
| Legenda = barra de stats data-driven | `:2346,3141` | Aprovada |

---

## 3. Inventário Miguel Marques — Premium (🟡 AVANÇADO — CONGELADO)

Fonte: `MiguelMarquesPlanView.tsx` + `public/maps/miguel-marques-cad-lots.json` (319 KB).

**Dados reais (verificados):** `totalLots: 1254` · **24 quadras** (A–V, X, Z; pulam W/Y) ·
status: `disponivel 798 · vendido 397 · proprietario 53 · negociacao 6`. ViewBox `0 0 1200 1385.52`.
Geometria: **CAD oficial (R07 PLANTA LOTEADA.dxf)** — `:15-17`, `GEO_URL :17`.

| Funcionalidade | Evidência | Classe |
|---|---|---|
| Lotes vetoriais com polígono real (CAD) + gradientes de terreno | `:737-783` | **Crítica/Produção** |
| Mesmo modelo de ponteiro + tap por `data-lot-id` + "tap slop" 12px | `:540-610,576-578` | **Crítica** (fix mobile) |
| Status com a mesma linguagem visual do AB | `:36-43` | Aprovada |
| Filtros por status e por quadra | `:54,646-703` | Aprovada |
| Barra de stats | `:936-980` | Aprovada |
| Card: À Vista (-20%), tabela, R$/m², área + condições (à vista/12/36/60/150) | `:251-350` | Crítica/Produção |
| **Carrinho + "Proposta de Compra" multi-lote via WhatsApp** (diferencial sobre o AB) | `:118-238` | Aprovada |
| WhatsApp comercial (`5581986141487`) | `:21` | Crítica/Produção |

**Lacunas conhecidas vs AB** (alvo das próximas sprints — **não são regressões**):
- Sem acessibilidade nos polígonos (`role`/`aria-label`/`tabIndex`/`onKeyDown`) — `:767-781` (P1).
- Card sem `role=dialog`/`aria-modal`/Escape; "fechar" 32px < 44px — `:293-299` (P2).
- Sem camada de áreas comuns / lago (Quadra Z) / vias — `:738` (P2).
- Sem busca por lote (P2).
- Legenda incompleta (omite Proprietário/Igreja) — `:964-975` (P2).

---

## 4. Miguel Marques — Legado (🔴 a aposentar, NÃO a replicar)

- `SubdivisionPlanView.tsx`: `<image>` JPG (`miguel-marques-plant.jpg`, **697 KB**) +
  hotspots por quadra (`PLAN_CONFIGS['8b9f6835-…']`, `:66-99`).
- **Conjunto de quadras divergente** do vetorial (inclui W/G que o CAD não tem).
- Serve nas rotas genéricas: `imoveis/[slug]`, `empreendimentos/[slug]`.

> **Decisão de governança:** o legado é **fonte temporária**. A meta (Sprint 1/P1) é
> **unificar todas as rotas do MM no motor vetorial** e parar de servir o JPG.

---

## 5. Pipelines CAD (fonte de verdade — congelados como ferramenta)

| Script | Papel |
|---|---|
| `scripts/cad/mm/extract.mjs` → `data/extracted.json` (178 KB) | Extrai posições/áreas/quadras reais do DXF |
| `scripts/cad/mm/polygonize.mjs` | Reconstrói polígonos |
| `scripts/cad/mm/build-map.mjs` → `public/maps/loteamento-miguel-marques-lots.json` | Contrato unificado do motor |
| `scripts/cad/build_miguel_marques.py` → `public/maps/miguel-marques-cad-lots.json` | JSON consumido pelo `MiguelMarquesPlanView` |
| `scripts/validate-mm-lots.mjs` (`npm run validate:lots:mm`) | Validação de lotes do MM |
| `scripts/validate-lots.mjs` (`npm run validate:lots`) | Validação de lotes (AB) |

---

## 6. Snapshot técnico (congelamento de assets e dados)

| Artefato | Tamanho | Observação |
|---|---|---|
| `public/maps/alto-bellevue-lots.json` | 374 KB | AB vetorial — **congelado** |
| `public/data/alto-bellevue-prices.json` | 144 KB | preços AB sob demanda |
| `public/maps/miguel-marques-cad-lots.json` | 319 KB | MM vetorial (1254 lotes) — **congelado** |
| `public/maps/miguel-marques-cad-context.json` | 47 KB | perímetro/contexto MM |
| `public/maps/loteamento-miguel-marques-lots.json` | 234 KB | contrato unificado do motor |
| `public/images/maps/miguel-marques-plant.jpg` | 697 KB | **legado** (rotas genéricas) |
| `public/images/maps/alto-bellevue-plant.jpg` | 1,04 MB | **asset morto** (nunca servido — branch `:1235`) |

**Comando para reproduzir o snapshot:**
```bash
git rev-parse HEAD           # deve apontar para a base da sprint
npm run type-check && npm run lint && npm test
npm run validate:lots && npm run validate:lots:mm
```

---

## 7. Regra de congelamento (resumo executável)

- ✅ Pode: adicionar camadas/recursos **sob feature flag**; elevar o MM ao nível do AB.
- ⚠️ Sob validação: alterar geometria do MM (só a partir de DWG/DXF/PDF).
- ❌ Proibido sem aprovação: remover/piorar qualquer item das §2 e §3; padronizar "para
  baixo"; trocar o motor vetorial do AB/MM pelo JPG legado; reintroduzir o JPG no MM.
