# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-07 (agendamento de visitas + laudo NBR/quadro amostral entregues, PRs draft)

## Agendamento de Visitas (calendário do corretor) — ENTREGUE, aplicação pendente
- Entregue: `src/lib/scheduling/*`, rotas `/api/visits/*`, `VisitBookingModal`/`ScheduleVisitButton`,
  integração em RealtorCard + VideoCallButton. Migration `20260707_visit_bookings.sql` **não aplicada**.
  Detalhe: `.claude/completions/2026-07-07-agendamento-visitas-calendario-corretor.md` · `docs/AGENDAMENTO_VISITAS.md`.
- **AÇÃO DO DONO 1**: aplicar a migration em produção (persistência + anti-conflito de horário).
- **AÇÃO DO DONO 2 (opcional)**: Service Account do Google Calendar para espelhar na agenda do corretor.
- Evolução: disponibilidade por corretor (hoje global) + tela de gestão das visitas no console.

## Avaliações — laudo NBR 14653-2 + quadro amostral ✅ ENTREGUE (2026-07-07, PR draft)
- Novo motor `src/lib/valuation/quadro-amostral.ts` (saneamento ±20% iterativo, arredondamento
  técnico máx 1%, faixa ±10%) + gerador de laudo completo reescrito + export ligando os dois.
- **Passo futuro natural** (sem urgência): expor no formulário `/backoffice/avaliacoes/nova` e
  `/editar` os campos ricos que o laudo já sabe renderizar (matrícula, fração ideal, cômodos,
  acabamentos, condomínio, distância de referência) — hoje lidos de `metadata`/`caracteristicas`
  (JSONB) com fallback normativo. Isso deixaria o dono preencher tudo pela UI.
- Detalhe: `.claude/completions/2026-07-07-avaliacoes-laudo-nbr-optimize.md`.

## Conciliação de Comissões (BTG PF/PJ) — estrutura ENTREGUE, aplicação em produção pendente
- Entregue: migration `20260706_commission_bank_reconciliation.sql` (versionada, **não aplicada**),
  conector `src/lib/btg/`, motor de match `src/lib/finance/matching.ts`, rotas `src/app/api/finance/*`,
  UI `/backoffice/financeiro/comissoes`. Detalhe: `.claude/completions/2026-07-06-conciliacao-comissoes-btg.md`.
- **AÇÃO DO DONO 1**: aplicar a migration em produção (via Supabase MCP/CLI) para o módulo funcionar.
- **AÇÃO DO DONO 2**: usar "Importar extrato (CSV)" (funciona sem depender de API) para começar a
  conciliar a conta PF hoje; conectar a conta PJ via OAuth quando o CNPJ da IMI abrir conta BTG Empresas
  (`docs/BTG_INTEGRATION_GUIDE.md`).
- **Gatilho para revisitar**: acesso liberado a developers.empresas.btgpactual.com (bloqueado pela
  política de rede da sessão que construiu isso) — confirmar path real do endpoint de extrato PJ e
  ajustar `BTG_PJ_STATEMENT_PATH` / `normalizeEntry()` em `src/lib/btg/statement.ts` se divergir.

## Partner API v1 (D-15) — Fase 1 ✅ IMPLEMENTADA (2026-07-05, aprovada pelo dono)
- Entregue: migration aplicada em produção + `src/lib/partner-api/` + 6 rotas `/api/v1/*` + OpenAPI
  (`docs/api/openapi-partner-v1.yaml`) + guia (`docs/api/PARTNER_API_GUIDE.md`) + 14 testes de contrato.
- **AÇÃO DO DONO**: emitir a chave da Mano Imóveis localmente (script em `scripts/partner/`,
  instruções no topo do PROJECT_STATE) e enviar por canal seguro. A chave só aparece uma vez.
- Fase 2 (gatilho: piloto consumindo de verdade): webhooks assinados de saída (reserva/venda/
  preço/disponibilidade, retry + DLQ em tabela), SDK TS **gerado** da spec, coleção Postman, Redoc.
- NÃO expandir além da tabela §3.2 do design sem novo ADR (gatilhos explícitos).

## Novidades da sessão de refinamento que afetam a fila
- E2E agora tem 7 specs/84 testes — candidato natural a job de CI (rodar contra preview do Vercel via `BASE_URL`).
- Controles mortos no console /users (switcher de empreendimento, sino) — decidir: implementar ou ocultar.
- Visual regression (`toHaveScreenshot` nos mapas) segue pendente (P2 da TESTING_STRATEGY).

## Supreme Vision — próximos passos (plano em docs/imi-supreme-vision.md)
1. ✅ Dados reais no motor (#356: ?scope=national + mergeDatasets) · ✅ funil intenção→lote (#352/#354/#359) · ✅ console Match de Cliente (/users/intelligence).
2. Curar mais linhas na neighborhood_intelligence (cada linha melhora o ranking sem deploy) — alavanca de DADOS, ação do dono/cron.
3. Itens 1.2 (unificar domínio imóveis), 1.3 (3 MediaUploaders) e 1.6 (formatadores BRL divergentes) — UI-visíveis, exigem UI_REGRESSION_POLICY (viável: dev server + Playwright com env stub).
4. Motor de intenção agora vive em src/lib/intelligence/ (intent-engine.ts + brazil-fallback.ts) — reutilizável em qualquer superfície.

## IMI Geo Intelligence Engine — estado (2026-07-06)
Fundação v1 ✅ entregue (branch claude/imi-geo-intelligence-engine-vyix5f, PR draft):
módulo aditivo `src/geo/` + `/api/geo/pois` + `/api/geo/health`. Provider-agnóstico
(OSM/Google/Mapbox atrás de `GeoProvider`), parametrizado por perfil, chaves só server-side.
Doc + roadmap completos em `docs/GEO_INTELLIGENCE_ENGINE.md`.
Próximas fases (ordem sugerida, cada uma exige UI_REGRESSION_POLICY quando toca UI):
- **F2** painel lateral premium ao clicar no lote (distâncias/tempos) — reusa `LotDetailPanel` + `usePOIs`.
- **F3** camadas toggleáveis no mapa (estende `AmenityLayer` SVG) sobre `AltoBellevueGeoMap`.
- **F5** heatmaps preço/m² (dados já em `subdivision_lots`) — reusa `PriceHeatmap`.
- **F6** `SupabaseGeoCache` — **AÇÃO DO DONO**: aprovar migration `geo_cache`.
- **F7** assistente IA controlando o mapa (motor em `src/lib/intelligence/` já existe).
- **F10** consolidar as 3 rotas POI legadas via adapters (preservando contrato) e depreciar `lib/poi-service.ts`.

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
