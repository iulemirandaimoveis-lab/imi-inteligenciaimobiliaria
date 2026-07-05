# CHANGE_RECEIPT — Recibo de Mudanças por Sessão

> Uma entrada por sessão de trabalho. O que mudou, por quê, como foi validado. Mais recente no topo.

---

## 2026-07-03 · Sessão: Spatial Intelligence Fase 2 — vista "Sat. + Lotes" no console

**Branch**: `claude/imi-spatial-intelligence-vision-1ojqvc` (recomeçada de main @ eae934c após merge do #344)

### O que foi feito
- `src/features/users/map/MapMirrorView.tsx`: terceira vista **"Sat. + Lotes"** no espelho
  do console (/users/map) reusando o componente canônico `AltoBellevueGeoMap` do site
  público (mesmo padrão do JazzBoulevardViewer) — lotes georreferenciados clicáveis sobre
  satélite real com status ao vivo, antes exclusivos do site público.
  - Vista renderizada FORA do GlassCard: o backdrop-filter do card cria containing block
    e cliparia o bottom-sheet/modal `position:fixed` do geo map no mobile.
  - Default inteligente: satlotes (AB) → satélite (âncora) → lotes; fallback por projeto.
  - Nota do satélite atualizada (aponta para a nova vista em vez de dizer "em andamento").
- Descoberta de investigação: a infra de georef já existe (`alto-bellevue-geojson.ts`,
  caixa aproximada + calibração de similaridade); os GCPs (`scripts/cad/geo/control-points.json`)
  seguem PENDING e o arquivo proíbe inventá-los — o ajuste fino continua bloqueado no dono.

### Validação
- type-check ✅ · lint ✅ · jest 62 suítes, 859 ✅ / 5 skipped.

### Risco
- Baixo: aditivo (vista nova), componente canônico já em produção no site público.
  Sensível: comportamento do bottom-sheet fixo no mobile dentro do console (validar em aparelho).

## 2026-07-03 · Sessão: Refinamento de sistema — infra de testes + engine de mapa + UX (FABLE SUPREME CTO MODE)

**Branch**: `claude/imi-system-refinement-ys3w7d`

### Código alterado (fixes de auditoria profunda)
- **AltoBellevueGeoMap**: (1) visibilidade de camadas reaplicada após remount do mapa (toggle claro/escuro dessincronizava painel × mapa); (2) fullscreen agora só via evento `fullscreenchange` (iOS Safari ficava preso em "Minimizar"); (3) `.catch` no init do engine — falha de import do maplibre não deixa mais spinner infinito; (4) captura da instância antes do evento `load` (vazava mapa/WebGL ao desmontar cedo); (5) aria-labels nos botões icon-only (painel de lote ×2, amenity modal, painel de camadas).
- **useLotCart**: sincronização entre instâncias na mesma página via evento `imi:lot-cart-sync` + `storage` (cross-tab). Corrige FAB de proposta obsoleto entre vistas do explorador (raiz do sintoma tratado no PR #342).
- **Jazz Boulevard**: back-link com prefixo de idioma (`/${lang}/...`); UnitGrid não renderiza mais unidades `hidden` (eram invisíveis porém clicáveis/focáveis); Escape fecha UnitDetailPanel e ComparePanel; aria-labels nos botões de fechar.
- **Jazz LP (CONVERSÃO)**: 3 links `wa.me/5581999999999` (placeholder morto) → número real `5581986141487`.

### Infra de testes criada
- `playwright.config.ts`: projetos desktop (1440×900) + mobile (Pixel 7), modo remoto via `BASE_URL`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` p/ sandboxes.
- `e2e/fixtures.ts`: fixture `consoleErrors` (gate zero-erro com allowlist de terceiros), `expectNoHorizontalOverflow`, matriz `VIEWPORTS` (8 tamanhos).
- Novos specs (84 testes no total): `alto-bellevue` (incl. invariante do link do Maps), `jazz-boulevard` (incl. regressões desta sessão), `users-console` (fronteiras de auth sem credenciais), `responsive` (matriz), `a11y` (nomes acessíveis/alt/rel/lang).
- Jest: `use-lot-cart-sync.test.tsx` (6 testes — sync entre instâncias, anti-loop, corrupção de storage).
- Scripts: `test:e2e`, `test:e2e:prod`.

### Validação
- type-check ✅ · lint ✅ · jest 60 suítes, 822 ✅ / 5 skipped · `playwright test --list` 84 testes ✅.
- Execução E2E não foi possível neste sandbox (rede nega produção; sem `.env.local` p/ dev server) — specs são read-only e rodam local/CI.

### Risco
- Baixo. Mudanças cirúrgicas em componentes client; nenhuma mudança de auth/banco/billing. Localização/tour Alto Bellevue intocados (agora com gate E2E).

## 2026-07-03 · Sessão: Spatial Intelligence Fase 1 — estabilização do motor de mapas

**Branch**: `claude/imi-spatial-intelligence-vision-1ojqvc`

### O que foi feito (auditoria profunda + fixes)
- `src/features/users/map/SatelliteMap.tsx`: reescrito como casca fina sobre o canônico `AerialSatelliteMap` — o console herdava o bug de tiles vazios (z>18, Esri) que o #339 só corrigiu numa das duas cópias; remove ~90 linhas duplicadas.
- `src/components/maps/InteractiveLotMap.tsx`: pinch-zoom agora ancora no centro do pinch (antes `lastTouchCenter` era declarado e nunca usado → mapa "escorregava" dos dedos); two-finger pan; handoff pinch→pan sem salto; cancelamento do rAF de animação no unmount; alvos de toque ≥44px via `HitArea` invisível (chips 32–36px, botões 40px — sem mudança visual).
- `src/components/maps/useLotMap.ts`: sync periódico de status (45s, só com aba visível + resync ao voltar à aba) — honra o "status ao vivo" prometido na UI, que só buscava 1×; flag de cancelamento nos fetches (race ao trocar de empreendimento); `selectedLot` também é atualizado no sync.
- `src/components/maps/PropertyMap.tsx`: `mapLib` deixou de ser singleton de módulo anulado no unmount (quebrava 2ª instância viva) → `mapLibRef` por instância; `darkMode` adicionado aos deps de `addMarkers` (cor de pin ficava stale).
- `src/features/users/map/MapMirrorView.tsx`: alvos de toque ≥44px nas tabs Satélite/Lotes e no seletor de projeto.

### Validação
- type-check ✅ · lint ✅ · jest map/lot suites 88/88 ✅ · suíte completa rodada na sessão.

### Risco
- Baixo: sem mudança de arquitetura, sem tocar auth/banco; gestos de toque são a área mais sensível (validar pinch em iOS real).

## 2026-07-02 · Sessão: Auditoria de inteligência de projeto

**Branch**: `claude/project-intelligence-audit-9vzb7e`

### O que foi feito
- Varredura completa do repositório (estrutura, 275 rotas API, auth, middleware, PWA, migrations, deps, testes, CI).
- Executados quality gates: type-check ✅, lint ✅, jest 829/834 ✅.
- Criado sistema de inteligência: 17 docs em `docs/` (PROJECT_MAP, ARCHITECTURE, DEPENDENCIES, UI_SYSTEM, API_MAP, STATE_FLOW, KNOWN_ISSUES, TECH_DEBT, SECURITY_AUDIT, PERFORMANCE_REPORT, RESPONSIVE_AUDIT, ACCESSIBILITY_REPORT, REFACTOR_ROADMAP, TODO_MASTER, DECISION_LOG, COMPONENT_RELATIONS, TESTING_STRATEGY).
- Criada memória persistente `.memory/` (9 arquivos).
- CLAUDE.md atualizado com protocolo de leitura da memória.

### Achados-chave (evidência nos docs)
- F-01 senha temporária de 24 bits no reset admin (ALTA).
- Deps mortas: jsonwebtoken, ua-parser-js; mapbox-gl suspeita.
- Rate limit em só ~11/275 rotas; lint sem gate no CI; 5 testes skipped.
- Nenhum vazamento de service-role para client components (3 suspeitas eram texto de UI).

### Validação
- Nenhum código de produção alterado nesta sessão (somente docs/memória) → gates seguem verdes por definição; re-rodados mesmo assim (todos ✅).

### Risco
- Nulo (docs-only).

## 2026-07-02 · Sessão 2: Execução dos fixes de segurança + quick wins (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (mesmo PR #343)

### Código alterado
- **F-01**: `api/admin/reset-password` — senha temp `randomBytes(12).toString('base64url')` (~96 bits).
- **F-02**: `getSession()`→`getUser()` em 4 rotas (reset-password, set-password, parse-property-book, enrich-developer-properties — proxies mantêm getSession só p/ access_token).
- **Rate limit novo**: `auth/login` (5/min/IP), `auth/first-access` (5/min/IP), `users/auth/first-access` (5/min/IP), `lots/proposal` (5/min/IP), `intelligence/simulate` (public), `proposals/respond` (10/min/IP).
- **CI**: `continue-on-error` removido do job lint.
- **A11y**: `MotionProvider` (reducedMotion="user") no layout raiz.
- **Deps**: removidos jsonwebtoken, ua-parser-js (+ @types).
- **Teste**: auth-login.test.ts — IP único por caso + teste anti brute-force (429 na 6ª tentativa).

### Descobertas (auditoria auto-corrigida)
- `contact`/`consultation` JÁ tinham RL (falso positivo F-05 original).
- `apiHandler` (src/lib/api-helpers.ts) = wrapper centralizado com auth+RL+audit — cobertura real muito maior.
- `<img>` sem alt era mock de teste (A-06 falso positivo).
- 🆕 **F-09 (ALTA, aberta)**: `proposals/respond` muta proposta por proposal_id cru sem token — aguarda aprovação p/ exigir token.

### Validação
- tsc ✅ · eslint ✅ · jest: falha de teste do login detectada→corrigida→suíte completa re-rodada (ver abaixo).

### Risco
- Baixo. Rollback: revert do commit (nenhuma migration, nenhum contrato quebrado — RL é aditivo).

## 2026-07-02 · Sessão 3: Investigação IDOR (F-09) + análises T-03b/T-08 (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (PR #343)

### Investigação (sem alterar código de produto — findings requerem aprovação)
- **F-09 IDOR (ALTA)**: rastreado o fluxo proposta pública (token) → client envia proposal_id cru → `proposals/respond` faz UPDATE anon sem token/ownership. Evidência de migrations: `public.proposals` tem policies `TO authenticated` mas **NENHUM `ENABLE ROW LEVEL SECURITY`** (varrido migrations + rls-policies.sql + rls_block8.sql + manual-schema.sql). Corroborado por comportamento (viewed anon). CVSS~8.1. Fix (token + enable RLS) documentado, AGUARDA APROVAÇÃO.
- **F-10**: mesma raiz em `proposals/track` (impacto menor).
- **T-02b**: rotas públicas restantes triadas — todas ok exceto a família proposals.
- **T-08**: nenhum iframe interno emoldura backoffice/users/api; frame-ancestors 'self' é o controle real. Recomendação: padronizar X-Frame-Options=SAMEORIGIN (aguarda ok).

### Código alterado (baixo risco, auto-executado)
- **CI security job (T-03b/D-10)**: gate bloqueante `npm audit --omit=dev --audit-level=critical` (0 críticas em prod hoje) + audit informativo completo. Dev-only criticals (handlebars via ts-jest) não travam.

### Evidência npm audit
- Prod: 0 crítica / 15 alta / 13 mod. Completo: 1 crítica (handlebars/dev) / 19 alta.
- xlsx (prod, sem fix): T-24 substituir.

### Docs/memória atualizados
- SECURITY_AUDIT (F-09 completo, F-10, F-03 rev, F-08 rev, D-10), DECISION_LOG (D-10), KNOWN_ISSUES (K-11..K-13), TESTING_STRATEGY (RLS audit), DEPENDENCIES (estado audit), TODO_MASTER (T-23/T-24/T-02b/T-03b), FAILURES (FX-06), KNOWN_PATTERNS (P15/A11/A12), PROJECT_STATE.

### Risco do commit
- Baixo. Só CI config + docs. Nenhum contrato/rota/schema alterado.

## 2026-07-02 · Sessão 4: F-09 fix (app+RLS), T-08, T-24 — aprovados (FABLE SUPREME CTO MODE)

**Branch**: `claude/project-intelligence-audit-9vzb7e` (PR #343)

### F-09 IDOR — CORRIGIDO (Fase A app + Fase B migration)
- `proposals/respond` + `proposals/track`: reescritos p/ autorizar por TOKEN secreto (min 16), lookup via supabaseAdmin, proposal_id do cliente rejeitado. Valida expiração(410)/estado(409)/token inválido(403)/rate limit(429). Colunas de evento → ip_address.
- `src/app/p/[token]/page.tsx` → supabaseAdmin (token-gated), pois a migration habilita RLS.
- `PropostaPublicaClient.tsx` → envia token (não proposal_id); trackEvent(token,...).
- Migration `20260702_f09_proposals_rls_hardening.sql`: ENABLE+FORCE RLS em public.proposals e proposal_events; policies só authenticated (tenant/owner); anon sem policy; +colunas time_on_page_seconds/device_type. ⚠️ Requer aplicação no banco pelo dono.
- Testes: `__tests__/api/proposals-respond.test.ts` (8) — valid/missing/short/invalid/expired/replay/no-counter/ratelimit.

### T-08 X-Frame-Options escopado (fonte única)
- Removido do middleware; next.config: DENY p/ backoffice|users|api|auth|login|admin|console, SAMEORIGIN público (negative-lookahead). CSP frame-ancestors 'self' = autoridade. Teste `__tests__/middleware/frame-options.test.ts` (5).

### T-24 xlsx→exceljs
- Adapter `src/lib/spreadsheet/` (SpreadsheetParser + ExcelJS + limites anti-DoS 10MB/100k linhas). Refatorados document-parser.ts e backoffice/imoveis/[id]/lotes. `xlsx` removido; `exceljs` adicionado. Testes `__tests__/lib/spreadsheet-parser.test.ts` (8): rows/vazio/fórmula/data/bool/unicode/CPF/CSV-escaping/limite/corrompido.

### Gates
- tsc ✅ · eslint ✅ · jest 851/856 ✅ (60 suítes, 5 skipped pré-existentes, +21 testes novos).

### Docs/memória
- SECURITY_AUDIT (F-09 corrigido), DECISION_LOG (D-11/D-12/D-13), TODO_MASTER (T-08/T-23/T-24 done), DEPENDENCIES, PROJECT_STATE, KNOWN_PATTERNS (P15-P17), REUSABLE_COMPONENTS.

### Risco
- Médio-baixo. App fix é reversível (revert). Migration é aditiva/não-destrutiva (rollback: DISABLE RLS). Ação do dono: aplicar migration.

## 2026-07-02 · Sessão 5: Verificação de banco via MCP + correção de diagnóstico F-09/K-13

**Banco de produção** (Supabase MCP, projeto zocffccwjjyelwrgunhu):
- Descoberto que RLS de proposals/proposal_events JÁ estava habilitada; policies exigem auth.uid()
  → anon bloqueado. F-09 anônimo NÃO era explorável (severidade ALTA→informativa/resolvido).
- proposals NÃO tem tenant_id → a migration do repo (que reescrevia policies por tenant e removia
  bo_full_proposals) teria QUEBRADO produção. Não aplicada; reescrita para versão segura.
- APLICADA migration segura `proposal_events_add_tracking_columns` (add time_on_page_seconds,
  device_type — faltavam; inserts falhavam). Idempotente, não-destrutiva.
- K-13: query confirmou 0 tabelas public com RLS off (schema todo protegido).
- F-11 registrado (informativo): policies de proposals são org-wide; by-design single-org.

**Repo**: migration file reescrita para refletir a realidade + docs corrigidos honestamente
(SECURITY_AUDIT F-09/F-11/K-13, FAILURES FX-06, LEARNINGS L-15, KNOWN_ISSUES K-11/K-13,
PROJECT_STATE, NEXT_TASK).

**Lição L-15**: migrations versionadas ≠ estado real; sempre verificar via MCP antes de migration de RLS/policy.

**Código**: sem mudança nesta sessão além da migration file (app da sessão 4 continua correto —
usa service_role+token, funciona sob a RLS real).

**Risco**: baixo. A migration aplicada é aditiva (colunas). Rollback trivial (DROP COLUMN).

## 2026-07-02 · Sessão 6: T-07 — sanitização de HTML (DOMPurify único)

- Auditados os 13 `dangerouslySetInnerHTML`: 7 JSON-LD estático (seguro), 2 já com DOMPurify,
  1 QR-SVG próprio, 1 script estático, 1 SVG remoto próprio; 3 usavam sanitizador por regex
  (bypassável) em HTML de banco.
- Novo util `src/lib/sanitize-html.ts` (DOMPurify isomorphic, perfil html, guarda de nulos).
- Substituídos os 3 regex por `sanitizeHtml()`: biblioteca (site+backoffice) e conteudo/[slug].
- Teste `__tests__/lib/sanitize-html.test.ts` (contrato do wrapper; isomorphic-dompurify mockado
  por incompatibilidade de jsdom aninhado sob jest — código funciona em prod).
- Docs: SECURITY_AUDIT F-06 (corrigido), TODO_MASTER T-07, KNOWN_PATTERNS P18.
- Gates: tsc ok, eslint ok, jest 853/858 (61 suites, +2 testes).
- Risco baixo: DOMPurify é mais restritivo que os regex antigos; formatação preservada (perfil html + style mantido).

## 2026-07-02 · Sessão 7: HOTFIX build — isomorphic-dompurify externo (regressão do T-07)
- Vercel + CI job build falharam (4e6255e): ENOENT default-stylesheet.css em conteudo/[slug] (Server Component); jsdom do isomorphic-dompurify empacotado no server. tsc/lint/jest não pegam.
- Fix: next.config.js experimental.serverComponentsExternalPackages: ['isomorphic-dompurify'].
- VERIFICADO com next build local: passou de "Collecting page data" para "Generating static pages (0/454)". Fix confirmado.
- FAILURES FX-07, LEARNINGS L-16, KNOWN_PATTERNS A13.

## 2026-07-04 · Sessão Supreme Vision: plano + Fase 1 executável + flagship Descoberta por Intenção
- #346 (merged): docs/imi-supreme-vision.md — auditoria (com 3 correções pós re-verificação) + roadmap 4 fases.
- #347 (merged): triagem real de TODOs ("662" era a palavra pt-BR "todos" em regex -i) + remoção de 3 shims @deprecated sem uso (−279 linhas; lib/supabase.ts instanciava browser client em module scope).
- #349 (merged): JSDoc de formatBRL corrigido (formatCurrency NÃO é equivalente: 0 casas vs centavos) + item 1.6 no plano.
- Flagship: intentEngine.ts (puro, D-14) + IntentDiscovery.tsx na /inteligencia + 10 testes.
- Verificação visual SEM .env real: next dev com Supabase stub + Playwright/chromium — página cai no fallback por design. Screenshots desktop/mobile/query conferidos; 2 bugs pegos no visual (vírgula pt-BR; empate ordenado por fit arredondado — sort por exactFit).
- Gates: tsc ok, lint ok, jest 869/874 (62 suítes).

## 2026-07-04 · Hotfix: /imoveis vazio em produção ("Portfólio em Curadoria") — FX-10
- Causa: select do #334 pedia `cover_video_url`, coluna nunca aplicada em produção (migration
  manual jazz_boulevard executada parcialmente) → 42703 → catálogo público inteiro vazio.
- DB (produção, via MCP): `ALTER TABLE developments ADD COLUMN IF NOT EXISTS cover_video_url TEXT`
  — aditiva, idempotente, já prevista em migration commitada. Site voltou na hora (page é force-dynamic).
- Código: migration versionada `20260704_add_cover_video_url.sql` + fallback `CORE_SELECT` em
  `imoveis/page.tsx` (query com colunas históricas se o select completo falhar).
- Verificação: select completo reproduzido via SQL retorna 7 empreendimentos; FK do embed
  `developers(name,logo_url)` confirmada; tsc ok, lint ok.

## 2026-07-04 · Sessão Supreme Vision (cont.): ponte inteligência→inventário
- IntentDiscovery ganha sub-seção "Do insight ao inventário": consome a rota pública
  /api/intelligence/lots/recommend (antes sem NENHUM consumidor de UI) com perfil derivado
  das intenções via intentsToProfile() (rental/appreciation→investor; premium/affordable→resident; misto→all).
- Top-3 lotes reais do Alto Bellevue com IMI Score, preço/área e razão; CTA para o explorador /imoveis.
- Falha/vazio da API → seção não renderiza (nunca estado quebrado); verificado visualmente com
  Playwright (mock de rota para o estado com dados + estado oculto sem API).
- Gates: tsc ok, jest 872/877 (+3 testes de intentsToProfile), lint ok, next build exit 0.

## 2026-07-05 · Sessão Supreme Vision (cont. 2): motor híbrido — dados reais no ranking nacional
- Descoberta: neighborhood_intelligence tem 36 bairros reais curados (6 cidades, data_source imi_internal)
  servidos por /api/intelligence/neighborhood — mas nenhum consumidor nacional.
- API: novo modo ?scope=national (aditivo, cache 1h, filtra UFs BR — exclui Dubai/UAE).
- Motor: mergeDatasets() — linha real sobrepõe fallback por chave cidade+bairro normalizada,
  bairros novos entram, linhas incompletas são descartadas; source: 'live'|'estimate'.
- UI: badge vira "Dados IMI + Estimativa" (verde) quando há dado real; dot verde por linha live.
- Visual verificado (Playwright + mock): Cabo Branco reordenado ao topo com números reais;
  Balneário Camboriú (inexistente no fallback) entrou no ranking.
- Gates: tsc ok, jest 875/880 (+3 testes mergeDatasets), lint ok, build exit 0.

## 2026-07-05 · Sessão CTO: decisão Partner API v1 (D-15) — análise crítica do prompt "IMI API Platform"
- Prompt externo pedia plataforma completa (GraphQL/WS/SSE, 18 motores, multi-tenant com domínio,
  OAuth2, PostGIS/tiles/Cesium, marketplace). Decisão CTO: aceitar a tese API-first, rejeitar o
  maximalismo — Partner API v1 REST read-only com API key/escopos, evolução por gatilhos de tração.
- Entregas (só docs, zero código de runtime): docs/PARTNER_API_V1_DESIGN.md (análise ponto a ponto,
  arquitetura Fase 1, superfície de 6 endpoints, roadmap por gatilhos, riscos), D-15 no
  DECISION_LOG + índice .memory/ARCHITECTURE_DECISIONS.md, memória atualizada.
- Implementação da Fase 1 GATED: exige aprovação do dono (migration partner_api_keys + modelo de
  auth por chave + definição comercial). Invariante "auth/banco só com aprovação" respeitada.
- Branch: claude/imi-saas-platform-design-el33oi (PR draft).

## 2026-07-05 · Sessão Supreme Vision (cont. 3): deep-link de lote — funil completo
- InteractiveLotMap: efeito de deep-link ?lote=QUADRA-LOTE (matching tolerante a zero à
  esquerda: C-4 casa com id C-04), consumido uma vez, seleciona o lote e centraliza o mapa.
- MatchingLots (Descoberta por Intenção): CTA agora aponta para
  /imoveis/{slug}?lote={quadra}-{numero} — o funil intenção→lote abre direto no lote.
- Verificação: página temporária isolada (removida) + Playwright — painel do Lote 04/Quadra C
  abriu via ?lote=C-4; controle negativo sem param ok. Jest 875/880, lint ok, build exit 0.

## 2026-07-05 · Partner API v1 — Fase 1 implementada (D-15 aprovada pelo dono; piloto Mano Imóveis)
- Banco: migration `20260705_partner_api_keys.sql` versionada E aplicada em produção via MCP
  (verificado pós-aplicação: RLS on + forced, 0 policies — acesso só service_role, padrão P15/D-11).
  Estado real verificado ANTES (L-15): tabela não existia; subdivision_lots completo (AB 383 + MM 1045, com preço).
- Código novo: `src/lib/partner-api/` (auth com SHA-256+escopos+RL 120/min por chave, mappers coluna a
  coluna, ETag/304, queries curadas, builder GeoJSON do AB) + 6 rotas GET em `src/app/api/v1/`
  (developments list/detail, lots por empreendimento, lot detail, map, availability com overlay da
  planilha ao vivo do AB). Zero coluna crua exposta; preço gated por escopo prices:read.
- Docs: OpenAPI 3.1 (`docs/api/openapi-partner-v1.yaml`), guia de integração
  (`docs/api/PARTNER_API_GUIDE.md`), API_MAP com a classe "Parceiro (v1)".
- Emissão de chave: `scripts/partner/create-partner-key.mjs` — chave exibida uma única vez na
  máquina do dono; banco guarda só o hash. NUNCA gerar chave em CI/chat.
- Gates: tsc ok, lint ok, jest 64 suítes / 889 passed (14 novos testes de contrato).
- Armadilha registrada: corpo de resposta com timestamp quebra ETag/304 — availability não tem
  timestamp no corpo por design.
