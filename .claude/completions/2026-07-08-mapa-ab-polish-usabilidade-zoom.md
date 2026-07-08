# Mapa Alto Bellevue — Polish de usabilidade do zoom (botões no mobile)

**Data**: 2026-07-08
**Branch**: `claude/map-polish-usability-5a60tj`
**Arquivo**: `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx`

## Contexto / reclamação do dono

Print do celular: "faça um polish e melhorias no mapa. o zoom parece bugado, ficou ruim
de manusear, aperfeiçoe a usabilidade, botões, o que for preciso."

Continuação da correção anterior (PR #388, `clampVb` que travou o afastamento no "Ver
tudo"). O afastamento parava de "se perder", mas a **manipulação no mobile** continuava
ruim: o cluster inferior-direito só mostrava `+`/`−` no **desktop** (`!isMobile`). No
celular o único zoom era pinça/duplo-toque num mapa pequeno — impreciso, daí o "bugado".

## O que mudou (cirúrgico, sem regressão)

1. **Botões `+` / `−` também no mobile** — antes ocultados por `!isMobile`. Reagrupados
   numa **pílula segmentada** (um bloco navy/dourado com divisor), convenção Google/Apple
   Maps, mais limpa e compacta que dois botões soltos. Alvos 44px (Apple HIG).
2. **Zoom por botão animado + passo maior** — `zoomIn/zoomOut` passaram de `setVb` seco
   (1,33×) para `animateTo` (ease-out 350ms) com passo 1,6×. Toque preciso e suave em vez
   de "salto". Lê `vbLive.current` para casar com o `animateTo`.
3. **Duplo-toque vira toggle detalhe ↔ visão geral** — antes só aproximava (quem já estava
   ampliado ficava "preso" e o gesto parecia não responder). Agora: `scale ≥ 6` → volta ao
   "Ver tudo"; senão aproxima 2,5× no ponto tocado.
4. **Mapa levemente maior no mobile** — `max(78vw,480px)` → `max(84vw,500px)`, mais área
   para manusear sem empurrar o conteúdo.
5. **Dica de toque atualizada** — "use + / − ou dois dedos para dar zoom".

Preservado: pan/pinça/momentum/clamp existentes, camada técnica, `greenAreas`, seleção
por `onClick` nativo (não mexi no fluxo tap-vs-drag do celular), FAB do carrinho, links
Maps/Kuula (invariantes).

## Gates

- `tsc --noEmit`: **0 erros**
- `jest alto-bellevue`: **27/27**
- `next lint` (arquivo alvo): **limpo**
