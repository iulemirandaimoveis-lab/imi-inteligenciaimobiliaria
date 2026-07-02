# ACCESSIBILITY_REPORT — Relatório de Acessibilidade

> Meta: Lighthouse Accessibility ≥95, WCAG 2.1 AA. Estado 2026-07-02 (análise estática).

---

## Sinais Medidos

| Sinal | Valor | Leitura |
|---|---|---|
| Arquivos com atributos `aria-*` | 72 | adoção real, mas parcial (~6% dos .tsx) |
| `<img>` sem `alt` | 1 ocorrência | quase limpo — corrigir a que falta |
| Arquivos com estilos `focus:`/`focus-visible` | 53 | foco visível existe nos primitivos |
| `prefers-reduced-motion`/`useReducedMotion` | 3 arquivos | **lacuna**: framer-motion em uso amplo sem redução global |
| Locales | pt/en/es/ja/ar | `ar` sem auditoria RTL/leitor de tela |

## Achados

| ID | Achado | Impacto | Prioridade | Recomendação |
|---|---|---|---|---|
| A-01 | Motion sem respeito global a `prefers-reduced-motion` | usuários sensíveis a movimento; scrollytelling (Jazz Boulevard) é o pior caso | ALTA | `MotionConfig reducedMotion="user"` no provider raiz — 1 linha cobre todo framer-motion |
| A-02 | Mapas (canvas WebGL) sem alternativa acessível | seleção de lote é 100% visual/pointer | MÉDIA | manter/lista tabular dos lotes como alternativa navegável por teclado (a lista já existe em algumas vistas — padronizar) |
| A-03 | Cobertura aria parcial em composições do backoffice | leitores de tela em tabelas/dashboards | MÉDIA | exigir aria em code review para componentes novos; corrigir ao tocar |
| A-04 | Sem verificação automatizada | regressões invisíveis | MÉDIA | `@axe-core/playwright` nos 2 specs E2E existentes (baixo esforço) |
| A-05 | Contraste do tema luxo (dourado/creme) não auditado | textos decorativos podem <4.5:1 | BAIXA | passar as páginas públicas no Lighthouse e registrar aqui |
| A-06 | `<img>` sem alt (1) | leitor de tela | BAIXA | corrigir na próxima passada |

## Regras para Código Novo

1. Todo controle interativo: nome acessível (`aria-label` se sem texto visível).
2. Toda imagem informativa: `alt` descritivo; decorativa: `alt=""`.
3. Modais: focus trap + `aria-modal` + retorno de foco (usar primitivos radix, que já fazem isso).
4. Nunca remover outline de foco sem substituto visível.
5. Animações de entrada: variantes com `useReducedMotion` até A-01 ser aplicado globalmente.

---
**Última atualização**: 2026-07-02
