# 04 — SPRINT 1: Precisão Cartográfica

> **Objetivo:** o mapa deve representar a **planta aprovada** (fonte: DWG → DXF → PDF),
> nunca o SVG/JSON atual nem coordenadas inventadas.
> **Status:** 🟡 Em andamento — entregas validadas localmente (CI do GitHub sem minutos).
> **Base:** PR #304 (branch `claude/miguel-marques-sprint-governance-0fg009`).

---

## 0. Verificação da fonte de verdade (DXF oficial)

Inspeção direta do arquivo `R07 — Planta de piso — PLANTA LOTEADA.dxf` (12,5 MB):

| Entidade | Quantidade | Implicação |
|---|---|---|
| `LINE` | **32.084** | Lotes/ruas/quadras são **linhas soltas** |
| `LWPOLYLINE` / `POLYLINE` | **0** | ⚠️ **Não há polígono de lote fechado no CAD** |
| `MTEXT` | 5.867 | Rótulos (quadra/lote/área) |
| `TEXT` | 2.831 | Rótulos |
| `ARC` | 46 · `INSERT` 46 · `HATCH`/`SOLID` 18 | Curvas/blocos/preenchimentos |

**Conclusão técnica (define o teto de fidelidade):** como o DXF **não traz lote como
polilinha fechada**, "pixel-perfect a partir de um único polígono" é **fisicamente
impossível** com este arquivo. A geometria por lote precisa ser **costurada** a partir dos
segmentos `LINE` reais + rótulos `MTEXT/TEXT`. **É exatamente o que o pipeline já faz** —
não é estimativa "a olho", é reconstrução sobre dados reais do CAD.

> Próximo nível de exatidão depende de obter o **DWG/DXF com polilinhas de lote fechadas**
> (ou o vetor do PDF aprovado por lote). Enquanto isso, a costura por segmentos é o melhor
> possível e **já é fiel** (contornos irregulares acompanham as curvas das ruas).

---

## 1. Estado verificado da geometria premium

`public/maps/miguel-marques-cad-lots.json` (consumido por `MiguelMarquesPlanView`):

- **1.254 lotes** · **24 quadras** (A–V, X, Z — pulam W/Y) · viewBox `0 0 1200 1385.52`.
- Polígonos **irregulares reais** (ex.: lote A-1 com 20 vértices acompanhando a curva).
- `0` lotes sem polígono · `0` polígonos inválidos · `0` sem área (validador `validate:lots:mm`).
- Contexto de render: `roads=158`, `perimeter=2` (em `miguel-marques-cad-context.json`).

➡️ A geometria premium **não é "quadras genéricas"**: é o contorno costurado do CAD.
A percepção de "SVG colorido" vinha da **rota legada (JPG)** — já resolvida (ver §3).

---

## 2. ✅ Entrega: fonte única de verdade para as contagens

**Problema (Sprint 0 §3, P1):** três números divergentes — hero `800+`/`23 quadras`
(hardcoded), metadados SEO `529` (de `lotsData.ts`), mapa `≈1254` (CAD JSON).

**Correção:**
- Novo módulo servidor `projetos/miguel-marques/data/cadStats.ts` deriva
  `{ total, disponivel, quadras }` da **mesma geometria CAD do mapa** (`fs` em build/SSG),
  com fallback para `lotsData.ts` se o arquivo faltar.
- `projetos/miguel-marques/page.tsx`:
  - Hero agora exibe **`1.254` Lotes · `24` Quadras** (antes `800+` / `23`).
  - Metadados/OG derivam de `MIGUEL_MARQUES_STATS` (antes `529`).
- `MasterplanSection.tsx` **já** derivava do CAD JSON — agora hero, SEO e mapa usam a
  **mesma fonte** (1.254 / 24 / 798 disponíveis).

**Validação local:** `tsc --noEmit` ✅ · `next lint` (arquivos alterados) ✅ ·
`validate:lots:mm` ✅ (exit 0) · jest MM (17 testes) ✅.

---

## 3. ✅ Verificado: unificação de rotas (P1 já resolvido na V2)

A dualidade premium×JPG do MM apontada em 2026-06-20 **já foi corrigida** (commit #300):
`SubdivisionLotMap.tsx:1235,1304-1306` renderiza `MiguelMarquesPlanView` (vetorial) para
`MM_DEV_ID` em modo planta, e o guard `:1221` **exclui o MM** do `SubdivisionPlanView` (JPG).

➡️ Nenhuma rota do MM serve mais `miguel-marques-plant.jpg`. Resta apenas **config morta**
do MM em `SubdivisionPlanView.tsx` (`PLAN_CONFIGS['8b9f6835…']`) — limpeza P3, sem urgência.

---

## 4. ⏭️ Aberto (headline da continuação da Sprint 1) — P0 pré-existente

O validador acusa **78 chaves `(quadra,lote)` duplicadas** → IDs com sufixo de colisão
(`B-18_2`, `B-19_2`, …). É **resíduo de identificação do pipeline de costura**, não foi
introduzido aqui (nenhum dado de geometria foi alterado nesta sprint). Já catalogado em
`docs/miguel-marques-cad-audit.md` (§6 identidade · §10 plano P0→P2).

**Por que importa para a precisão cartográfica:** dois lotes com a mesma identidade quebram
seleção/carrinho/override de status por chave `QUADRA-lote`. Resolver exige:
1. Reexecutar a extração (`scripts/cad/mm/extract.mjs` → `polygonize.mjs`) com regra de
   desambiguação por posição/rótulo.
2. Revalidar com `validate:lots:mm` até `duplicadas=0`.
3. Conferer contra o **quadro de disponibilidade** (PDF) lote a lote.

> Tratar em incremento dedicado **sob flag/branch** (regra absoluta #9), pois mexe no
> dataset que o mapa renderiza — risco de regressão visual. **Não fazer junto da entrega §2.**

---

## 5. Definition of Done — Sprint 1

- [x] Fonte de verdade do DXF verificada e documentada (§0)
- [x] Fonte única de contagem (hero/SEO/mapa) — §2
- [x] Unificação de rotas confirmada — §3
- [x] `tsc` + `lint` (alterados) + `validate:lots:mm` + jest MM verdes
- [ ] **Desambiguação dos 78 IDs duplicados** (§4) — próximo incremento sob flag
- [ ] Conferência lote-a-lote contra o PDF aprovado (amostragem)

---

*Sem alteração de geometria nesta entrega. Mudanças: `cadStats.ts` (novo) + `page.tsx`
(contagens). Validado localmente — CI do GitHub indisponível por falta de minutos (infra).*
