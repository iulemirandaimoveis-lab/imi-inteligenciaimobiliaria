# Mapa Alto Bellevue — elevação a nível de produto (auditoria UX/UI/A11y)

**Data**: 2026-06-13 · **Branch**: `claude/quirky-snyder-37b20b`

## Objetivo
Resolver toda a auditoria técnica/UX/UI/responsividade/acessibilidade do módulo do
Mapa do Alto Bellevue (website público + backoffice), levando-o a padrão de produto
pronto para produção. 4 críticos (C1–C4), 5 altos (A1–A5), 6 médios (M1–M6), 6
menores (B1–B6).

## Causa-raiz do problema crítico (C1/C2)
Planta e Lista eram **duas fontes de verdade**: a Planta (`AltoBellevuePlanView`)
mesclava JSON canônico + planilha viva; a Lista (`SubdivisionLotMap`) lia **só** o
Supabase. Daí totais e status divergentes (A-01 "Disponível" vs "NEGOCIAÇÃO").

**Solução**: função pura única `resolveLotStatus(id, dbStatus, canonical, live)` com
precedência *planilha viva > JSON canônico > banco*, e hooks compartilhados
(`useAbAvailability`, `useAbCanonicalStatuses`) em `src/hooks/use-ab-availability.ts`.
As duas visões agora derivam o status pela mesma cadeia → paridade garantida.
Status desconhecido nunca cai para "Disponível" (vira "Indisponível" neutro) — evita
risco comercial.

## Arquivos alterados
- `src/lib/lots/alto-bellevue-availability.ts` — `resolveLotStatus` (fonte única).
- `src/hooks/use-ab-availability.ts` — **novo**; hooks de disponibilidade viva + canônica.
- `src/app/[lang]/(website)/imoveis/components/AltoBellevuePlanView.tsx` — status
  resolvido; legenda/stats/chips data-driven; badges de quadra clicáveis; oclusão de
  rótulos por colisão; controles divididos em 2 cantos (zoom inferior-dir, camada/expandir
  superior-dir) com safe-area; rótulo do lote selecionado sempre ancorado; home-framing
  do viewBox (reset/zoom no conteúdo); EdgeFadeRow (indicador de scroll); `role="dialog"`
  + foco inicial no sheet; `aria-roledescription` no SVG; microcopy acionável; preços lazy.
- `src/app/[lang]/(website)/imoveis/components/SubdivisionLotMap.tsx` — Lista resolve
  status pela cadeia única; legenda data-driven com contagem; recomendações IA respeitam
  filtro ativo; CTA de lote indisponível vira contato específico; heading semântico `<h2>`
  na visão Planta; toggle Planta/Lista com `role=tablist`.
- `src/app/(backoffice)/backoffice/imoveis/[id]/lotes/page.tsx` — validação de preço
  (≥0, decimal); **bug corrigido**: import truncava em 200 linhas (383 lotes → só 200
  atualizavam); banner matched/ignored no preview de import.
- `src/components/website/WhatsAppFAB.tsx` + `MobileStickyBar.tsx` + `globals.css` —
  classe `.hide-on-short-landscape` esconde overlays não-essenciais em paisagem baixa (M6).
- `src/__tests__/lib/lots/alto-bellevue-availability.test.ts` — 4 testes de `resolveLotStatus`.

## Validação
- `npx jest src/__tests__/lib/lots` ✓ 27 testes (4 novos para a fonte única).
- `npx tsc --noEmit` ✓ projeto inteiro (exit 0).
- `eslint` arquivos alterados ✓ 0 erros (só warnings pré-existentes: `<img>`, unused vars).
- `npm run build` ✓ produção compila (exit 0) — app inteiro, incl. página do imóvel.

## Pendências / não testável neste ambiente
- **Verificação visual ao vivo**: o sandbox local não tem credenciais Supabase
  (`@supabase/ssr: URL and API key are required`) → `createClient()` lança e o mapa
  não monta no dev server; a página `/imoveis/alto-bellevue` ainda depende do
  `supabaseAdmin` no server (404 sem env). Validação ficou em build/tsc/lint/unit
  (todos ✓). Verificar render visual em ambiente com env de produção.
- B6: zoom de navegador 90/110/125% — validar manualmente.
- Leitura real por NVDA/VoiceOver e gestos multi-touch nativos — validar em device.
- Métricas Lighthouse (LCP/INP) — medir em produção.
