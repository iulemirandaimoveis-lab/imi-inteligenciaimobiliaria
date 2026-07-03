# SESSION_MEMORY — Memória de Curto Prazo

> Notas da sessão corrente/última. Sobrescreva a cada sessão (histórico durável vai para CHANGE_RECEIPT/LEARNINGS).

> 2026-07-03 teve DUAS sessões paralelas (refinamento testes/UX nesta branch + spatial-intelligence Fase 1 já em main via #344) — ambas preservadas abaixo.

**Sessão**: 2026-07-03 · refinamento de sistema (testes + mapa + UX) · branch `claude/imi-system-refinement-ys3w7d`

## O que ficou pronto
- Infra E2E completa (config com projetos desktop/mobile, fixtures, 5 specs novos, 84 testes listados).
- 12 fixes cirúrgicos: engine de mapa AB (camadas, fullscreen iOS, erro de load, leak WebGL, aria), useLotCart sync entre instâncias, Jazz (lang no back-link, hidden units, Escape, aria, **WhatsApp placeholder da LP**).
- Jest novo: `use-lot-cart-sync.test.tsx` (6 ✅). Gates: tsc ✅, lint ✅, jest 822 ✅ (60 suítes).

## Contexto para a próxima sessão
- E2E não roda neste sandbox (rede nega produção; sem `.env.local`). Rodar local: `npm run test:e2e` (dev server sobe sozinho). Contra produção: `npm run test:e2e:prod`.
- Auditoria apontou (NÃO corrigidos, por decisão de escopo): botão "Trocar empreendimento" e sino de notificações no DashboardTopbar são controles mortos (sem onClick); UnitDetailPanel não trava scroll do body no mobile; sem visual regression (`toHaveScreenshot`) ainda.
- RBAC E2E autenticado precisa de seeds/credenciais de teste → requer aprovação do dono (banco).

## Comandos que funcionam neste ambiente
```bash
npm run type-check                      # 0 erros em 2026-07-03
npm run lint                            # limpo
npx jest --forceExit src/__tests__     # ~6s
npx playwright test --list             # valida estrutura dos specs
# Sandbox: PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium
```
---

**Sessão**: 2026-07-03 · Spatial Intelligence Fase 1 (estabilização do motor de mapas) · mesclada em main (#344)

## Feito nesta sessão
- Auditoria profunda dos componentes de mapa (~6.7k linhas) + 5 fixes cirúrgicos:
  - SatelliteMap (console) → casca fina sobre o canônico AerialSatelliteMap (herda clamp z≤18; o bug de tiles vazios do #339 só estava corrigido numa das duas cópias).
  - InteractiveLotMap: pinch-zoom com pivot no centro do pinch (antes ancorava no centro do viewport), two-finger pan, handoff pinch→pan sem salto, cleanup do rAF no unmount, touch targets ≥44px via HitArea invisível.
  - useLotMap: polling de status 45s visibility-aware (torna real o "status ao vivo" da UI) + flags de cancelamento contra races ao trocar de empreendimento.
  - PropertyMap: mapLib por instância (singleton de módulo era anulado no unmount, quebrando 2ª instância) + darkMode nos deps de addMarkers.
  - MapMirrorView: touch targets ≥44px nas tabs e no seletor de projeto.

## Observações para Fase 2+ (não feito)
- AltoBellevueGeoMap (1651 l) e SubdivisionLotMap (1983 l) são monólitos — candidatos a decomposição.
- mapbox-gl só é usado se NEXT_PUBLIC_MAPBOX_TOKEN começar com 'pk.' — verificar Vercel antes de remover a dep.
- Overlay georreferenciado de lotes sobre satélite pendente (≥3 pontos de controle, scripts/cad/geo/).

## Gates
tsc ✅ · lint ✅ · jest 853 passed / 5 skipped (61 suítes) ✅
