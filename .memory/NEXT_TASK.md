# NEXT_TASK — Próxima Tarefa

**Atualizado**: 2026-07-06 (conciliação de comissões BTG — estrutura completa, migration pendente de aplicação)

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
