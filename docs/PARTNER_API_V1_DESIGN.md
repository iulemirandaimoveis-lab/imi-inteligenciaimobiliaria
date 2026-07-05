# PARTNER API v1 — Análise Crítica e Decisão de Arquitetura

> **Status**: decisão aprovada como direção (D-15); implementação da Fase 1 **aguarda aprovação do dono** (toca auth + banco — invariante do projeto).
> **Data**: 2026-07-05 · **Autor**: sessão CTO (análise do prompt "IMI API Platform")
> **Contexto de origem**: prompt externo propondo transformar a IMI em plataforma de inteligência imobiliária servindo parceiros (Mano Imóveis etc.) via API.

---

## 1. Veredito executivo

**A tese do prompt está certa. A arquitetura proposta está errada — para este momento.**

- ✅ **Certo**: IMI como única fonte da verdade; parceiros consomem via API, nunca via banco; API versionada, documentada (OpenAPI), com chaves, escopos e webhooks.
- ❌ **Errado**: construir agora GraphQL + WebSocket + SSE + streaming + batch, 18 "motores" compartilhados, multi-tenancy com domínio/branding por parceiro, PostGIS + vector tiles + PMTiles + Cesium, OAuth2, marketplace, ERP, Digital Twin. Isso é uma **lista de desejos de 3 anos**, não uma arquitetura. Executá-la de uma vez, sobre um monólito de produção operado por uma pessoa, é o caminho mais curto para quebrar o que já funciona e não entregar nada a nenhum parceiro.

**Decisão**: construir a **Partner API v1 — REST, read-only, mínima** — dentro do app existente, atrás de API keys com escopos, e evoluir por fases **condicionadas a tração comercial real** (parceiros pagantes), não a ambição de arquitetura.

---

## 2. O que a realidade do repositório diz (e o prompt ignora)

O prompt assume um greenfield. O repositório é um **monólito maduro de produção**:

| Fato verificado | Implicação para a decisão |
|---|---|
| 275 rotas de API internas, 3 mundos (site público, backoffice, console `imi`), 869 testes | A superfície interna **não pode** ser exposta a parceiros; a API de parceiro tem de ser uma superfície **nova, separada e curada** (`/api/v1/*`) |
| **Não há multi-tenancy**: tabelas core sem `tenant_id` (F-11, registrado como by-design) | "Cada imobiliária com tenant/domínio/branding/cache próprios" = reescrever o modelo de dados inteiro. Parceiro que **lê** dados da IMI não precisa de tenant — precisa de uma **chave com escopos** |
| **Não há PostGIS**: geo é GeoJSON estático + motor CAD próprio (`scripts/cad/geo`, `@imi/*`) que já serve os mapas de lotes em produção | Vector tiles/PMTiles/PostGIS são otimização prematura: o volume real (dezenas de empreendimentos, milhares de lotes) cabe em GeoJSON + cache de CDN com folga |
| Incidente FX-10 (2026-07-04): drift entre migrations versionadas e banco real derrubou o catálogo público | Cada objeto novo de banco é risco operacional real. Minimizar: Fase 1 exige **uma** tabela nova (`partner_api_keys`), nada mais |
| Padrões de segurança já pagos: rate limit por classe (D-09), token-auth para rotas públicas (P15/A12/D-11), webhooks de entrada com HMAC, RLS auditada (K-13 limpo) | A API de parceiro **reusa** esses padrões em vez de inventar um stack novo (OAuth2 server, gateway dedicado) |
| Time = 1 operador + agentes de IA | Cada protocolo (GraphQL, WS, SSE) e cada "motor como serviço" é superfície de manutenção **permanente**. B2B server-to-server se resolve com REST + webhooks |

## 3. Análise crítica ponto a ponto do prompt

### 3.1 O que fica (aceito, com ajuste)

| Proposta | Decisão |
|---|---|
| API-first, parceiro nunca acessa o banco | ✅ Núcleo da decisão |
| REST versionada (`/api/v1/`) | ✅ Versionamento por URL; breaking change ⇒ `/v2` |
| API key + escopos + rate limit por chave | ✅ Chave `imi_pk_…` (hash SHA-256 no banco, nunca plaintext), escopos por recurso (`developments:read`, `lots:read`, `prices:read`), Upstash por chave (reusa D-09) |
| OpenAPI + exemplos + Postman | ✅ Spec 3.1 versionada em `docs/api/openapi-partner-v1.yaml`; Redoc/Postman **gerados** da spec, não mantidos à mão |
| Webhooks de saída (reserva, venda, preço, disponibilidade) | ✅ **Fase 2**, HMAC-assinados (espelho do padrão já usado nos webhooks de entrada) |
| SDK TypeScript | ✅ **Fase 2**, gerado da spec (openapi-typescript + client fino em `packages/imi-sdk`). Nunca escrito à mão antes de a API estabilizar com o 1º parceiro |
| Cache: ETag + CDN | ✅ `ETag`/`If-None-Match` + `s-maxage`/`stale-while-revalidate` no CDN Vercel para os GETs. É isso que faz "milhares de imobiliárias" escalar em leitura — não um gateway novo |

### 3.2 O que é rejeitado ou adiado (com gatilho explícito de reavaliação)

| Proposta | Decisão | Gatilho para reavaliar |
|---|---|---|
| GraphQL | ❌ Rejeitado | ≥3 parceiros pedindo queries compostas que o REST não atende |
| WebSocket / SSE / streaming / realtime | ❌ Adiado. Disponibilidade de lote não muda por segundo; polling com ETag (30–60s) + webhook cobre o negócio | Parceiro com caso de uso real de latência <5s |
| Multi-tenancy completa (tenant, domínio, branding, cache/analytics por parceiro) | ❌ Adiado. Isso é o produto "white-label SaaS", outro negócio | ≥3 parceiros **pagantes** na API read-only |
| OAuth2 + refresh tokens | ❌ Adiado. API key basta para server-to-server B2B | Apps de terceiros com usuários finais fazendo login |
| PostGIS, vector tiles, MVT, PMTiles | ❌ Adiado. GeoJSON + CDN atende o volume atual em ordens de magnitude | Consultas espaciais server-side (bbox/raio) ou >100k features por camada. PostGIS é extensão nativa do Supabase — ligar depois é barato |
| Cesium, 3D tiles, LiDAR, drones, BIM, Digital Twin | ❌ Fora de escopo de arquitetura; é roadmap de produto | Tração + contrato que pague |
| 18 "motores" como serviços compartilhados | ❌ Rejeitado como estrutura. Os "motores" já existem como módulos internos (disponibilidade, preços, intent engine D-14, CAD/geo). A API **expõe resultados**, não motores | — |
| Gateway dedicado / arquitetura distribuída / CQRS / Event-Driven | ❌ Rejeitado. O middleware Next + Vercel + Upstash **é** o gateway nesta escala. Distribuir um monólito saudável por antecipação é o anti-padrão clássico | Limites reais de Vercel/Supabase medidos, não imaginados |
| Marketplace, CRM, ERP, integrações cartórios/prefeituras/IBGE/INCRA/Receita | ❌ Visão, não arquitetura. Nada na Fase 1 impede; nada na Fase 1 constrói | — |

### 3.3 Riscos que o prompt cria (e a decisão evita)

1. **Segurança**: expor "tudo" (preços, histórico, documentos, analytics) por API multiplica a superfície de vazamento. Fase 1 expõe o **catálogo comercializável** (o que já é público no site + disponibilidade + preço sob escopo), nada de dados de clientes, propostas, leads ou financeiro. **Nunca** um endpoint de parceiro toca `supabaseAdmin` sem antes validar a chave (mesmo contrato de P15).
2. **Operacional**: 12 estilos de protocolo + SDK à mão + docs à mão = manutenção que um time de 1 não sustenta. Tudo que é derivável (SDK, Redoc, Postman) é **gerado** da spec.
3. **Produto**: 6 meses construindo plataforma = 6 meses sem validar se a Mano Imóveis paga por isso. A Fase 1 valida a tese com semanas de esforço.

---

## 4. Arquitetura decidida — Fase 1 (Partner API v1)

```
Parceiro (server-to-server)
  → https://…/api/v1/{recurso}   Authorization: Bearer imi_pk_…
     → middleware.ts (CORS/headers — já existe)
     → withPartnerAuth()          hash da chave → partner_api_keys (ativa? escopos? ) → 401/403
     → limiters.partner(keyId)    Upstash por chave (reusa D-09) → 429
     → handler read-only          queries curadas (cliente server; admin só com justificativa)
     → resposta JSON/GeoJSON      + ETag + Cache-Control s-maxage → CDN Vercel
```

**Superfície da Fase 1** (read-only, tudo GET):

| Endpoint | Escopo | Conteúdo |
|---|---|---|
| `/api/v1/developments` | `developments:read` | lista paginada (cursor) — nome, status, localização, construtora, mídia de capa |
| `/api/v1/developments/{id}` | `developments:read` | detalhe + galeria, vídeos, tour, documentos públicos |
| `/api/v1/developments/{id}/lots` | `lots:read` | lotes: área, frente/fundos, esquina, orientação, **status de disponibilidade** (disponível/reservado/vendido/bloqueado/em negociação) |
| `/api/v1/developments/{id}/map` | `maps:read` | FeatureCollection GeoJSON (polígonos de lotes, vias, POIs) — mesma fonte do motor CAD atual |
| `/api/v1/lots/{id}` | `lots:read` (+`prices:read` para preço/histórico) | detalhe do lote |
| `/api/v1/availability` | `lots:read` | snapshot compacto de status por empreendimento (é o endpoint de polling; ETag obrigatório) |

**Objetos novos**: 1 migration (`YYYYMMDD_partner_api_keys.sql`) — tabela `partner_api_keys` (id, partner_name, key_hash, key_prefix, scopes text[], active, created_at, last_used_at, revoked_at), RLS habilitada, sem policy para anon/authenticated (acesso só via service role pós-validação). Emissão de chave: script/rota de backoffice (SUPER_ADMIN), exibe a chave **uma única vez**.

**Convenções**: JSON `snake_case`; paginação por cursor (`?cursor=&limit=`); erros `{ error: { code, message } }`; header `X-IMI-API-Version`; contrato de testes por endpoint (auth, escopo, rate limit, ETag) no padrão dos testes de contrato existentes.

## 5. Roadmap por fases (gatilhos, não datas)

- **Fase 0 — feita nesta sessão**: análise crítica + esta decisão (D-15).
- **Fase 1 — Partner API v1** *(requer aprovação do dono: migration + modelo de auth + definição comercial de quem recebe chave)*: tabela de chaves, `withPartnerAuth`, 6 endpoints acima, OpenAPI, testes de contrato, piloto com **Mano Imóveis**. Esforço estimado: 1–2 sprints.
- **Fase 2 — quando o piloto consumir de verdade**: webhooks assinados de saída (reserva/venda/preço/disponibilidade, com retry + DLQ simples em tabela), SDK TS gerado, coleção Postman, página de docs (Redoc).
- **Fase 3 — quando ≥3 parceiros pagantes**: portal do parceiro (self-service de chaves, logs, uso), analytics por parceiro, tenant-scoping das tabelas expostas (resolve F-11 de vez), avaliar PostGIS para busca espacial server-side.
- **Fase 4 — visão (só com tração)**: escrita via API (reserva por parceiro — exige motor de reserva transacional com lock), tiles vetoriais se o volume geo exigir, e o resto da lista do prompt conforme contrato.

## 6. Riscos da decisão escolhida (honestidade com o trade-off)

- **Risco de subestimar demanda**: se 10 parceiros chegarem juntos, a emissão manual de chaves vira gargalo. Mitigação: o desenho da tabela já suporta self-service; só a UI fica para a Fase 3.
- **Risco de acoplamento**: endpoints v1 lendo tabelas internas diretamente acoplam a API ao schema. Mitigação: cada handler passa por um mapper explícito (`toPartnerDevelopment()` etc.) — o contrato público nunca expõe coluna crua; mudar schema interno não quebra `/v1`.
- **Risco de polling**: parceiros mal-comportados sem ETag. Mitigação: rate limit por chave + `availability` barato (query indexada, resposta pequena, CDN).

---

**Regra de ouro desta decisão**: *a plataforma nasce do primeiro parceiro real consumindo, não do diagrama.* Toda expansão da tabela §3.2 exige gatilho atingido + novo ADR.
