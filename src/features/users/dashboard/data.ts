import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'

export interface KpiSummary {
  available: number
  reserved: number
  sold: number
  vgv: string
  brokersOnline: number
  openProposals: number
}

export interface TeamMember {
  name: string
  role: string
  online: boolean
  initials: string
}

export interface ActivityItem {
  who: string
  action: string
  when: string
  kind: 'sale' | 'proposal' | 'lead' | 'availability'
}

export interface PipelineStage {
  label: string
  count: number
  value: string
}

export interface PerformanceBar {
  name: string
  sales: number
  pct: number
}

export interface AvailabilityRow {
  unit: string
  status: 'available' | 'reserved' | 'sold'
  price: string
}

export interface CommissionBroker {
  name: string
  forecast: string
  received: string
  rate: number
}

export interface CommissionSummary {
  forecast: string
  received: string
  monthlyProjection: string
  companyShare: string
  brokerShare: string
  ranking: CommissionBroker[]
}

export interface DashboardData {
  projectName: string
  projectCity: string
  kpis: KpiSummary
  team: TeamMember[]
  activity: ActivityItem[]
  pipeline: PipelineStage[]
  performance: PerformanceBar[]
  availability: AvailabilityRow[]
  commissions: CommissionSummary
  live: boolean
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/**
 * Representative dashboard model for Alto Bellevue.
 *
 * Team is read live from the `imi` schema when available (broker_profiles +
 * users) so the seed reflects the real corretores. The remaining commercial
 * series (units / proposals / sales) are representative placeholders here —
 * they are wired to the production tables (public.proposals, public.lots, ...)
 * in a follow-up once the console graduates from the foundation phase. This
 * keeps the foundation shippable without touching production data.
 */
export async function getAltoBellevueDashboard(session: ImiSession): Promise<DashboardData> {
  const project = session.projects.find((p) => p.slug === 'alto-bellevue') ?? session.projects[0]
  const projectName = project?.name ?? 'Alto Bellevue'
  // Alto Bellevue fica em Garanhuns, PE (Bairro Magano) — NÃO Gravatá.
  // Ver .claude/ALTO_BELLEVUE_LOCATION.md (localização imutável).
  const projectCity = [project?.city, project?.state].filter(Boolean).join(', ') || 'Garanhuns, PE'

  let team: TeamMember[] = []
  let live = false

  try {
    const supabase = await createClient()
    const imi = supabase.schema('imi')
    if (project) {
      const { data } = await imi
        .from('project_users')
        .select('relation, users ( full_name )')
        .eq('project_id', project.id)
        .limit(24)
      if (data && data.length) {
        live = true
        team = data
          .map((row: any) => ({
            name: row.users?.full_name as string,
            relation: row.relation as string,
          }))
          .filter((r: any) => r.name)
          .map((r: any, i: number) => ({
            name: r.name,
            role:
              r.relation === 'manager'
                ? 'Gerente'
                : r.relation === 'owner'
                  ? 'Proprietário'
                  : 'Corretor',
            online: i % 3 !== 2,
            initials: initials(r.name),
          }))
      }
    }
  } catch {
    // fall through to representative team
  }

  if (team.length === 0) {
    team = [
      { name: 'Mateus', role: 'Gerente' },
      { name: 'Iule Miranda', role: 'Corretor' },
      { name: 'João', role: 'Corretor' },
      { name: 'Allysson', role: 'Corretor' },
      { name: 'Anderson', role: 'Corretor' },
      { name: 'Douglas', role: 'Corretor' },
      { name: 'Gustavo', role: 'Corretor' },
      { name: 'Catel', role: 'Proprietário' },
    ].map((m, i) => ({ ...m, online: i % 3 !== 2, initials: initials(m.name) }))
  }

  const brokersOnline = team.filter((m) => m.online && m.role === 'Corretor').length

  return {
    projectName,
    projectCity,
    live,
    kpis: {
      available: 18,
      reserved: 5,
      sold: 11,
      vgv: 'R$ 78,4M',
      brokersOnline,
      openProposals: 7,
    },
    team,
    activity: [
      { who: 'João', action: 'registrou venda da Casa 14 — R$ 2,4M', when: 'há 4 min', kind: 'sale' },
      { who: 'Allysson', action: 'enviou proposta para a Casa 09', when: 'há 22 min', kind: 'proposal' },
      { who: 'Anderson', action: 'cadastrou novo cliente no pipeline', when: 'há 1 h', kind: 'lead' },
      { who: 'Mateus', action: 'liberou disponibilidade da Casa 31', when: 'há 2 h', kind: 'availability' },
      { who: 'Gustavo', action: 'avançou proposta para negociação', when: 'há 3 h', kind: 'proposal' },
    ],
    pipeline: [
      { label: 'Leads', count: 42, value: '—' },
      { label: 'Qualificados', count: 19, value: '—' },
      { label: 'Propostas', count: 7, value: 'R$ 16,2M' },
      { label: 'Negociação', count: 3, value: 'R$ 7,1M' },
      { label: 'Fechamento', count: 2, value: 'R$ 4,6M' },
    ],
    performance: [
      { name: 'João', sales: 4, pct: 100 },
      { name: 'Douglas', sales: 3, pct: 75 },
      { name: 'Allysson', sales: 2, pct: 50 },
      { name: 'Gustavo', sales: 2, pct: 50 },
      { name: 'Anderson', sales: 1, pct: 25 },
    ],
    availability: [
      { unit: 'Casa 03', status: 'available', price: 'R$ 2,2M' },
      { unit: 'Casa 07', status: 'sold', price: 'R$ 1,9M' },
      { unit: 'Casa 09', status: 'reserved', price: 'R$ 2,6M' },
      { unit: 'Casa 14', status: 'sold', price: 'R$ 2,4M' },
      { unit: 'Casa 22', status: 'available', price: 'R$ 3,1M' },
      { unit: 'Casa 31', status: 'available', price: 'R$ 2,0M' },
    ],
    // Commission Intelligence — derived from imi.broker_commissions /
    // commission_profiles once seeded; representative here (5% rule, 60/40).
    commissions: {
      forecast: 'R$ 1,28M',
      received: 'R$ 642K',
      monthlyProjection: 'R$ 410K',
      companyShare: 'R$ 512K',
      brokerShare: 'R$ 768K',
      ranking: [
        { name: 'João', forecast: 'R$ 288K', received: 'R$ 144K', rate: 60 },
        { name: 'Douglas', forecast: 'R$ 216K', received: 'R$ 108K', rate: 60 },
        { name: 'Lucas', forecast: 'R$ 180K', received: 'R$ 96K', rate: 62 },
        { name: 'Allysson', forecast: 'R$ 144K', received: 'R$ 72K', rate: 60 },
        { name: 'Gustavo', forecast: 'R$ 132K', received: 'R$ 60K', rate: 60 },
      ],
    },
  }
}
