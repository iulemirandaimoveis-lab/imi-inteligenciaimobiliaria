# Satélite + Lotes — controles app-like, calibração, carrinho e proposta do cliente

**Data:** 2026-06-28
**Branch:** `claude/satellite-map-proposal-flow-3eri23`

## Contexto
Feedback do cliente sobre a vista "Satélite + Lotes" (`AltoBellevueGeoMap`):
- mapa de lotes parecia fora do lugar real sobre o satélite;
- botões/controles pareciam bugados (sobrepostos, tamanho errado);
- faltava carrinho para múltiplos lotes e um fluxo de proposta preenchido pelo cliente;
- ao enviar, o sistema deveria confirmar via WhatsApp (OpenWA) e notificar o time.

## Entregue
1. **Controles app-like** (`AltoBellevueGeoMap.tsx`)
   - `CtrlBtn` com tamanho via inline-style (40×40) — fim dos botões "gigantes/bugados".
   - Marca à esquerda com `max-width`/ellipsis; toolbar única no canto superior direito (sem colisão).
2. **Georreferenciamento calibrável** (`alto-bellevue-geojson.ts`)
   - `svgToGeo` agora aplica uma transformação de **similaridade** (rotação + escala + translação) com correção de aspecto por `cos(lat)`. Default = identidade → zero regressão.
   - Overlay de **calibração admin** (`?calibrar=1`): ajusta rotação/escala/posição ao vivo, persiste em `localStorage` e exporta o JSON para chumbar em `AB_CALIBRATION_DEFAULT`.
3. **Carrinho multi-lote** (reusa `useLotCart` + `lib/lotmap/cart.ts`)
   - "Adicionar à proposta" no painel do lote; FAB "Proposta" com contador; `CartSheet` com totais, copiar link e limpar.
4. **Proposta preenchida pelo cliente** (`ProposalFormModal.tsx` + `api/lots/proposal/route.ts`)
   - Modelo **Mano Imóveis** (`lib/imi-proposals/template.ts`), pré-preenchido com os lotes do carrinho.
   - POST público → confirmação ao cliente via **OpenWA** com a relação de documentação/contrato/entrada; notifica responsável do produto + gestor(es) + corretores; notificação in-app broadcast. `wa.me` como canal garantido.
5. **Semântica de status** (`proposal-notifications.ts`)
   - `negotiationChecklistText`: docs + contrato + entrada (lote em **negociação**). Vendido = docs recebidas + contrato assinado + entrada paga (descrito ao cliente).

## Pendências (precisam de aprovação — guardrails do CLAUDE.md)
- **Banco de dados:** persistir a proposta pública em `imi.proposals` e flipar o status do lote para NEGOCIAÇÃO/VENDIDO no mapa exige migration. Hoje a planilha do Google continua como fonte de verdade do status (sem migration).
- **Atribuição de corretor** (plantão/rodízio) para propostas públicas.
- **Cards "iguais" no /imóveis (Plano):** o carrinho já é compartilhado por `localStorage`; falta replicar o botão "Adicionar à proposta" no card do `SubdivisionLotMap` (arquivo grande — fora deste passo).

## Verificação
- `npx tsc --noEmit` → sem erros em `src/` (fora de testes).
- `npx eslint` nos arquivos alterados → 0 erros (warnings pré-existentes).
- `npx jest` cart + imi-proposals + lots/geo → 100% verde.
- Manual: abrir `/imóveis` Alto Bellevue → "Satélite + Lotes"; selecionar lotes; preencher proposta; `?calibrar=1` para alinhar.
