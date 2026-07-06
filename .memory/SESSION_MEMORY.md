# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-06 · Refino front-end "modo Apple/iOS" (mapas AB + console + backoffice)

## Contexto vivo
- Dono pediu refino/upgrade visual+responsividade nas 3 superfícies (dashboard do console,
  página do Alto Bellevue com FOCO NOS MAPAS, backoffice), estética Apple/iOS.
- Branch `claude/frontend-refactor-design-gubdfu` (PR draft aberto ao final da sessão).

## O que foi entregue
1. **Mapas AB (prioridade)** — AltoBellevuePlanView: gesto em GPU (CSS transform no <svg>
   durante pan/pinch, commit do viewBox no fim — sem re-render dos 383 polígonos por frame),
   momentum/fling (decay ~325ms), hover tooltip glass no desktop, spotlight de seleção,
   transição de cor em status ao vivo, entrada cinematográfica, haptics. Explorer sem jargão;
   DevelopmentLocation com moldura premium (URLs Maps/Kuula INTOCADAS).
2. **/users/dashboard** — fSerif→var(--font-serif) (Playfair voltou), safe-area iOS,
   loading.tsx + error.tsx, grid KPI alinhada às 6 colunas, aria progressbar, empty states,
   switcher morto→chip estático, sino removido, fade de scroll na nav, focus-visible.
3. **/backoffice** — KPICard label 7px→10px; DataTable: `overflow:hidden` anulava overflowX
   (tabela NÃO rolava no mobile) corrigido + sort acessível por teclado; --font-inter fantasma
   e Playfair hardcoded → tokens.
4. Global: prefers-reduced-motion em globals.css; Skeleton primitive + .imi-rise.

## Lições
- <style> inline com seletores de atributo contendo aspas causou hydration mismatch — usar classes.
- Harness de verificação sem credenciais: página temporária sob `/l/...` (sem locale/auth no
  middleware) + env stub + Playwright executablePath /opt/pw-browsers/chromium.

## Estado ao sair
- Gates: tsc ✅ lint ✅ jest 889/894 ✅ · visual OK em 390/768/1440 (zero console errors/overflow).
- Pós-merge: validar pinch/pan em iPhone real (fluxo de eventos preservado, mas iOS Safari é traiçoeiro).
