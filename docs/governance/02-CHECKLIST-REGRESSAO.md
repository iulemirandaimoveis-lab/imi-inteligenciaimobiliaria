# 02 — Checklist de Regressão (obrigatório antes de QUALQUER merge)

> Complementa `.claude/UI_REGRESSION_POLICY.md`. **Verde em tudo = pode mergear.**
> Qualquer item que **piore** em relação ao snapshot ([01](./01-INVENTARIO-E-SNAPSHOT.md))
> é **regressão** e **bloqueia o merge** — mesmo que "o resto melhore".

Como usar: copie esta seção para o PR, marque cada item testado **na rota real**.

---

## A. Portões automáticos (rodar sempre)

- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm test` verde
- [ ] `npm run validate:lots` (AB) verde
- [ ] `npm run validate:lots:mm` (MM) verde
- [ ] `npm run build` conclui

---

## B. Alto Bellevue — REFERÊNCIA (não pode regredir NUNCA)

Rotas: `/projetos/alto-bellevue`, `/imoveis/[slug do AB]`, `/empreendimentos/[slug do AB]`.

- [ ] Mapa renderiza **vetorial** (não cai no JPG)
- [ ] Tocar/clicar um lote abre **o lote certo** (mobile + desktop)
- [ ] Mobile iOS/Android: tap funciona (sem ghost-click, sem `pointercancel` fechando o card)
- [ ] Pan, pinça, duplo-toque e scroll-zoom funcionam
- [ ] Card abre com `maxHeight 92vh`, scroll interno, fecha por Escape e clique-fora
- [ ] CTAs "Tenho Interesse" / "Agendar Visita" + WhatsApp funcionam
- [ ] Busca por lote ("A-12") funciona
- [ ] Comparar até 3 lotes funciona
- [ ] Testada/profundidade/confrontações/rua e planos p12/p36/p60/p120 aparecem
- [ ] Camadas (terreno/relevo/vegetação/ruas/BR + áreas comuns clicáveis) ok
- [ ] **Status desconhecido aparece como "Indisponível"** (nunca "Disponível")
- [ ] Acessibilidade do lote (teclado + leitor de tela) preservada
- [ ] Legenda/barra de stats com números corretos

---

## C. Miguel Marques — Premium (`/projetos/miguel-marques`)

- [ ] Mapa renderiza **vetorial CAD** (1254 lotes; viewBox `0 0 1200 1385.52`)
- [ ] Tap/clique abre o lote certo (mobile + desktop); "tap slop" preservado
- [ ] Filtros por status e por quadra funcionam
- [ ] Card: À Vista (-20%), R$/m², área e condições (à vista/12/36/60/150) corretos
- [ ] **Carrinho + "Proposta de Compra" multi-lote via WhatsApp** funciona
- [ ] Barra de stats com números corretos
- [ ] Nenhuma lacuna existente foi "consertada" de forma que **quebre** outra (a11y, etc.)

## D. Miguel Marques — rotas genéricas (`/imoveis/[slug]`, `/empreendimentos/[slug]`)

- [ ] Comportamento atual preservado **ou** migrado para o vetorial **sem perder** dados
- [ ] Se migrado: contagem de lotes/quadras bate com a rota premium (sem divergência)
- [ ] Nenhuma rota nova passou a servir `miguel-marques-plant.jpg` por engano

---

## E. Integridade de dados (achados P1 a vigiar)

- [ ] Contagem de lotes do MM **consistente** entre hero, metadados SEO e mapa
      (hoje divergem: 800+/529/≈1254 — ver auditoria 2026-06-20 §5)
- [ ] Fonte única de verdade respeitada (mapa = CAD JSON; não reintroduzir `lotsData.ts` 529 como fonte do mapa)
- [ ] Status/preço vindos do quadro de disponibilidade, não inventados

---

## F. Performance (medir, não presumir)

- [ ] LCP/INP em 4G **não pioraram** vs base (medição real)
- [ ] Nenhum asset pesado novo carregado em rota onde não é usado
- [ ] JSONs grandes (319–374 KB) não passaram a carregar em rotas que não precisam

---

## G. Feature flag (quando há risco de regressão)

- [ ] Novidade entrou **atrás de flag** (default = comportamento atual)
- [ ] Rollback é só desligar a flag (sem redeploy de código)
- [ ] Documentado: nome da flag, default, como ligar/desligar

---

## H. Portão GRAFF (só para sprints visuais — ver [00](./00-GOVERNANCA-SPRINTS.md) §5)

- [ ] Não parece PDF colorido / SVG cru / software anos 2000
- [ ] Parece produto premium; corretor vende só com o mapa; cliente entende valor sozinho

---

### Assinatura do PR
> "Rodei o checklist acima nas rotas reais (AB + MM premium + MM genérica). Nenhuma
> funcionalidade aprovada foi removida ou piorada. Evidências/anexos no PR."
