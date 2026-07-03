# SESSION_MEMORY — Memória de Curto Prazo

> Notas da sessão corrente/última. Sobrescreva a cada sessão (histórico durável vai para CHANGE_RECEIPT/LEARNINGS).

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
