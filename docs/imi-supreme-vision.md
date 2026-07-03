# IMI Supreme Vision — Auditoria Fase 1 + Plano de Execução

**Data**: 2026-07-02
**Modo**: IMI Supreme Vision Execution Mode — Fase 1 (Descoberta)
**Status**: Auditoria concluída · Plano aguardando aprovação para Fases 2–4

> Regra do projeto (CLAUDE.md): *"Nunca fazer alterações amplas sem um plano explícito e aprovado."*
> Este documento É o plano explícito. A Fase 1 (descoberta + estabilização de baixo risco) está detalhada
> com alvos por arquivo; as Fases 2–4 listam iniciativas que dependem de aprovação.

---

## 1. Verificação prévia

O prompt "IMI Supreme Vision" **nunca havia sido executado**: o branch
`claude/imi-intelligence-platform-l1t53q` estava idêntico ao `main`, sem PR associado,
e nenhum commit/PR/completion doc menciona essa execução. Os "Sprints CTO" (#330–#333)
vieram de um mandato anterior distinto.

---

## 2. Inventário de capacidades existentes (não reconstruir)

A plataforma já é muito maior do que aparenta. **~230 rotas de API** ativas, agrupadas em:

| Domínio | O que já existe |
|---|---|
| **IA** (`/api/ai/*`, `/api/claude/*`) | analyze, analyze-image, auto-score, qualify-lead, property-insights, team-insights, generate-{content,description,image,cover,calendar}, suggest-reply, daily-summary, render-video (Remotion), write-ebook, router multi-provedor |
| **Inteligência** (`/api/intelligence/*`) | locations, neighborhood, pois, simulate, refresh (+ cron `refresh-intelligence`), **lots/recommend** (ranking de lotes por perfil investor/resident via `score.service`) |
| **Espacial** (`/api/spatial/*`) | developments, properties, **twins** (+ `twins/[id]/valuate`), inspections com issues/complete |
| **Mapa de lotes** (`/api/lotmap/*`, `/api/lots/*`) | dashboard por empreendimento, negotiate, status ao vivo (`subdivision_lots`), reserve, proposal + documentos |
| **Investimento** (`/api/invest/*`) | bolsa, índices, simulador |
| **Avaliações** (`/api/avaliacoes/*`) | motor de cálculo, **KB com RAG** (index-books, query, feedback, process-image), interpretar-email, export, QR |
| **Operações** | BPO financeiro (DRE, conciliação), frota, plantão (escala, checkin, trocas), partnerships, comissões, metas, contratos + assinatura eletrônica, PIX/AbacatePay |
| **Console IMI** (`/users/*`) | dashboard, **intelligence**, **map** (espelho multi-empreendimento: lotes + verticais), proposals, goals, commissions, team, admin — RBAC real (schema `imi`, RLS, `has_permission()`) |
| **Front público** | Alto Bellevue (explorador multi-vista, satélite WebGL georreferenciado, carrinho, proposta), Jazz Boulevard (scrollytelling, tipologias), multi-idioma, PWA |
| **Engines** (`src/lib/*`) | `lotmap/` (engine + cart + compare), `imi-intelligence/` (service + analytics + events), `intelligence/` (subsidy-engine 274L, acquisition-strategy 329L), `valuation/`, `invest/`, `geo/`, `digital-twin/` |
| **CADAM** (`src/features/cadam`) | Geração paramétrica de cenas CAD (prompt → OpenSCAD, sliders paramétricos, templates) — capacidade quase invisível na UI |

**Conclusão estratégica**: o problema do IMI não é falta de capacidade — é **fragmentação e
invisibilidade**. Existem motores de inteligência reais que a experiência do usuário não expõe
como um sistema único.

## 3. Sistemas incompletos, ocultos e abandonados (achados da varredura)

### 3.1 Ocultos / desligados
- **Digital Twin Alto Bellevue** — implementado atrás da flag `NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN`
  (`src/lib/digital-twin/feature-flag.ts`). Sprint 0/1 concluídos (isolamento + mídia), experiência nunca promovida.
- **Feature flags centrais** (`src/lib/config/features.ts`) declaram módulos `voiceSearch`,
  `computerVision`, `arViewer`, `predictiveModel`, `satelliteMonitor`, `llmDashboard` como "ligados",
  mas as APIs pagas que os alimentam estão todas `false` — módulos rodam em modo degradado/fallback.
- **CADAM** — motor funcional sem entrada clara na navegação.

### 3.2 Inteligência com dados sintéticos
- `src/app/[lang]/(website)/inteligencia/brazilIntelligenceFallback.ts` — **todo o "mercado Brasil"
  é uma tabela estática hardcoded** (27 UFs, preço/m², yield, tendência). *Verificado em 2026-07-03:*
  o `IntelligenceDashboard` **já rotula** a origem via `DataSourceBadge` ("Dados ao vivo" / "Estimativa
  IMI" / "Dados em expansão") — a lacuna real não é rotulagem, é **fonte de dados de mercado real**
  alimentando `intelligence/*` (Fase 2).
- `AdminView.tsx` ainda carrega o botão "Remover TODOS os dados mockados (mock=true)" — dados de
  demonstração convivem com dados reais no console.
- `api/ai/suggest-reply` tem resposta enlatada de fallback; `api/ai/router` tem stub Kling (vídeo).

### 3.3 Fragmentação / débito técnico
- **Dois engines de mapa em paralelo**: MapLibre é o padrão (`AerialSatelliteMap`, `AltoBellevueGeoMap`,
  `SatelliteMap`), mas `PropertyMap.tsx` carrega **`mapbox-gl` dinamicamente** (`await import('mapbox-gl')`)
  quando `NEXT_PUBLIC_MAPBOX_TOKEN` (pk.) está configurado, com CSS global em `globals.css`.
  *Correção da auditoria inicial (que o marcava como dependência morta por só buscar imports estáticos).*
  A consolidação num único engine é decisão da Fase 2 (Map Intelligence Layer), não remoção trivial.
- **Cópias paralelas divergentes**: `src/modules/imoveis/components/*` (usado pelo **site público** —
  `[lang]/imoveis`, `inteligencia/mapa`, home) vs `src/components/backoffice/imoveis/*` (usado pelo
  **backoffice**). MediaUploader, BulkActions, TrackingLinkModal, PropertyForm… mesmos nomes, conteúdo
  diferente. Ambos vivos — a unificação exige extrair o núcleo comum, não deletar um lado.
- **3 MediaUploaders** distintos e todos em uso (`components/ui` 97L, `modules/imoveis` 314L,
  `backoffice/imoveis` 394L com ordenação dnd-kit) — consolidar em 1 componente com variantes é
  refactor com risco de regressão de UI (exige PR dedicado + `UI_REGRESSION_POLICY`).
- ~~662 marcadores TODO/FIXME~~ **Corrigido na triagem (2026-07-03)**: o número vinha de regex
  case-insensitive capturando a palavra pt-BR "todos" e placeholders de formulário. O débito real é:
  **3 comentários TODO** (`api/analytics/vitals` persistência; `app/layout.tsx` migração Next 15;
  `lib/supabase/middleware.ts` gate de billing), **~8 aliases `@deprecated`** (o mais relevante:
  `formatBRL` em `lib/commission.ts`, usado em 17 arquivos — migrar para `formatCurrency` de
  `@/lib/format` é tarefa incremental) e **3 stubs de integração** documentados (Kling video em
  `api/ai/router`; Google Ads e Meta Ads sync em `lib/ads/executor.ts`).
- **4 mapas satélite/geo separados** implementando padrões próprios de câmera, tiles e georreferência
  — sem camada comum de "Map Intelligence".

## 4. Princípios extraídos (GRAFF-class, sem copiar)

1. **O mapa é o produto** — decisão espacial > listagem. O IMI já tem status ao vivo por lote; falta elevar isso a camada padrão de toda a experiência.
2. **Intenção > filtro** — "quero valorização + liquidez + família" deve virar consulta ao `score.service` + `intelligence/*`, não um formulário.
3. **Confiança por explicação** — cada score/recomendação com "por quê" gerado por IA (engine de explicação já é viável com as rotas existentes).
4. **Continuidade emocional** — do site público ao console do corretor, a mesma linguagem visual e o mesmo estado (carrinho/proposta já cruzam vistas — expandir o padrão).
5. **Tecnologia invisível** — flags, fallbacks e stubs nunca aparecem para o usuário como buracos.

## 5. Plano de execução

### Fase 1 — Estabilizar e desfragmentar (baixo risco, pode iniciar após aprovação deste doc)
| # | Ação | Alvos | Risco | Status |
|---|---|---|---|---|
| 1.1 | ~~Remover `mapbox-gl` (dependência morta)~~ **Invalidado na verificação**: é engine dinâmico opcional do `PropertyMap`. Decisão de engine único movida para a Fase 2 | `PropertyMap.tsx`, `globals.css` | — | Reclassificado |
| 1.2 | Unificar domínio imóveis: extrair núcleo comum de `src/modules/imoveis` (site público) e `src/components/backoffice/imoveis` (backoffice) — **ambos vivos**, nenhum lado pode ser deletado | `src/modules/imoveis/**`, `src/components/backoffice/imoveis/**` | Médio-alto | Pendente (PR dedicado) |
| 1.3 | Consolidar os 3 MediaUploaders em 1 componente com variantes (simples / com docs / com ordenação dnd-kit) | `components/ui`, `modules/imoveis`, `backoffice/imoveis` | Médio | Pendente (PR dedicado + UI_REGRESSION_POLICY) |
| 1.4 | Triagem de TODOs/débito → inventário real (3 TODOs + 8 `@deprecated` + 3 stubs; "662" era falso positivo) e remoção dos shims deprecated sem uso (`lib/supabase.ts`, `lib/send-notification.ts`, `lib/design-system/tokens.ts`) | `src/lib/**` | Baixo | **Concluído** (restam: migração `formatBRL`→`formatCurrency` em 17 arquivos, incremental) |
| 1.5 | ~~Rotular dados de fallback na página `/inteligencia`~~ **Já implementado**: `DataSourceBadge` exibe "Estimativa IMI" quando `dataSource === 'fallback'` | `IntelligenceDashboard.tsx` | — | Concluído (pré-existente) |

### Fase 2 — Map Intelligence Layer (upgrade dos mapas)
- Extrair camada comum `src/lib/map-intelligence/` (câmera, tiles, georef, clustering, camadas) usada pelos 4 mapas MapLibre.
- Camadas de dados sobre o mapa: preço/m², yield, liquidez e score IMI (fontes: `intelligence/*`, `invest/*`, `score.service`) com heatmap e clustering inteligente.
- Camadas POI já existentes (`/api/pois`, `intelligence/pois`) promovidas a toggles nativos (escolas, saúde, comércio, mobilidade).
- Explicação de bairro por IA no clique (rota nova `intelligence/neighborhood/explain` reutilizando o provider de `ai/analyze`).

### Fase 3 — Experiências proprietárias
- **Busca por intenção**: entrada em linguagem natural no site e no console → tradução para `lots/recommend` + `intelligence/simulate` (o backend já existe; falta a experiência).
- **Promover o Digital Twin** do Alto Bellevue (tirar da flag após homologação) e generalizar o padrão para Jazz Boulevard.
- **Modo comparação de investimento** ampliado (base: `lotmap/compare.ts` + `invest/simulate`).
- **Storytelling espacial**: reutilizar o scrollytelling do Jazz como componente de plataforma.

### Fase 4 — Capacidades que definem mercado
- Playback temporal de valorização (histórico → `refresh-intelligence` acumulando séries).
- Simulação de sol/vista por lote (dados georef já calibrados no satélite WebGL).
- AI Advisor unificado (property + investment + neighborhood) sobre as rotas `ai/*` existentes, com engine de confiança e risco.

### Fora de escopo sem aprovação explícita (regra do projeto)
Autenticação, billing, alterações de banco (schema `imi`/RLS), e **qualquer URL de localização/tour do
Alto Bellevue** (`.claude/ALTO_BELLEVUE_LOCATION.md`).

---

**Próximo passo**: executar itens 1.2 e 1.3 em PRs dedicados e verificáveis (com screenshots antes/depois
conforme `UI_REGRESSION_POLICY`), e 1.4 como varredura incremental. Fase 2 inicia pela decisão de engine
único de mapa + extração da camada `map-intelligence`.

---

**Registro de verificação (2026-07-03)**: os achados da auditoria inicial foram re-verificados antes de
qualquer alteração de código. Três correções registradas: (a) `mapbox-gl` está vivo via import dinâmico;
(b) `src/modules/imoveis` é usado pelo site público; (c) a rotulagem de fallback já existia. Nenhuma
mudança de código destrutiva foi executada com base na auditoria não verificada.
