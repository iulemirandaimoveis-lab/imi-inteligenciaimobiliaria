# Auditoria Técnica — Mapa de Lotes Alto Bellevue

> Diagnóstico, causa provável, evidência e correção recomendada.
> Gerado a partir da análise do código e da rotina `npm run validate:lots`.
> URL auditada: `https://www.iulemirandaimoveis.com.br/pt/imoveis/alto-bellevue`

## 1. Resumo executivo

O módulo "Planta de Lotes" está em nível protótipo. A falha estrutural ("Mapa
temporariamente indisponível") e o problema de "lote faltando em cada quadra" têm
**duas causas concretas e independentes**, ambas no carregamento de dados — não na
renderização SVG em si:

1. **A view premium carrega o arquivo de dados errado e corrompido.**
2. **Não existe fallback estático** — quando o `fetch` falha, o mapa some por completo.

Ambas têm correção direta porque **já existe no repositório um arquivo de dados
canônico, limpo e mais rico** que não está sendo usado pela view premium.

## 2. Arquitetura atual (como está hoje)

```
/pt/imoveis/alto-bellevue
  └─ src/app/[lang]/(website)/imoveis/[slug]/page.tsx        (SSR — busca development no Supabase)
      └─ SubdivisionLotMap.tsx                                (wrapper; lê subdivision_lots do Supabase)
          └─ AltoBellevuePlanView.tsx  ← VIEW PREMIUM
              ├─ usePlanLots()  → fetch('/data/alto-bellevue-lots.json')   ❌ ARQUIVO CORROMPIDO
              └─ usePrices()    → fetch('/data/alto-bellevue-prices.json')
```

Renderização: **SVG** com `<polygon>` por lote sobre imagem de fundo
(`/images/maps/alto-bellevue-bg.jpg`), viewBox fixo **1000×707**, zoom/pan por wheel/drag.

## 3. Causa raiz nº 1 — arquivo de dados corrompido

A view premium consome `public/data/alto-bellevue-lots.json`. A validação revela que
esse arquivo está **estruturalmente quebrado**:

| Métrica | `public/data/...` (em uso) | `public/maps/...` (canônico, ignorado) |
|---|---|---|
| Total de lotes | **426** (esperado 383) | **383** ✓ |
| IDs únicos | 416 (**10 duplicados**) | 383 |
| Polígonos inválidos | **176** | **0** |
| Lotes sem área/preço | 26 (IDs lixo: `D-??`, `M-??-2`, `O-14-2`) | 0 / 2* |
| Contexto urbano (ruas, perímetro, labels, portaria) | **não** | **sim** (194 ruas, perímetro, 19 labels, 2 amenities) |
| viewBox | 1000×707 (fixo no componente) | 1200×821.86 |

\* Sem preço no canônico: `N-09` (lote ANTENA, sem preço por natureza) e `B-24` (marcar `pendente`).

**Por que causa "lote faltando em cada quadra":** com 176 polígonos inválidos e 10 IDs
duplicados, o SVG simplesmente não desenha dezenas de lotes — e os duplicados se
sobrepõem. A distribuição por quadra diverge do oficial (ex.: quadra `O` tem 3 lotes no
canônico vs 27 no arquivo corrompido; `H` tem 45 vs 51).

## 4. Causa raiz nº 2 — ausência de fallback

Em `AltoBellevuePlanView.tsx` (`usePlanLots`), o fluxo de erro é:

```
fetch('/data/alto-bellevue-lots.json')  → 3 tentativas (backoff 800/1600/3200ms)
  └─ falhou → setError(...) → tela "Mapa temporariamente indisponível" + "Tentar novamente"
```

Não há **nenhuma** camada de degradação graciosa: sem cache de build embutido, sem
planta estática clicável. Qualquer hipótese de falha (latência 4G, CDN, timeout, JSON
malformado, erro de geometria) leva o produto principal do loteamento a desaparecer.

## 5. Outras observações

- **Divergência planta × tabela comercial:** `prices.json` tem 382 entradas; `D-15` está
  precificado mas não existe na planta canônica → registrar para revisão no backoffice.
- **`greenAreas` vazio** no canônico → áreas verdes não estão mapeadas. Tratar como
  `pendente`, **não inventar**.
- **Fonte-CAD ausente:** DWG/DXF/PDF não estão no repositório (só JSON derivado + JPG).
  A reconstrução parte do arquivo canônico de 383 lotes como verdade.
- **Backoffice/reservas já existem** (RPCs `reserve_lot`/`release_lot`, auditoria
  `lot_status_history`, `POST /api/lots/reserve`) — falta UI de reserva/expiração e
  visualização do histórico.

## 6. Correção recomendada

| # | Ação | Efeito |
|---|---|---|
| 1 | Adotar `public/maps/alto-bellevue-lots.json` como **fonte canônica única** | 383 lotes, 0 duplicados, 0 polígonos inválidos, contexto urbano |
| 2 | Centralizar o acesso em `src/lib/lots/alto-bellevue.ts` com **validação antes de renderizar** | descarta polígono inválido e loga, em vez de quebrar |
| 3 | **Fallback em 3 camadas** (SVG vetorial → JSON versionado → planta estática clicável) | mapa nunca some |
| 4 | Envolver no `SubdivisionErrorBoundary` + timeout explícito + retry controlado | resiliência em 4G |
| 5 | Renderizar **ruas, perímetro, labels, portaria** (já no canônico) | precisão técnica e leitura do empreendimento |
| 6 | Marcar `greenAreas`, `B-24` (preço) e divergências como `pendente` no backoffice | sem inventar dados |

## 7. Evidência reproduzível

```bash
npm run validate:lots      # relatório completo + comparação das fontes
```

Saída-chave: **fonte canônica ✓ OK (esperado 383, encontrado 383, dup 0, polígono inválido 0)**;
fonte legada com 426 entradas, 10 duplicados, 176 polígonos inválidos.
