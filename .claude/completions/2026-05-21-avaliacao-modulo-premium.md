# Módulo de Avaliação Imobiliária — IMI Premium

**Data**: 2026-05-21  
**Branch**: `claude/real-estate-valuation-module-g28D7`

---

## O que foi feito

### 1. Livro JSON — Confirmado e Usado
- **livro-28-avaliacao-mercadologica-joao-diniz.json** (392kb) — lido e integrado
- 21 capítulos cobrindo todos os tópicos exigidos
- KB query já referencia o livro do Prof. João Diniz Marcello

### 2. Motor de Avaliação Expandido
**Arquivo**: `src/features/avaliacoes/services/valuation-engine.ts`

Métodos existentes (mantidos):
- Comparativo Direto (NBR 14653-2 §8)
- Evolutivo + Ross-Heidecke (NBR 14653-2 §10)
- Método da Renda (NBR 14653-2 §11)
- checkFundamentacao (graus NBR)

Métodos NOVOS adicionados:
- **metodoInvolutivo** — VT = VGV - C - L (NBR 14653-2 §9)
- **metodoCapRate** — NOI / Cap Rate para imóveis comerciais
- **metodoFluxoCaixaDescontado** — DCF com VPL, TIR, Payback (NBR 14653-2 §11.3)
- **metodoLiquidacaoForcada** — descontos 10/20/30% por liquidez
- **metodoCenarios** — conservador/realista/agressivo
- **metodoBDI** — Benefícios e Despesas Indiretas
- **metodoFundoComercio** — valoração de estabelecimentos
- **calcularHonorarios** — tabela IBAPE simplificada
- **estimarValorVenal** — estimativa fiscal

### 3. Sistema de Recomendação de Método
**Arquivo**: `src/features/avaliacoes/services/method-recommender.ts`

- `recomendarMetodo(tipoImovel, finalidade)` → recomendação completa
- Lógica: terreno → Involutivo, rural → NBR 14653-3, judicial → Comparativo obrigatório, etc.
- Inclui: justificativa, dados necessários, quando usar/não usar, referências NBR
- `explicarMetodoParaCorretor()` → linguagem simples para o corretor
- `verificarDadosSuficientes()` → checklist de dados antes de calcular

### 4. Componente MethodRecommender
**Arquivo**: `src/components/backoffice/avaliacoes/MethodRecommender.tsx`

- Integrado no Step 2 do wizard (nova avaliação)
- Mostra método recomendado com badge de confiança
- Expande para mostrar: justificativa, exemplo, dados necessários, quando usar/não usar
- Permite selecionar método alternativo
- Auto-seleciona método principal ao trocar tipo/finalidade

### 5. Wizard Nova Avaliação Melhorado
**Arquivo**: `src/app/(backoffice)/backoffice/avaliacoes/nova/page.tsx`

- Step 2: agora mostra MethodRecommender
- Step 5: agora mostra **3 cenários** (conservador/realista/agressivo) em cards coloridos
- Salva: metodo_principal, valor_conservador, valor_realista, valor_agressivo

### 6. API de Cálculo Expandida
**Arquivo**: `src/app/api/avaliacoes/calcular/route.ts`

Novos endpoints (POST com metodo):
- `involutivo` — Método Involutivo
- `cap_rate` — Cap Rate / NOI
- `fcd` — Fluxo de Caixa Descontado
- `liquidacao_forcada` — Liquidação Forçada
- `cenarios` — Três Cenários
- `bdi` — BDI
- `fundo_comercio` — Fundo de Comércio
- `honorarios` — Cálculo de Honorários
- `valor_venal` — Valor Venal Estimado
- `recomendar_metodo` — Recomendação de Método via API

### 7. PTAM PDF Melhorado
**Arquivo**: `src/lib/valuation/generate-ptam-html.ts`

Novas seções adicionadas:
- Seção 6: **Três Cenários** (conservador/realista/agressivo) em cards coloridos
- Seção 7 (condicional): **Liquidez** — desconto e valor de liquidação forçada
- Seção 8 (condicional): **Ross-Heidecke** — tabela completa de depreciação
- Justificativa técnica expandida por método (comparativo, renda, evolutivo, custo)
- Seção final: **Explicação Comercial** para o solicitante
- Numeração de seções dinâmica (não hardcoded)

### 8. Migration Supabase
**Arquivo**: `supabase/migrations/20260520_valuation_methods_expanded.sql`
**Aplicada**: ✅ projeto `zocffccwjjyelwrgunhu` (imi-inteligenciaimobiliaria)

27 novos campos na tabela `avaliacoes`:
- Rastreamento de método (metodo_principal, justificativa_metodo)
- Involutivo (vgv, custos_incorporacao, lucro_incorporador)
- Renda/Cap Rate (noi_mensal, taxa_cap_rate, vacancia_pct)
- DCF (fluxo_caixa_anual, taxa_desconto, vpl, tir, payback_anos)
- Cenários (valor_conservador, valor_realista, valor_agressivo)
- Liquidez (liquidez, valor_liquidacao_forcada)
- Depreciação JSONB, BDI, Fundo de Comércio, tipo_laudo

---

## Matriz Livro × Sistema

| Tópico | Livro JSON | Exercícios | KB | Código |
|--------|-----------|-----------|----|----|
| Comparativo Direto | ✅ Cap. 8 | ✅ met-1,2 | ✅ | ✅ |
| Evolutivo | ✅ Cap. 8 | ✅ evol-1..5 | ✅ | ✅ |
| Involutivo | ✅ Cap. 8 | ✅ inv-1..5 | ✅ | ✅ NOVO |
| Método da Renda | ✅ Cap. 8 | ✅ renda-1..3 | ✅ | ✅ |
| Cap Rate / NOI | ✅ | ❌ | ✅ | ✅ NOVO |
| DCF | ✅ | ❌ | ✅ | ✅ NOVO |
| Ross-Heidecke | ✅ Cap. 8 | ✅ evol-2 | ✅ | ✅ |
| Liquidação Forçada | ✅ Cap. 14 | ❌ | ✅ | ✅ NOVO |
| Cenários | ✅ | ❌ | ✅ | ✅ NOVO |
| BDI | ✅ | ✅ cub-4 | ✅ | ✅ NOVO |
| Fundo Comércio | ✅ Cap. 15 | ❌ | ✅ | ✅ NOVO |
| Honorários | ✅ Cap. 17 | ✅ hon-1..4 | ✅ | ✅ NOVO |
| PTAM/Laudo | ✅ Cap. 3,4 | ✅ ptam-1..4 | ✅ | ✅ |

---

## Riscos Restantes

1. **Métodos pendentes**: Servidão, Desapropriação (formulas no livro, não implementadas)
2. **PDF para PDF real**: gera HTML — necessário puppeteer/chrome headless para PDF binário
3. **Involutivo no wizard**: formulário específico não adicionado ao Step 3 (comparáveis)
4. **Métodos rurais**: NBR 14653-3 referenciada mas sem calculadora dedicada
5. **Fundo Comércio e Ponto Comercial**: calculadora back-end implementada, UI pendente

## Próximos Upgrades

1. Adicionar calculadora dedicada para cada método no wizard (step 3 adaptativo)
2. Gerar PDF binário via puppeteer (atualmente HTML)
3. Implementar servidão e desapropriação com fórmulas específicas
4. Motor involutivo com VGV parametrizado por tipo de incorporação
5. Integrar exercícios do livro como tooltips contextuais no formulário
