# IMI Intelligence Engine — Executive BI + Real-Time Analytics

> Complementary, **isolated** extension of the IMI auth ecosystem (PR #316).
> Does not replace anything — it adds an **Intelligence Layer** on top of the
> existing RBAC, auth and dashboard. New route: **`/users/intelligence`**.
> Production untouched (isolated `imi` schema; no `public.*` changes).

---

## 1. Architecture — Intelligence Layer

```
Leads → Propostas → Corretores → Empreendimentos → Vendas → Eventos
                                                              │
                                                     Analytics Engine
                                                              │
                                                     Data Warehouse (lite)
                                                              │
                                                     Intelligence Layer
                                                              │
                                                          Dashboard
```

Event-driven and **prepared for a future migration** to ClickHouse / Kafka /
Spark / ML: events are append-only with a typed `event_type`, a JSONB payload
and `occurred_at`, so they can be replayed or streamed. The current
implementation stays lightweight (Postgres + computed metrics) — no heavy
infrastructure required to ship.

---

## 2. Data layer (`imi` schema)

Migration: `supabase/migrations/20260626_imi_intelligence_layer.sql`

| Table | Purpose |
|-------|---------|
| `imi.events` | Append-only event stream (the event engine) |
| `imi.metric_snapshots` | Periodic computed metrics (warehouse-lite) |
| `imi.insights` | Generated intelligence (IMI Insights) with a confidence score |

- **Event types** (`imi.imi_event_type`): `LeadCreated, ProposalCreated, ProposalApproved, ProposalRejected, LotReserved, LotSold, BrokerLogin, BrokerActivity, PropertyView, ClientInteraction`.
- **`imi.emit_event(...)`** — SECURITY DEFINER helper to append an event.
- RLS: events readable by project members or `metrics.read`; metrics/insights gated on `metrics.read`.

### Event engine (TypeScript)
`src/lib/imi-intelligence/events.ts`
- `emitEvent({ type, projectId, actorUserId, entity, amount, payload })` — best-effort append (never throws into the request path).
- `recordSale(...)` — emits `LotSold` **and** computes the commission ledger entry (`imi.compute_commission`) in one call.

---

## 3. Analytics engine (pure + testable)

`src/lib/imi-intelligence/analytics.ts` — pure, deterministic, unit-tested
(`src/__tests__/lib/imi-intelligence/analytics.test.ts`):

- **`brokerPerformanceIndex`** — composite **BPI** (0–100) weighting sales,
  conversion, ticket, response speed, activity.
- **`buildFunnel`** — stage conversions for the commercial funnel.
- **`forecast`** — linear-trend forecast with an **R²-derived confidence score**
  (the hook point for a future ML model).
- **`generateInsights`** — auto-generated interpretive phrases (IMI Insights).
- **`windowDelta`** — trailing-window deltas for "cresceu/recuou X%".

`src/lib/imi-intelligence/service.ts` — server aggregator `getIntelligence(session)`
assembles the full model. It reads `imi.events` to flip a `live` flag and
degrades to a deterministic representative dataset so the dashboard renders
before the warehouse aggregation is wired.

---

## 4. Executive BI — modules (`/users/intelligence`)

Cards show **interpretation, not just numbers**. Eight modules:

1. **Executive Overview** — VGV, receita prevista, conversão, propostas, disponibilidade, velocidade comercial, corretor destaque, vendas semanais (with deltas).
2. **IMI Insights** — auto-generated phrases ("Vendas cresceram +18%…", "Corretor destaque: Lucas…", "Risco do estoque: Baixo…", "Previsão 30 dias: R$ …") each with a confidence score.
3. **Sales Intelligence** — animated commercial funnel + revenue trend (area chart).
4. **Broker Intelligence** — BPI ranking + a radar (destaque × equipe).
5. **Inventory Intelligence** — demand heat-map por quadra, alertas automáticos.
6. **Predictive Analytics** — receita/vendas/VGV 30d com **Confidence Ring**, risco e sazonalidade.
7. **Real Time Activity Center** — timeline viva com atualização e animação suave.
8. **Commission Intelligence** — comissão prevista/recebida/projeção + ranking.

Gated by `metrics.read` (brokers without it are redirected to the dashboard). A
section nav in the topbar switches Dashboard ↔ Intelligence.

---

## 5. Motion & data-viz

- **Motion system** (`src/features/users/intelligence/motion.tsx`): `AnimatedNumber` (count-up on view), `Reveal` / `Stagger` (contextual fade+rise), premium `Skeleton` shimmer, `ActivityPulse`. Built on **framer-motion**. Restrained — Apple-Intelligence-grade, never gamer-like.
- **Charts**: **recharts** — area (revenue trend), radar (broker vs team), custom funnel & confidence ring. Deep navy, single gold accent, soft depth.
- **Performance**: animations are GPU-friendly and view-triggered (`useInView`); the route is `force-dynamic` and SSR-rendered with client islands for charts.

---

## 6. Wiring to live data (next phase)

The analytics already render from the representative dataset. To go fully live:
1. Emit events from the existing flows (`emitEvent` on lead/proposal/sale actions; `recordSale` on confirmed sales).
2. Replace the representative dataset in `service.ts` with an aggregation over `imi.events` / `imi.metric_snapshots` (a scheduled job can snapshot metrics).
3. Add Supabase Realtime subscriptions to `imi.events` for the Real Time Activity Center.
4. Persist generated insights into `imi.insights`.

Future scale-out: migrate the event stream to Kafka and aggregation to
ClickHouse/Spark; the schema and engine boundaries already anticipate it.

---

**Last Updated**: 2026-06-26
