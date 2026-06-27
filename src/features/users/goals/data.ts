import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'
import { inPeriod, summarize, progressPct } from '@/lib/imi-goals/compute'

export interface GoalView {
  id: string
  projectId: string
  scope: 'team' | 'individual'
  title: string | null
  subjectName: string
  teamId: string | null
  userId: string | null
  periodStart: string
  periodEnd: string
  targetAmount: number
  realized: number
  salesCount: number
  avgTicket: number
  progressPct: number
  mock: boolean
}

export interface RankingRow {
  userId: string
  name: string
  realized: number
  salesCount: number
  avgTicket: number
}

export interface GoalsData {
  teamGoals: GoalView[]
  individualGoals: GoalView[]
  ranking: RankingRow[]
  canManage: boolean
  hasData: boolean
}

interface ApprovedSale {
  brokerId: string
  brokerName: string
  projectId: string
  amount: number
  when: string // ISO date used for period matching (reviewed_at ?? created_at)
}

/**
 * Loads goals visible to the session and computes "realizado" from APPROVED
 * proposals (imi.proposals) — closing the loop Propostas → Vendas → Metas.
 */
export async function getGoalsData(session: ImiSession): Promise<GoalsData> {
  const canManage =
    session.user.isSuper || session.permissions.includes('teams.manage' as any)

  const empty: GoalsData = {
    teamGoals: [],
    individualGoals: [],
    ranking: [],
    canManage,
    hasData: false,
  }

  try {
    const supabase = await createClient()
    const imi = supabase.schema('imi')

    const { data: goalRows, error: goalErr } = await imi
      .from('goals')
      .select(
        'id, project_id, scope, team_id, user_id, title, period_start, period_end, target_amount, mock, ' +
          'team:teams ( name ), user:users ( full_name )'
      )
      .order('period_end', { ascending: false })
    if (goalErr) return empty

    // Approved proposals (the source of "realizado"). RLS scopes them.
    const { data: propRows } = await imi
      .from('proposals')
      .select('broker_id, project_id, total_amount, reviewed_at, created_at, status, broker:users!proposals_broker_id_fkey ( full_name )')
      .eq('status', 'approved')
      .limit(2000)

    const sales: ApprovedSale[] = (propRows ?? []).map((p: any) => ({
      brokerId: p.broker_id,
      brokerName: p.broker?.full_name ?? '—',
      projectId: p.project_id,
      amount: p.total_amount != null ? Number(p.total_amount) : 0,
      when: p.reviewed_at ?? p.created_at,
    }))

    // Team membership map (team_id → member user ids).
    const teamIds = Array.from(new Set((goalRows ?? []).filter((g: any) => g.team_id).map((g: any) => g.team_id)))
    let membersByTeam: Record<string, string[]> = {}
    if (teamIds.length) {
      const { data: memberRows } = await imi
        .from('team_members')
        .select('team_id, user_id')
        .in('team_id', teamIds)
      membersByTeam = (memberRows ?? []).reduce((acc: Record<string, string[]>, r: any) => {
        ;(acc[r.team_id] ??= []).push(r.user_id)
        return acc
      }, {})
    }

    const buildView = (g: any): GoalView => {
      let scopedSales: ApprovedSale[]
      if (g.scope === 'team') {
        const memberIds = new Set(membersByTeam[g.team_id] ?? [])
        scopedSales = sales.filter(
          (s) => s.projectId === g.project_id && memberIds.has(s.brokerId) && inPeriod(s.when, g.period_start, g.period_end)
        )
      } else {
        scopedSales = sales.filter(
          (s) => s.brokerId === g.user_id && inPeriod(s.when, g.period_start, g.period_end)
        )
      }
      const { realized, salesCount, avgTicket } = summarize(scopedSales)
      const target = Number(g.target_amount) || 0
      return {
        id: g.id,
        projectId: g.project_id,
        scope: g.scope,
        title: g.title,
        subjectName: g.scope === 'team' ? g.team?.name ?? 'Equipe' : g.user?.full_name ?? 'Corretor',
        teamId: g.team_id,
        userId: g.user_id,
        periodStart: g.period_start,
        periodEnd: g.period_end,
        targetAmount: target,
        realized,
        salesCount,
        avgTicket,
        progressPct: progressPct(realized, target),
        mock: g.mock,
      }
    }

    const views = (goalRows ?? []).map(buildView)
    const teamGoals = views.filter((v) => v.scope === 'team')
    const individualGoals = views.filter((v) => v.scope === 'individual').sort((a, b) => b.realized - a.realized)

    // Ranking geral (todos os corretores com vendas aprovadas visíveis).
    const byBroker = new Map<string, ApprovedSale[]>()
    for (const s of sales) {
      ;(byBroker.get(s.brokerId) ?? byBroker.set(s.brokerId, []).get(s.brokerId)!).push(s)
    }
    const ranking: RankingRow[] = Array.from(byBroker.entries())
      .map(([userId, list]) => {
        const { realized, salesCount, avgTicket } = summarize(list)
        return { userId, name: list[0]?.brokerName ?? '—', realized, salesCount, avgTicket }
      })
      .sort((a, b) => b.realized - a.realized)

    return {
      teamGoals,
      individualGoals,
      ranking,
      canManage,
      hasData: views.length > 0 || ranking.length > 0,
    }
  } catch {
    return empty
  }
}
