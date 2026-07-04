# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-04 · Supreme Vision (CTO mode autorizado pelo dono)

## Contexto vivo
- Dono opera em ciclo rápido: revisa e faz merge em minutos; PRs pequenos e verificáveis funcionam bem.
- Branch designado desta linha de trabalho: `claude/imi-intelligence-platform-l1t53q` (reiniciar de origin/main após cada merge).
- Verificação visual sem credenciais FUNCIONA: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` stub + `next dev` + Playwright (`/opt/pw-browsers/chromium`, `--no-sandbox`). A /inteligencia cai no fallback por design. Isso desbloqueia itens 1.2/1.3/1.6.
- Armadilhas descobertas: regex -i pega "todos" pt-BR; formatCurrency ≠ formatBRL (casas decimais); mapbox-gl é import dinâmico (grep estático não vê); npx tsc sem node_modules "passa" silenciosamente — sempre `npm ci` antes.

## Estado ao fim da sessão
- Descoberta por Intenção pronta e verificada; PR a criar/mergear (ver git log do branch).
- Pendências Fase 1: 1.2, 1.3, 1.6 (UI-visíveis). Fase 2 mapas: overlay georref + decisão mapbox (checar token no Vercel).
