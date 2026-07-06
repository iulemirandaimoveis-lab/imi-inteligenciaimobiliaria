# Completion: Refino front-end "Apple/iOS" — mapas AB, console, backoffice

**Data**: 2026-07-06 · **Branch**: `claude/frontend-refactor-design-gubdfu` (PR draft)

## Escopo pedido pelo dono
Refinos/upgrade de visual, responsividade e tecnologia nas 3 superfícies (celular/tablet/desktop),
estética Apple/iOS, com PRIORIDADE nos mapas do Alto Bellevue.

## Entregas
### Mapas Alto Bellevue (AltoBellevuePlanView + Explorer + Location)
- Gesto em GPU: pan/pinch aplicam CSS transform no `<svg>` (composição), viewBox commitado no
  fim do gesto — elimina re-render de 383 polígonos por frame. Momentum/fling (decay ~325ms).
- Hover premium desktop: brighten CSS + tooltip glass em coords SVG (quadra-lote · status · área).
- Spotlight de seleção (demais lotes 0.45 com fade 320ms), transição de fill em status ao vivo,
  entrada cinematográfica (overview → home), haptic na seleção, hint de gesto atualizado.
- Explorer: legendas sem jargão técnico; tabs com aria-pressed e sombra no ativo.
- DevelopmentLocation: sem grayscale morto, moldura 2xl dourada, 16/9 no desktop, chip de marca.
- **Invariantes respeitados**: links Maps/Kuula intocados (.claude/ALTO_BELLEVUE_LOCATION.md).

### Console /users/dashboard
- `fSerif` → `var(--font-serif)` (títulos renderizavam Georgia; Playfair voltou).
- Safe-area iOS no header sticky e no container; loading.tsx (skeleton) + error.tsx.
- KPIs alinhados às 6 colunas do grid; disponibilidade auto-fill; empty states; aria progressbar;
  focus-visible; switcher morto → chip estático; sino decorativo removido; fade de scroll na nav.

### Backoffice
- KPICard label 7px→10px (legibilidade/WCAG).
- DataTable: **bug real** — `overflow: 'hidden'` anulava `overflowX: 'auto'` (tabela não rolava
  no mobile); corrigido + sort acessível (botão com aria-sort/aria-label).
- Fontes fantasma: `--font-inter` (não carregada) → `--font-ui`; Playfair hardcoded → token.

### Global
- `prefers-reduced-motion` em globals.css; `Skeleton` primitive; `.imi-rise`.

## Validação
- tsc ✅ · lint ✅ · jest 64 suítes 889/894 ✅ (baseline).
- Visual sem credenciais (padrão do projeto): harness temporário sob `/l/` + env stub + Playwright
  (chromium em /opt/pw-browsers) em 390/768/1440 — zero console errors primeiro-partido, zero
  overflow. Pegou 1 bug pré-commit: hydration mismatch por seletor com aspas em `<style>`.

## Follow-ups sugeridos
- Validar pinch/pan/momentum em iPhone físico (iOS Safari).
- Backoffice: sidebar colapsável + breakpoint tablet (768–1023 hoje cai no mobile sem busca).
- MarketTicker do dashboard admin exibe dados fake como reais — decidir fonte real ou remoção.
- Unificar cores de status dos 3 motores de mapa em `src/lib/lotmap/engine.ts`.
