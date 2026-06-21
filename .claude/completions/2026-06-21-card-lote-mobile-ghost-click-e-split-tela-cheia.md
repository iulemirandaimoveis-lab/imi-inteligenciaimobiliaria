# Card de lote no celular: fim do "pisca-pisca" + split-screen em tela cheia

**Data:** 2026-06-21
**Arquivo:** `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`
**Página:** `/pt/imoveis/alto-bellevue`

## Sintoma relatado
- No celular (Android Chrome modo mobile real), ao tocar num lote o card aparecia
  embaixo e **fechava no mesmo instante** ("pisca"), sem mostrar os detalhes.
- O botão flutuante do WhatsApp também "piscava" (some/aparece) — efeito colateral
  do mesmo bug (o FAB se esconde quando o card trava o scroll do body).
- Só funcionava no **modo desktop com zoom reduzido** (≥1024px o backdrop é
  `lg:pointer-events-none`, e mouse real não gera os eventos sintéticos).

## Causa raiz — "ghost click"
Os lotes/áreas/badges do SVG usam `role="button"` (apenas a11y), mas o toque é
resolvido pelo nosso sistema de pointer events (`handlePointerUp →
dispatchTapFromTarget`), nunca por click nativo.

O listener nativo de `touchstart` do mapa fazia `preventDefault()` **exceto** em
`[role="button"]` — ou seja, **pulava os lotes**. Sem `preventDefault`, o navegador
emite ~300 ms depois a sequência de compatibilidade (pointerdown/up "mouse" +
mousedown/up + click). Esse **ghost pointerup** cai sobre o backdrop do card
(`fixed inset-0 z-[9998]`) que acabou de abrir e dispara `onClose` → o card fecha
no mesmo instante. A troca anterior de `onClick`→`onPointerUp` (#295) não resolveu
porque o ghost também inclui um `pointerup`.

## Correções
1. **Raiz:** o `touchstart` agora só pula controles HTML reais
   (`button, a, input, textarea, select`). Os elementos SVG com `role="button"`
   passam a receber `preventDefault` → **nenhum ghost é gerado** → sem flicker.
   Corrige o card E o pisca do WhatsApp FAB.
2. **Defesa em profundidade:** o backdrop ignora dispensas nos primeiros ~450 ms
   após abrir (cobre iOS Safari, que ainda pode sintetizar pointerup/click).
3. **Tela cheia = split inteligente:** em fullscreen o backdrop fica transparente e
   `pointer-events-none` (mapa visível e interativo ao lado do card, sem overlay
   escuro), o card é limitado a `min(52vh, 560px)` e o mapa **reposiciona** o lote
   selecionado para a metade visível (embaixo no mobile / lateral no desktop).

## Verificação
- `tsc --noEmit`: OK (0 erros).
- `next lint` no arquivo: OK (0 warnings/errors).
