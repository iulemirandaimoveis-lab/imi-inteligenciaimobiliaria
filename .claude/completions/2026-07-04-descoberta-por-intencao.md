# Completion: Descoberta por Intenção — flagship da Fase 3 (Supreme Vision)

**Data**: 2026-07-04 · **Branch**: `claude/imi-intelligence-platform-l1t53q`

## O que foi feito
- `intentEngine.ts` (motor puro, D-14): parser de linguagem natural pt-BR → intenções
  (valorização/liquidez/renda/entrada acessível/alto padrão), normalização min-max sobre o
  dataset nacional e ranking com explicação ("por quê" + percentil Brasil).
- `IntentDiscovery.tsx`: seção nova na `/inteligencia` (tema navy/dourado da página) —
  input em linguagem natural, chips de intenção, top-8 com IMI Fit, barra, explicação e
  link "Explorar {cidade}" que navega o dashboard. Badge "Estimativa IMI" (dados fallback).
- Integração: 1 import + 1 linha no `IntelligenceDashboard.tsx` (aditivo, zero regressão).
- 10 testes unitários (`src/__tests__/inteligencia/intent-engine.test.ts`).

## Verificação
- tsc limpo · jest 869/874 (62 suítes) · lint limpo.
- **Visual real**: `next dev` com Supabase stub + Playwright/chromium — screenshots desktop,
  mobile e estado pós-query. Dois bugs pegos SÓ no visual: decimais com ponto (→ vírgula
  pt-BR) e empate ordenado pelo fit arredondado (→ sort por exactFit).

## Follow-ups
- Fase 2: alimentar `rankByIntent(intents, dataset)` com dados reais de mercado.
- Parser pode evoluir para IA mantendo o contrato `parseIntent()`.

## Adendo (mesma data): ponte inteligência → inventário
- `intentsToProfile()` no motor (+3 testes) traduz intenções para o perfil do ranking de lotes.
- `MatchingLots` no IntentDiscovery: top-3 lotes reais do Alto Bellevue via
  `/api/intelligence/lots/recommend` (rota pública que não tinha consumidor de UI),
  com IMI Score, razões e CTA ao explorador. Oculta-se graciosamente sem dados.
- Verificação visual com Playwright: estado com dados (mock de rota) e estado oculto.
