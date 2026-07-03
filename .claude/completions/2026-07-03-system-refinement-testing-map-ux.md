# Completion — Refinamento de Sistema: Infra de Testes + Engine de Mapa + UX

**Data**: 2026-07-03 · **Branch**: `claude/imi-system-refinement-ys3w7d`

## Missão
Construir infraestrutura de testes permanente e eliminar falhas invisíveis (UX, mapa,
responsividade, estado, a11y) nas três superfícies críticas: Alto Bellevue,
Jazz Boulevard e console /users.

## Auditoria — defeitos confirmados e corrigidos

### Alto Bellevue (engine de mapa · `AltoBellevueGeoMap.tsx`)
1. **Dessincronização de camadas**: toggle claro/escuro remonta o mapa; camadas desligadas
   voltavam visíveis com o painel dizendo "off". → Visibilidade reaplicada via ref no onLoad.
2. **Fullscreen preso no iOS**: estado otimista sem API disponível (Safari iPhone).
   → Estado lido apenas do evento `fullscreenchange` (anti-padrão A15).
3. **Spinner infinito**: falha no import dinâmico do maplibre-gl não tinha `.catch`.
   → Erro vira estado com botão "Tentar novamente".
4. **Leak WebGL**: desmontar antes do evento `load` não removia a instância do mapa.
   → Instância capturada no `.then` da promise de init.
5. **A11y**: 4 botões icon-only sem nome acessível (fechar painel de lote ×2, amenity
   modal, painel de camadas). → aria-labels.

### Carrinho de lotes (`useLotCart`)
6. **Estado obsoleto entre instâncias** (FX-09): múltiplas instâncias na mesma página só
   se viam no mount. → Sync por evento custom + `storage`, com corte de eco (P19).
   6 testes jest novos.

### Jazz Boulevard
7. **Back-link sem idioma**: `/imoveis/...` forçava redirect do middleware e descartava a
   língua atual. → `/${lang}/imoveis/...`.
8. **Unidades "hidden" fantasmas** (A14): `opacity: 0` mantinha botões clicáveis/focáveis.
   → Filtradas do DOM.
9. **Sem Escape** nos painéis de detalhe/comparação (inconsistente com o AB). → Adicionado.
10. **A11y**: botões de fechar sem aria-label. → Adicionados.
11. **🔴 CONVERSÃO — WhatsApp placeholder na LP** (FX-08): 3 CTAs abriam número morto
    `5581999999999`. → Número real `5581986141487` + gate E2E de regressão.

### Console /users
Auditoria de auth/RBAC/navegação: middleware + `requireImiSession` sólidos (nenhum furo).
Anotados (sem correção nesta sessão, decisão de escopo): switcher de empreendimento e sino
de notificações são controles mortos; candidatos a implementar ou ocultar.

## Infra de testes criada
- `playwright.config.ts`: projetos `desktop` + `mobile` (Pixel 7), modo remoto `BASE_URL`,
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para sandboxes/CI com browser pré-instalado.
- `e2e/fixtures.ts`: gate de erros de console (allowlist de terceiros), helper de overflow,
  matriz de 8 viewports.
- Specs novos: `alto-bellevue` (inclui **invariante do link do Maps do cliente como teste**),
  `jazz-boulevard`, `users-console`, `responsive`, `a11y`. Total: 7 specs / 84 testes.
- Scripts: `test:e2e`, `test:e2e:prod`.

## Validação
- type-check ✅ · lint ✅ · jest 60 suítes / 822 ✅ / 5 skipped · `playwright test --list` ✅.
- E2E não executável neste sandbox (rede nega produção; sem `.env.local`) — specs são
  read-only, prontos para local/CI.

## Não feito (com razão)
- Supabase branch/seeds para RBAC E2E autenticado: mexe em banco → exige aprovação
  explícita do dono (invariante). Documentado em TESTING_STRATEGY.
- Visual regression (`toHaveScreenshot`): próximo passo natural (P2).
- axe-core: evitado como nova dependência sem DECISION_LOG; gates objetivos manuais cobrem
  o essencial.
