# RESPONSIVE_AUDIT — Auditoria de Responsividade

> Estado 2026-07-02. Alvo: perfeito de 320px a ultrawide, touch-first.

---

## Estado Atual

### O que já está maduro
- Mobile é tratado como cidadão de primeira classe: hook `use-is-mobile` testado; componentes dedicados `MobileDetail`/`DesktopDetail` no backoffice de imóveis.
- Histórico recente de correções mobile: tab overflow, controles de zoom, mídia de áreas comuns (PR #335); controles iOS + card arrastável no satélite (PR #337); enquadramento responsivo.
- PWA instalável com prompts próprios (`src/components/pwa/`).
- Padrões de grid documentados (`.claude/UI_DESIGN_STANDARDS.md`): breakpoints Tailwind, cards `h-full`, sidebar `lg:col-span-4`.

### Riscos / lacunas

| ID | Área | Risco | Prioridade |
|---|---|---|---|
| RW-01 | Mapas em landscape/tablet | vistas plano/geo/satélite têm muitos controles sobrepostos; tablets são o meio-termo menos testado | MÉDIA |
| RW-02 | Tabelas do backoffice (tracking, inventário, financeiro) | páginas de 50–104KB com tabelas densas; overflow horizontal em <768px precisa de verificação por página | MÉDIA |
| RW-03 | Ultrawide (>1920px) | sem `max-w` auditado em todas as páginas públicas; texto pode esticar | BAIXA |
| RW-04 | RTL (locale `ar`) | nenhuma auditoria de espelhamento; Tailwind usa classes físicas (`ml-`, `pl-`) e não lógicas (`ms-`, `ps-`) | BAIXA |
| RW-05 | Touch targets | padrão de 44px documentado mas não verificado sistematicamente em controles de mapa | MÉDIA |
| RW-06 | Orientação | mudança portrait↔landscape nos viewers de mapa re-enquadra? (corrigido p/ satélite no #337; verificar plano/geo) | BAIXA |

## Protocolo de Validação (usar a cada mudança de UI)

Viewports mínimos: **320, 375, 414, 768, 1024, 1440, 1920, 2560**.

Checklist por página alterada:
1. Sem scroll horizontal acidental em 320px.
2. Touch targets ≥44px; espaçamento entre alvos ≥8px.
3. Sticky elements não cobrem CTAs (lição do PR #342 — botão de proposta atrás da sticky bar).
4. Modais: fecham por gesto, não estouram viewport, teclado móvel não esconde inputs.
5. Texto não trunca informação crítica (preço, área do lote).
6. Testar com barra de endereço do iOS Safari (dvh vs vh).

Automação futura: specs Playwright com `viewport` parametrizado nos fluxos críticos (TESTING_STRATEGY §E2E).

---
**Última atualização**: 2026-07-02
