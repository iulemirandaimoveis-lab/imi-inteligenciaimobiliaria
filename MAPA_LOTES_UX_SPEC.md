# UX Spec — Mapa de Lotes Alto Bellevue

> Especificação da experiência premium, mobile-first. Implementação em
> `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`.

## 1. Princípio

O mapa é o **produto principal** do loteamento — vitrine comercial, planta técnica e
ferramenta de decisão. Padrão de acabamento: Apple/Linear. Nunca pode sumir; nenhum CTA
pode cobrir conteúdo crítico.

## 2. Estados obrigatórios

| Estado | Tratamento |
|---|---|
| Carregando | skeleton premium (spinner dourado + "Carregando mapa de lotes…") |
| Carregado | SVG vetorial com lotes + camada técnica |
| Erro recuperável | **fallback estático clicável** (planta JPG) + "Tentar novamente" + WhatsApp |
| Offline/cache | servido do `sessionStorage` (offline-first na sessão) |
| Dados inconsistentes | polígonos inválidos descartados e logados; render segue |
| Sem dados | fallback estático (mesmo do erro) |

## 3. Interações

- **Zoom:** wheel (desktop), pinch (mobile), botões +/−, reset "Ver tudo".
- **Pan:** arrastar (pointer events, com captura).
- **Labels adaptativos por zoom:**
  - `< 1.5`: badges de quadra + nomes de rua;
  - `≥ 1.5`: números dos lotes;
  - `≥ 3.5`: número + área m².
- **Camada técnica × comercial:** botão de toggle (ícone `Layers`) liga/desliga ruas,
  perímetro, labels, portaria.
- **Filtros:** status (Todos/Disponíveis/Negociação/Vendidos) + quadra (scroll horizontal).
- **Seleção:** clique no lote abre o drawer; clique no fundo fecha.

## 4. Camadas visuais (z-order)

1. fundo técnico escuro (gradiente navy);
2. perímetro do empreendimento (dourado tracejado);
3. linha da BR;
4. eixos de ruas + calçadas;
5. amenities (portaria, lazer) + entrada;
6. nomes das ruas;
7. **polígonos dos lotes** (por status);
8. labels de lote (número, área);
9. badges de quadra;
10. controles e CTAs (overlay).

## 5. Mobile-first

- Mapa ocupa `max(72vw, 440px)` de altura; em modo imersivo, tela cheia.
- Bottom sheet nativo (spring, arrasto) para detalhe do lote.
- Filtros em linha com scroll horizontal suave (sem scrollbar).
- **CTA inferior some quando o drawer abre** — nunca sobrepõe o conteúdo do lote.
- Alvos de toque ≥ 40px; `env(safe-area-inset-bottom)` respeitado.

## 6. Design system IMI

| Token | Uso |
|---|---|
| Navy `#081524` / gradiente | fundo técnico do mapa |
| Dourado `#C8A44A` | destaque institucional, perímetro, à vista |
| Verde `#32D17C` | disponível |
| Amarelo `#FFB547` | negociação/reserva |
| Vermelho `#FF5C5C` | vendido |
| Azul `#3B82F6` | seleção / proprietário |

Transições 180–280ms (framer-motion). Tipografia: Outfit (UI), JetBrains Mono (dados).

## 7. Acessibilidade

- `role="application"` no SVG; cada lote `role="button"`, `tabIndex`, label ARIA com
  quadra/lote/status/área/preço; ativação por Enter/Espaço.
- Contraste mínimo AA nos textos sobre fundo escuro.
