# Otimização do Módulo de Avaliações — Laudo NBR 14653-2 + Quadro Amostral

**Data**: 2026-07-07 · **Branch**: claude/avaliacoes-module-optimize-9zimoh

## Contexto
O dono enviou (1) uma avaliação real da Nielda (laudo técnico completo NBR 14653-2,
apto em Boa Viagem/Recife) e (2) a planilha "Quadro Amostral" com a metodologia de
homogeneização real (saneamento por faixa ±20%, arredondamento técnico máx 1%, faixa
de mercado ±10%). Pediu para "otimizar e melhorar" o módulo (`/backoffice/avaliacoes`,
`/api/avaliacoes/[id]/export`, `/verificar`).

## O que foi entregue

### 1. Motor de Quadro Amostral (novo) — `src/lib/valuation/quadro-amostral.ts`
Implementa o método efetivamente usado nos laudos reais (que não existia no motor):
- Saneamento **iterativo** por faixa de tolerância ±20% (recalcula a média e reaplica
  a faixa até estabilizar), eliminando discrepantes conforme NBR 14653-2.
- **Arredondamento técnico**: maior múltiplo de R$ 5.000 dentro de +máx 1%
  (ex.: 807.281,92 → 815.000). Função `arredondamentoTecnico` exportada e testada.
- **Faixa de mercado** ±10% (limite inferior/superior).
- Enquadramento de grau de fundamentação/precisão.
- 11 testes (`quadro-amostral.test.ts`) reproduzindo a cadeia publicada do laudo-modelo.

### 2. Gerador de Laudo reescrito — `src/lib/valuation/generate-ptam-html.ts`
Passou de "PTAM" enxuto para **Laudo Técnico NBR 14653-2 completo**, espelhando a
estrutura do laudo real da Nielda:
- Seções novas: Introdução/Objetivo/Premissas, Identificação (proprietário/CPF/matrícula/
  fração/áreas/vagas), Situação Legal + Documentação, Descrição (cômodos/acabamentos/
  condomínio), Vistoria + Contexto Urbano (infraestrutura), Conclusão, Declaração de
  Independência Técnica, Termo de Responsabilidade, Currículo do Avaliador, Sobre a IMI.
- **Quadro amostral visual**: tabela Nº/Bairro/Valor/Área/R$-m²/Quartos/Garagem/Andar/
  Desvio/Situação, com discrepantes riscados e tags Mantido/Eliminado; chips da faixa
  ±20% (limite inf/média/limite sup); fluxo de cálculo → arredondamento técnico.
- **Segurança**: helper `esc()`/`escUrl()` escapando todo dado de banco/scraping
  interpolado no HTML (fecha vetor de XSS/quebra de layout que existia antes).
- **Valor por extenso** (`numeroPorExtenso`, exportado + testado).
- Numeração de seções 100% dinâmica (sem quebrar ao ativar/desativar blocos).

### 3. Rota de export — `src/app/api/avaliacoes/[id]/export/route.ts`
Constrói a amostra a partir dos comparáveis armazenados (tolerante a múltiplos formatos
de campo) e calcula o quadro quando há ≥3 elementos válidos, passando-o ao gerador. O
laudo passa a exibir a homogeneização real; sem comparáveis, mantém o resultado do motor.

### 4. Config — `src/config/avaliador.ts`
Adicionados `titulos`, `formacao`, `atuacao` (currículo do laudo), a partir do laudo real.

## Verificação
- 36 testes de avaliações passando (novos + existentes).
- type-check limpo · lint limpo nos arquivos alterados.
- Laudo renderizado via Playwright/Chromium (capa + quadro + resultado) — visual
  profissional, números internamente consistentes
  (6.466,14/m² × 128 = 827.666 → arred. 0,89% → 835.000 → faixa 751.500–918.500).

## Observações / próximos passos
- Quando há comparáveis com preço/área, o laudo recalcula o valor pela faixa ±20%
  (autoritativo p/ o documento). Se `valor_estimado` armazenado divergir, o laudo mostra
  a recomputação NBR transparente (com todo o saneamento à vista).
- Campos ricos (matrícula, fração, cômodos, acabamentos, condomínio, distância) são lidos
  de colunas + `metadata`/`caracteristicas` (JSONB) com fallback normativo. Passo futuro
  natural: expor esses campos no formulário `/nova` e `/editar`.
EOF
