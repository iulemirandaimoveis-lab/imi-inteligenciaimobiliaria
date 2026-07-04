# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-03 (duas sessões paralelas: refinamento testes/UX + spatial-intelligence Fase 1)

## Novidades da sessão de refinamento que afetam a fila
- E2E agora tem 7 specs/84 testes — candidato natural a job de CI (rodar contra preview do Vercel via `BASE_URL`).
- Controles mortos no console /users (switcher de empreendimento, sino) — decidir: implementar ou ocultar.
- Visual regression (`toHaveScreenshot` nos mapas) segue pendente (P2 da TESTING_STRATEGY).

## Supreme Vision — próximos passos (plano em docs/imi-supreme-vision.md)
1. Plugar dados reais no motor de intenção (Fase 2): `rankByIntent(intents, dataset)` já aceita dataset externo — alimentar via `intelligence/*` quando houver fonte real.
2. Itens 1.2 (unificar domínio imóveis), 1.3 (3 MediaUploaders) e 1.6 (formatadores BRL divergentes) — UI-visíveis, exigem UI_REGRESSION_POLICY (agora viável: dev server + Playwright com env stub, padrão validado em 2026-07-04).

## Spatial Intelligence — estado
Fase 1 (estabilização) ✅ em main (#344). Fase 2 em curso:
- ✅ Vista "Sat. + Lotes" espelhada no console (/users/map) — reusa AltoBellevueGeoMap.
- ⏳ **AÇÃO DO DONO**: preencher `scripts/cad/geo/control-points.json` (≥3 GCPs do
  levantamento) e rodar `npm run geo:solve` — desbloqueia o ajuste fino do georef
  (hoje caixa aproximada norte-acima + calibração manual ?calibrar=1).
- Próximos (ordem): decidir destino do mapbox-gl (checar NEXT_PUBLIC_MAPBOX_TOKEN na
  Vercel; sem token 'pk.' a dep é peso morto); decompor SubdivisionLotMap (1983 l) /
  AltoBellevueGeoMap (1651 l) ANTES das camadas de inteligência (preço/m², liquidez);
  Fase 3 = camadas de inteligência sobre o geo map (heatmap preço/m² já tem dados em
  subdivision_lots.price + area_m2).

## Sem ação pendente do dono no banco
Verificado em produção (projeto zocffccwjjyelwrgunhu): RLS habilitada em todo o schema public
(K-13 limpo). Migration segura de colunas já aplicada. F-09 anônimo não era explorável.

## Próxima tarefa recomendada (sem aprovação)
**T-07 — DOMPurify nos 13 `dangerouslySetInnerHTML`**: verificar por uso; todo HTML de
banco/usuário deve passar por sanitização. Grep: `grep -rn "dangerouslySetInnerHTML" src`.
Baixo risco (adiciona sanitização onde falta).

## Depois
- Upgrade Next/next-pwa (altas de npm audit de produção) → então subir gate do CI para high.
- F-11 (informativo): policies de proposals são org-wide (sem tenant). Só agir se virar multi-tenant.

## Contexto que se perde fácil
- Migrations versionadas ≠ estado real do banco (L-15). Antes de migration de RLS/policy,
  verificar via MCP (pg_policies, relrowsecurity, columns).
- Rotas públicas de proposta exigem TOKEN (P15). Parsing de planilha só via src/lib/spreadsheet (P16).
- X-Frame-Options só no next.config, escopado (P17).
