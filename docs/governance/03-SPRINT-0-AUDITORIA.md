# 03 — SPRINT 0: Auditoria

> **Regra da sprint:** nenhuma alteração visual, nenhuma alteração funcional. **Só auditoria.**
> **Base:** commit `058cdc0` (2026-06-23). Evidência por `arquivo:linha`.
> Consolida e atualiza `docs/AUDITORIA_MAPAS_AB_MM_2026-06-20.md` (não o substitui).

---

## 0. Veredito (TL;DR)

1. **A premissa "Claude está refinando um desenho simplificado" não se confirma no código
   do mapa premium.** `/projetos/miguel-marques` já renderiza **polígonos vetoriais com
   geometria do CAD oficial (R07 PLANTA LOTEADA.dxf)** — 1.254 lotes, 24 quadras
   (`MiguelMarquesPlanView.tsx:15-17,737-783`; `miguel-marques-cad-lots.json`).
2. **A percepção de "quadras genéricas / SVG colorido" vem da versão JPG legada** que ainda
   serve as **rotas genéricas** do MM (`SubdivisionPlanView.tsx:66-99` + `miguel-marques-plant.jpg`).
   Existem **dois MMs** convivendo; quem abre a rota genérica vê o legado.
3. **Não há bug P0 de interação/render confirmado.** Os gaps reais são de **consistência,
   dados e paridade premium** (a11y, áreas comuns/lago, busca, unificação de rotas, contagens).
4. **Risco principal da evolução:** ao "melhorar o MM", regredir o **AB** (referência) ou
   padronizar para baixo. A governança ([00](./00-GOVERNANCA-SPRINTS.md)) existe para impedir isso.

---

## 1. Arquitetura atual (entregável)

- **Stack:** Next.js 14 (App Router), Supabase (RLS), TypeScript, Tailwind, Anthropic SDK.
- **Três motores de mapa** (detalhe completo em [01 §1](./01-INVENTARIO-E-SNAPSHOT.md)):
  - AB premium (`AltoBellevuePlanView.tsx`, ~3.344 linhas) — vetorial.
  - MM premium (`MiguelMarquesPlanView.tsx`, 1.143 linhas) — vetorial CAD.
  - Genérico legado (`SubdivisionPlanView.tsx`) — JPG + hotspots.
- **Roteador** `SubdivisionLotMap.tsx`: decide por `developmentId` (AB/MM IDs em `:27-28`;
  branch em `:1235,1304`).
- **Motor compartilhado** parcial em `src/components/maps/` (`InteractiveLotMap.tsx`,
  `useLotMap.ts`) e `src/lib/lotmap/` (`engine.ts`, `cart.ts`).

## 2. Componentes atuais (entregável)

| Camada | Arquivos |
|---|---|
| AB | `imoveis/components/AltoBellevuePlanView.tsx` |
| MM premium | `projetos/miguel-marques/components/{MiguelMarquesPlanView,MasterplanSection,MasterplanFilters,LotDetailsPanel}.tsx` |
| MM legado / roteador | `imoveis/components/{SubdivisionLotMap,SubdivisionPlanView}.tsx` |
| Dados MM | `projetos/miguel-marques/data/{lotsData.ts (529),masterplanLayout.ts}` |
| Motor genérico | `components/maps/*`, `lib/lotmap/*` |
| Disponibilidade | `lib/lots/{miguel-marques,alto-bellevue}-availability.ts`; cron `api/cron/sync-miguel-marques-availability` |

**Código legado/morto identificado (não usado em produção):**
- `InteractiveMasterplan.tsx` + `masterplanLayout.ts` (grade `QUADRA_LAYOUTS` rows×cols) —
  **não é importado em lugar nenhum ativo**. É *exatamente* o "mapa de quadras genéricas
  por retângulos" — mas **não está em produção**. Candidato a remoção (P3).
- `alto-bellevue-plant.jpg` (1,04 MB) — nunca servido (branch `:1235`). Asset morto (P3).

## 3. Bugs / achados atuais (entregável)

| # | Achado | Sev | Evidência |
|---|---|---|---|
| 1 | **Dualidade de experiência do MM** (premium vetorial × JPG legado por rota) | **P1** | `SubdivisionLotMap.tsx:1235,1304`; `SubdivisionPlanView.tsx:66-99` |
| 2 | **Contagens divergentes do MM**: hero "800+" / SEO 529 / mapa ≈1254 | **P1** | `miguel-marques/page.tsx:131-133,15-16`; `MasterplanSection.tsx`; `lotsData.ts` |
| 3 | **`lotsData.ts` (529) é fonte órfã** — mapa usa CAD JSON (1254) | **P1** | duplicação de fonte |
| 4 | **MM premium sem acessibilidade** nos polígonos | **P1** | `MiguelMarquesPlanView.tsx:767-781` |
| 5 | MM premium: card sem `role=dialog`/`aria-modal`/Escape; "fechar" 32px<44px | P2 | `:293-299` |
| 6 | MM premium: sem camada de **áreas comuns/lago (Quadra Z)/vias** | P2 | `:738` |
| 7 | MM premium: sem **busca por lote**; legenda incompleta (omite Proprietário/Igreja) | P2 | `:964-975` |
| 8 | Quadras divergentes entre versões do MM (legado inclui W/G) | P2 | `SubdivisionPlanView.tsx:66-99` |
| 9 | Código morto: `InteractiveMasterplan`/`masterplanLayout`; `alto-bellevue-plant.jpg` | P3 | — |

> **Não-bugs (já corrigidos / por design):** tap mobile do AB (DOM-target, `:2373-2397`);
> card AB com `maxHeight 92vh` (`:1337-1346`); `negociacao` ≠ `proprietario` (por design).
> Ver reconciliação completa em `AUDITORIA_MAPAS_AB_MM_2026-06-20.md §2`.

## 4. Mapa Alto Bellevue (entregável)

Estado **maduro / referência**. Capacidades confirmadas em [01 §2](./01-INVENTARIO-E-SNAPSHOT.md):
interação robusta (pan/pinça/duplo-toque/tap por DOM), a11y de lote, card acessível,
busca, comparar (3), dados ricos (testada/profundidade/confrontações/rua), planos de
pagamento, camadas + áreas comuns, status seguro ("Indisponível" por padrão).

## 5. Mapa Miguel Marques (entregável)

**Premium:** espelha o AB em arquitetura, com **carrinho/proposta multi-lote** como
diferencial; geometria CAD real. **Lacunas** (a11y, áreas comuns/lago, busca, legenda)
são alvo das sprints — **não regressões**. **Legado:** JPG + hotspots nas rotas genéricas.
Dados verificados: 1254 lotes, 24 quadras, status `798/397/53/6`.

## 6. Diferenças AB × MM (entregável)

| Dimensão | Alto Bellevue | Miguel Marques (premium) | Gap |
|---|---|---|---|
| Geometria | Vetorial (~383) | Vetorial CAD (1254) | — (paridade) |
| Interação ponteiro/tap | ✅ | ✅ | — |
| Acessibilidade (teclado/leitor) | ✅ `:944-957` | ❌ `:767-781` | **MM atrás** |
| Card acessível (dialog/Escape) | ✅ | ⚠️ parcial | MM atrás |
| Busca por lote | ✅ | ❌ | MM atrás |
| Comparar lotes | ✅ (até 3) | ❌ (tem carrinho) | abordagens diferentes |
| Carrinho + proposta multi-lote | ❌ | ✅ `:118-238` | **AB atrás** |
| Dados ricos (testada/confrontações) | ✅ | ⚠️ parcial | MM atrás |
| Camadas + áreas comuns/lago | ✅ | ❌ `:738` | MM atrás |
| Unificação de rotas | ✅ (sempre premium) | ❌ (JPG nas genéricas) | **MM atrás** |

> **Conclusão de paridade:** padronizar = **elevar o MM ao AB** (a11y, busca, dados, camadas,
> unificação de rotas) **e** levar o **carrinho/proposta do MM ao AB**. Nunca o contrário.

## 7. Pontos de regressão (entregável — vigiar nas sprints)

1. **Não trocar o vetorial por JPG** em nenhuma rota (AB ou MM).
2. **Não quebrar o tap mobile** do AB/MM ao mexer em ponteiros/zoom (`:2373-2397`, `:540-610`).
3. **Não regredir o card** (maxHeight/scroll/Escape/clique-fora) do AB.
4. **Não perder** carrinho/proposta multi-lote do MM ao refatorar.
5. **Não introduzir** "Disponível" para status desconhecido (segurança comercial AB `:148-156`).
6. **Não divergir** contagens ao unificar fontes de dados.
7. **Não tocar** em `.claude/ALTO_BELLEVUE_LOCATION.md` (URLs congeladas).

→ Checklist operacional completo em [02](./02-CHECKLIST-REGRESSAO.md).

## 8. Oportunidades GRAFF (entregável — referência https://graff.estate)

Padrão-alvo: masterplan premium navegável, com sensação de **ativo imobiliário**, não de
planta colorida. Oportunidades mapeadas (a executar nas Sprints 1–6, **sob flag**):

| Oportunidade | Sprint | Base já existente |
|---|---|---|
| Geometria fiel à planta aprovada (verificar polylines fechadas no DWG) | 1 | CAD JSON 1254 lotes |
| Unificar MM (vetorial em todas as rotas) + fonte única de contagem | 1 | roteador `SubdivisionLotMap` |
| Motor espacial completo (zoom progressivo, foco automático, busca) | 2 | interação AB de referência |
| Profundidade/sombra/relevo, hierarquia de áreas, áreas comuns/lago destacados | 3 | gradientes de terreno MM `:737` |
| Digital Twin com camadas (técnica/comercial/render/satélite/drone) | 4 | camadas AB `:824-928` |
| Sales OS (carrinho/comparação/proposta/reserva/compartilhar/histórico) | 5 | carrinho MM `:118-238` |
| Portão de qualidade GRAFF (anti "loteamento comum") | 6 | gate [00 §5](./00-GOVERNANCA-SPRINTS.md) |

---

## 9. Recomendação de saída da Sprint 0

**Aprovar o escopo da Sprint 1** com este sequenciamento (todo sob feature flag, validando
contra o snapshot e o checklist [02](./02-CHECKLIST-REGRESSAO.md)):

1. **Verificar o DWG** quanto a polylines de lote/quadra **fechadas** (decide se o contorno
   pode virar exato ou se segue a reconstrução por centroide/área — ver [00 §2](./00-GOVERNANCA-SPRINTS.md)).
2. **Fonte única de verdade de contagem** do MM (hero/SEO/mapa = mesmo dataset).
3. **Unificar a rota genérica do MM** no motor vetorial (aposentar o JPG para o MM).

**Nada disso entra direto em produção:** flag + branch isolada + checklist verde, conforme
a regra absoluta. **Sprint 0 não altera código** — só diagnostica e congela o estado atual.
