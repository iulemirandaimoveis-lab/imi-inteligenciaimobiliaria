# PERFORMANCE_REPORT — Relatório de Performance

> Análise estática 2026-07-02. Metas: Lighthouse ≥95, LCP <2.5s, CLS <0.1, TTI <3s (`lighthouse-budget.json` existe na raiz).

---

## Estado Atual

### Pontos fortes já implementados
- `experimental.optimizePackageImports` para lucide-react, framer-motion, recharts, sonner, date-fns.
- Parsing pesado (xlsx/mammoth/pdf-parse) via dynamic import.
- PWA runtime caching bem calibrado (imagens CacheFirst 7d; dados NetworkFirst).
- Cache-Control imutável para `/images/*`; região Vercel gru1 (latência BR); Speed Insights ativo.
- Fontes self-hosted via @fontsource (sem request a Google Fonts no crítico).

### Riscos identificados

| ID | Problema | Evidência | Impacto | Prioridade |
|---|---|---|---|---|
| P-01 | Componentes-página gigantes | `AltoBellevuePlanView.tsx` 160KB; 10+ arquivos de 50–104KB | Bundle da rota, TTI, custo de re-render | ALTA |
| P-02 | Build exige 7GB heap | `NODE_OPTIONS=--max-old-space-size=7168`; type-check OOM no Vercel 8GB | Fragilidade de build; obrigou `ignoreBuildErrors` | ALTA (estrutural) |
| P-03 | 45 `<img>` cruas | grep 2026-07-02 | LCP/CLS em páginas públicas | MÉDIA |
| P-04 | `mapbox-gl` possivelmente morta nas deps | 0 imports diretos | Peso de install; possível bundle se importada indireta | MÉDIA |
| P-05 | Re-render em mapas | seleção de lote propaga por árvores grandes (P-01 agrava) | Latência de interação em mobile | MÉDIA |
| P-06 | Sem CI de Lighthouse | budget existe mas nada o verifica | Regressões silenciosas | MÉDIA |

## Causa-raiz comum

P-01/P-02/P-05 têm a mesma raiz: **páginas monolíticas** que concentram dados+estado+render. A correção é extração incremental (ver REFACTOR_ROADMAP R-01), nunca reescrita.

## Plano de Medição (antes de otimizar)

1. `ANALYZE=true` com `@next/bundle-analyzer` (adicionar dev-dep) → registrar top-10 rotas por peso aqui.
2. Lighthouse CI (`lhci autorun` com `lighthouse-budget.json`) nas rotas: `/pt`, `/pt/imoveis`, `/pt/projetos/alto-bellevue`, `/backoffice/dashboard`, `/users/map`.
3. Web Vitals reais já coletados em `analytics/vitals` — criar visão mensal.

## Ganhos Esperados (estimativa)

- Divisão de P-01 nas 3 maiores páginas: −30–50% JS nas rotas de mapa; TTI mobile −1s+.
- Migração dos `<img>` públicos: melhoria direta de LCP/CLS nas landing pages.
- Remoção de deps mortas: install −dezenas de MB; superfície de auditoria menor.

---
**Última atualização**: 2026-07-02
