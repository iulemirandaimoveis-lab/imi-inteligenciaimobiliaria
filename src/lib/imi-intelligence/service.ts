import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'
import {
  brl,
  brokerPerformanceIndex,
  buildFunnel,
  forecast,
  generateInsights,
  pct,
  windowDelta,
  type DayPoint,
  type Insight,
  type SalesDataset,
} from './analytics'

export interface ExecutiveMetric {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  hint?: string
}

export interface TimelineEvent {
  type: string
  who: string
  text: string
  when: string
  accent: 'sale' | 'proposal' | 'lead' | 'reserve' | 'view'
}

export interface IntelligenceModel {
  projectName: string
  live: boolean
  executive: ExecutiveMetric[]
  series: DayPoint[]
  funnel: ReturnType<typeof buildFunnel>
  brokers: ReturnType<typeof brokerPerformanceIndex>
  inventory: {
    available: number
    reserved: number
    sold: number
    avgDaysInStock: number
    hottestBlock: string
    blocks: Array<{ block: string; available: number; reserved: number; sold: number; demand: number }>
  }
  predictive: {
    revenue30d: string
    sales30d: number
    confidence: number
    vgvForecast: string
    riskLevel: string
  }
  commission: {
    forecast: string
    received: string
    monthlyProjection: string
    ranking: Array<{ name: string; forecast: string; rate: number }>
  }
  insights: Insight[]
  radar: Array<{ metric: string; top: number; team: number }>
}

/** Deterministic representative dataset for Alto Bellevue (seed-shaped). */
function buildRepresentativeDataset(projectName: string): SalesDataset {
  // 30-day series with a gentle upward trend + weekly seasonality.
  const series: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
    const base = 0.6 + i * 0.03
    const season = 1 + 0.25 * Math.sin((i / 7) * Math.PI)
    const sales = Math.max(0, Math.round(base * season * (i % 5 === 0 ? 2 : 1)))
    const today = new Date()
    today.setDate(today.getDate() - (29 - i))
    return {
      date: today.toISOString().slice(0, 10),
      sales,
      revenue: sales * (2_100_000 + (i % 4) * 180_000),
      proposals: Math.max(1, Math.round(sales * 1.6 + (i % 3))),
    }
  })

  const brokers = [
    { name: 'João', sales: 4, proposals: 9, leads: 14, revenue: 9_600_000, avgResponseMin: 8, activities: 64 },
    { name: 'Douglas', sales: 3, proposals: 7, leads: 12, revenue: 7_200_000, avgResponseMin: 11, activities: 52 },
    { name: 'Lucas', sales: 3, proposals: 6, leads: 9, revenue: 6_900_000, avgResponseMin: 6, activities: 58 },
    { name: 'Allysson', sales: 2, proposals: 6, leads: 11, revenue: 4_400_000, avgResponseMin: 13, activities: 41 },
    { name: 'Gustavo', sales: 2, proposals: 5, leads: 10, revenue: 4_100_000, avgResponseMin: 15, activities: 38 },
    { name: 'Anderson', sales: 1, proposals: 4, leads: 8, revenue: 2_200_000, avgResponseMin: 18, activities: 29 },
  ]

  return {
    projectName,
    brokers,
    series,
    funnel: { leads: 142, contacts: 96, visits: 61, proposals: 34, reservations: 14, sales: 11 },
    inventory: { available: 18, reserved: 5, sold: 11, avgDaysInStock: 24, hottestBlock: 'Quadra B' },
    vgvTotal: 78_400_000,
    avgClosingDays: 2.3,
  }
}

/**
 * Assemble the full Intelligence model. Reads imi.events to flip the `live`
 * flag when the event stream has data; analytics still render from the
 * representative dataset until the warehouse aggregation is wired.
 */
export async function getIntelligence(session: ImiSession): Promise<IntelligenceModel> {
  const project = session.projects.find((p) => p.slug === 'alto-bellevue') ?? session.projects[0]
  const projectName = project?.name ?? 'Alto Bellevue'

  let live = false
  try {
    const supabase = await createClient()
    if (project) {
      const { count } = await supabase
        .schema('imi')
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
      live = (count ?? 0) > 0
    }
  } catch {
    live = false
  }

  const ds = buildRepresentativeDataset(projectName)
  const ranked = brokerPerformanceIndex(ds.brokers)
  const fcRevenue = forecast(ds.series, 30, 'revenue')
  const fcSales = forecast(ds.series, 30, 'sales')

  const salesDelta = windowDelta(ds.series, 'sales', 7)
  const revDelta = windowDelta(ds.series, 'revenue', 7)
  const propDelta = windowDelta(ds.series, 'proposals', 7)
  const conversion = (ds.funnel.sales / ds.funnel.leads) * 100

  const executive: ExecutiveMetric[] = [
    { label: 'VGV total', value: brl(ds.vgvTotal), hint: 'valor geral de vendas' },
    { label: 'Receita prevista (30d)', value: brl(fcRevenue.total), delta: pct(revDelta), deltaPositive: revDelta >= 0, hint: `confiança ${(fcRevenue.confidence * 100).toFixed(0)}%` },
    { label: 'Conversão', value: `${conversion.toFixed(1)}%`, delta: pct(salesDelta), deltaPositive: salesDelta >= 0, hint: 'lead → venda' },
    { label: 'Propostas', value: String(ds.funnel.proposals), delta: pct(propDelta), deltaPositive: propDelta >= 0, hint: 'em aberto / período' },
    { label: 'Disponibilidade', value: String(ds.inventory.available), hint: `${ds.inventory.reserved} reservados · ${ds.inventory.sold} vendidos` },
    { label: 'Velocidade comercial', value: `${ds.avgClosingDays.toFixed(1)} dias`, hint: 'tempo médio de fechamento' },
    { label: 'Corretor destaque', value: ranked[0]?.name ?? '—', hint: `BPI ${ranked[0]?.bpi ?? 0}` },
    { label: 'Vendas semanais', value: String(Math.round(ds.series.slice(-7).reduce((a, d) => a + d.sales, 0))), delta: pct(salesDelta), deltaPositive: salesDelta >= 0 },
  ]

  const blocks = [
    { block: 'Quadra A', available: 6, reserved: 1, sold: 3, demand: 62 },
    { block: 'Quadra B', available: 5, reserved: 2, sold: 5, demand: 91 },
    { block: 'Quadra C', available: 4, reserved: 1, sold: 2, demand: 74 },
    { block: 'Quadra D', available: 3, reserved: 1, sold: 1, demand: 48 },
  ]

  const top = ranked[0]
  const teamAvg = {
    sales: ranked.reduce((a, b) => a + b.sales, 0) / ranked.length,
    conversion: ranked.reduce((a, b) => a + b.conversion, 0) / ranked.length,
    bpi: ranked.reduce((a, b) => a + b.bpi, 0) / ranked.length,
    activities: ranked.reduce((a, b) => a + b.activities, 0) / ranked.length,
    response: ranked.reduce((a, b) => a + b.avgResponseMin, 0) / ranked.length,
  }
  const radar = [
    { metric: 'Vendas', top: (top?.sales ?? 0) * 20, team: teamAvg.sales * 20 },
    { metric: 'Conversão', top: top?.conversion ?? 0, team: teamAvg.conversion },
    { metric: 'BPI', top: top?.bpi ?? 0, team: teamAvg.bpi },
    { metric: 'Atividade', top: Math.min(100, (top?.activities ?? 0)), team: Math.min(100, teamAvg.activities) },
    { metric: 'Resposta', top: Math.max(0, 100 - (top?.avgResponseMin ?? 0) * 3), team: Math.max(0, 100 - teamAvg.response * 3) },
  ]

  const riskLevel = ds.inventory.available > ds.inventory.sold * 3 ? 'Alto' : ds.inventory.available > ds.inventory.sold ? 'Moderado' : 'Baixo'

  return {
    projectName,
    live,
    executive,
    series: ds.series,
    funnel: buildFunnel(ds.funnel),
    brokers: ranked,
    inventory: { ...ds.inventory, blocks },
    predictive: {
      revenue30d: brl(fcRevenue.total),
      sales30d: fcSales.total,
      confidence: fcRevenue.confidence,
      vgvForecast: brl(ds.vgvTotal + fcRevenue.total),
      riskLevel,
    },
    commission: {
      forecast: 'R$ 1,28M',
      received: 'R$ 642K',
      monthlyProjection: 'R$ 410K',
      ranking: ranked.slice(0, 5).map((b) => ({ name: b.name, forecast: brl(b.revenue * 0.05 * 0.6), rate: 60 })),
    },
    insights: generateInsights(ds),
    radar,
  }
}
