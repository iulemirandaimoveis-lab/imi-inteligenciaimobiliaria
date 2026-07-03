# SESSION_MEMORY — Memória de Curto Prazo

> Notas da sessão corrente/última. Sobrescreva a cada sessão (histórico durável vai para CHANGE_RECEIPT/LEARNINGS).

**Sessão**: 2026-07-03 · Spatial Intelligence Fase 1 (estabilização do motor de mapas)

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
