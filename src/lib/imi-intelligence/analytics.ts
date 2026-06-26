/**
 * IMI Intelligence — Analytics Engine (pure functions).
 *
 * Turns a normalized sales dataset into executive interpretation: KPIs with
 * deltas, a Broker Performance Index (BPI), a commercial funnel, a forecast
 * with a confidence score, and auto-generated IMI Insights phrases.
 *
 * Pure and deterministic → unit-testable. The server aggregator in
 * ./service.ts feeds it either live event-derived data or a representative
 * dataset.
 */

export interface BrokerStat {
  name: string
  sales: number
  proposals: number
  leads: number
  revenue: number // BRL
  avgResponseMin: number
  activities: number
}

export interface DayPoint {
  date: string // ISO date
  sales: number
  revenue: number
  proposals: number
}

export interface FunnelInput {
  leads: number
  contacts: number
  visits: number
  proposals: number
  reservations: number
  sales: number
}

export interface InventoryInput {
  available: number
  reserved: number
  sold: number
  avgDaysInStock: number
  hottestBlock: string
}

export interface SalesDataset {
  projectName: string
  brokers: BrokerStat[]
  series: DayPoint[] // chronological, most recent last
  funnel: FunnelInput
  inventory: InventoryInput
  vgvTotal: number
  avgClosingDays: number
}

/* ── Money / format helpers ──────────────────────────────────────────────── */
export function brl(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (Math.abs(value) >= 1_000) return `R$ ${Math.round(value / 1000)}K`
  return `R$ ${value.toFixed(0)}`
}
export function pct(value: number): string {
  const s = value > 0 ? '+' : ''
  return `${s}${value.toFixed(1)}%`
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

/* ── Deltas over a trailing window ───────────────────────────────────────── */
export function windowDelta(series: DayPoint[], key: keyof Pick<DayPoint, 'sales' | 'revenue' | 'proposals'>, days = 7): number {
  if (series.length < days * 2) {
    // fall back to halves
    const mid = Math.floor(series.length / 2)
    const prev = sum(series.slice(0, mid).map((d) => d[key] as number))
    const curr = sum(series.slice(mid).map((d) => d[key] as number))
    return prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100
  }
  const curr = sum(series.slice(-days).map((d) => d[key] as number))
  const prev = sum(series.slice(-days * 2, -days).map((d) => d[key] as number))
  return prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100
}

/* ── Broker Performance Index (BPI) ──────────────────────────────────────── */
/**
 * Composite 0–100 score weighting sales volume, conversion, ticket, response
 * speed (inverse) and activity. Normalized against the cohort max.
 */
export function brokerPerformanceIndex(brokers: BrokerStat[]): Array<BrokerStat & { bpi: number; conversion: number; avgTicket: number }> {
  const max = {
    sales: Math.max(...brokers.map((b) => b.sales), 1),
    revenue: Math.max(...brokers.map((b) => b.revenue), 1),
    activities: Math.max(...brokers.map((b) => b.activities), 1),
    response: Math.max(...brokers.map((b) => b.avgResponseMin), 1),
  }
  return brokers
    .map((b) => {
      const conversion = b.leads > 0 ? (b.sales / b.leads) * 100 : 0
      const avgTicket = b.sales > 0 ? b.revenue / b.sales : 0
      const responseScore = 1 - b.avgResponseMin / max.response // faster = higher
      const bpi =
        0.34 * (b.sales / max.sales) +
        0.22 * Math.min(conversion / 30, 1) + // 30% conversion = full marks
        0.18 * (b.revenue / max.revenue) +
        0.14 * responseScore +
        0.12 * (b.activities / max.activities)
      return { ...b, conversion, avgTicket, bpi: Math.round(bpi * 100) }
    })
    .sort((a, b) => b.bpi - a.bpi)
}

/* ── Funnel with stage conversion ────────────────────────────────────────── */
export function buildFunnel(f: FunnelInput) {
  const stages = [
    { key: 'leads', label: 'Leads', value: f.leads },
    { key: 'contacts', label: 'Contato', value: f.contacts },
    { key: 'visits', label: 'Visita', value: f.visits },
    { key: 'proposals', label: 'Proposta', value: f.proposals },
    { key: 'reservations', label: 'Reserva', value: f.reservations },
    { key: 'sales', label: 'Venda', value: f.sales },
  ]
  return stages.map((s, i) => {
    const prev = i === 0 ? s.value : stages[i - 1].value
    const conv = prev > 0 ? (s.value / prev) * 100 : 0
    const ofTop = stages[0].value > 0 ? (s.value / stages[0].value) * 100 : 0
    return { ...s, stepConversion: conv, ofTop }
  })
}

/* ── Predictive forecast with confidence ─────────────────────────────────── */
/**
 * Linear-trend forecast over the series with an R²-derived confidence score.
 * Lightweight on purpose — a hook point for a future ML model.
 */
export function forecast(series: DayPoint[], horizonDays = 30, key: keyof Pick<DayPoint, 'revenue' | 'sales'> = 'revenue') {
  const ys = series.map((d) => d[key] as number)
  const n = ys.length
  if (n < 2) return { total: ys[0] ?? 0, perDay: ys[0] ?? 0, confidence: 0.5, slope: 0 }

  const xs = ys.map((_, i) => i)
  const mx = sum(xs) / n
  const my = sum(ys) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = my - slope * mx

  // R² for confidence
  let ssRes = 0
  let ssTot = 0
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i]
    ssRes += (ys[i] - pred) ** 2
    ssTot += (ys[i] - my) ** 2
  }
  const r2 = ssTot === 0 ? 0.6 : Math.max(0, 1 - ssRes / ssTot)
  const avgPerDay = my
  const projectedPerDay = Math.max(0, intercept + slope * (n + horizonDays / 2))
  const total = Math.round(((projectedPerDay + avgPerDay) / 2) * horizonDays)
  // Confidence blends fit quality with sample size.
  const confidence = Math.min(0.97, 0.5 + 0.4 * r2 + 0.07 * Math.min(n / 30, 1))
  return { total, perDay: projectedPerDay, confidence, slope }
}

/* ── IMI Insights — auto-generated interpretation ────────────────────────── */
export interface Insight {
  kind: 'trend' | 'risk' | 'opportunity' | 'forecast' | 'recommendation'
  severity: 'positive' | 'warning' | 'critical' | 'info'
  title: string
  confidence: number
}

export function generateInsights(ds: SalesDataset): Insight[] {
  const out: Insight[] = []
  const salesDelta = windowDelta(ds.series, 'sales', 7)
  const propDelta = windowDelta(ds.series, 'proposals', 7)
  const ranked = brokerPerformanceIndex(ds.brokers)
  const top = ranked[0]
  const fc = forecast(ds.series, 30, 'revenue')

  out.push({
    kind: 'trend',
    severity: salesDelta >= 0 ? 'positive' : 'warning',
    title:
      salesDelta >= 0
        ? `Vendas cresceram ${pct(salesDelta)} nos últimos 7 dias.`
        : `Vendas recuaram ${pct(salesDelta)} nos últimos 7 dias.`,
    confidence: 0.9,
  })

  if (top) {
    out.push({
      kind: 'opportunity',
      severity: 'positive',
      title: `Corretor destaque: ${top.name} (BPI ${top.bpi}, conversão ${top.conversion.toFixed(0)}%).`,
      confidence: 0.88,
    })
  }

  out.push({
    kind: 'opportunity',
    severity: 'info',
    title: `Maior concentração de demanda: ${ds.inventory.hottestBlock}.`,
    confidence: 0.82,
  })

  out.push({
    kind: 'trend',
    severity: 'info',
    title: `Velocidade média de fechamento: ${ds.avgClosingDays.toFixed(1)} dias.`,
    confidence: 0.85,
  })

  const stockRisk = ds.inventory.available > ds.inventory.sold * 3 ? 'Alto' : ds.inventory.available > ds.inventory.sold ? 'Moderado' : 'Baixo'
  out.push({
    kind: 'risk',
    severity: stockRisk === 'Alto' ? 'warning' : 'positive',
    title: `Risco atual do estoque: ${stockRisk}.`,
    confidence: 0.8,
  })

  if (propDelta < -8) {
    out.push({
      kind: 'risk',
      severity: 'warning',
      title: `Conversão de propostas caiu ${pct(propDelta)} esta semana.`,
      confidence: 0.78,
    })
  }

  out.push({
    kind: 'forecast',
    severity: 'info',
    title: `Previsão de receita (30 dias): ${brl(fc.total)}.`,
    confidence: fc.confidence,
  })

  out.push({
    kind: 'recommendation',
    severity: 'info',
    title:
      ds.inventory.available > ds.inventory.sold
        ? 'Sugestão: priorizar lotes premium para acelerar o giro de estoque.'
        : 'Sugestão: reforçar captação de leads — estoque em ritmo acelerado.',
    confidence: 0.74,
  })

  return out
}
