import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ImiSession } from '@/lib/imi-auth/types'
import {
  aggregateCommissions,
  rankBrokerCommissions,
  splitPercents,
  type LedgerLike,
  type CommissionTotals,
  type BrokerCommissionRank,
} from '@/lib/imi-commissions/compute'

export interface LedgerEntry extends LedgerLike {
  id: string
  projectName: string | null
  saleAmount: number
  saleReference: string | null
  computedAt: string
}

export interface CommissionRuleView {
  id: string
  name: string
  baseRate: number
  companyShare: number
  brokerShare: number
  active: boolean
}

export interface CommissionProfileView {
  id: string | null
  userId: string
  name: string
  brokerRate: number | null
  bonusRate: number | null
  targetAmount: number | null
}

export interface CommissionsData {
  totals: CommissionTotals
  split: { company: number; broker: number }
  ranking: BrokerCommissionRank[]
  ledger: LedgerEntry[]
  rules: CommissionRuleView[]
  profiles: CommissionProfileView[]
  canManage: boolean
  hasData: boolean
}

export async function getCommissionsData(session: ImiSession): Promise<CommissionsData> {
  const canManage = session.user.isSuper || session.permissions.includes('commissions.manage' as any)
  const empty: CommissionsData = {
    totals: { forecast: 0, received: 0, companyShare: 0, brokerShare: 0, bonusTotal: 0, count: 0 },
    split: { company: 40, broker: 60 },
    ranking: [],
    ledger: [],
    rules: [],
    profiles: [],
    canManage,
    hasData: false,
  }

  try {
    const supabase = await createClient()
    const imi = supabase.schema('imi')

    const { data: ledgerRows, error: ledgerErr } = await imi
      .from('broker_commissions')
      .select(
        'id, project_id, user_id, sale_amount, sale_reference, commission_total, company_amount, broker_amount, bonus_amount, status, computed_at, ' +
          'project:projects ( name ), broker:users ( full_name )'
      )
      .order('computed_at', { ascending: false })
      .limit(1000)
    if (ledgerErr) return empty

    const ledger: LedgerEntry[] = (ledgerRows ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      brokerName: r.broker?.full_name ?? '—',
      projectName: r.project?.name ?? null,
      saleAmount: Number(r.sale_amount) || 0,
      saleReference: r.sale_reference,
      commissionTotal: Number(r.commission_total) || 0,
      companyAmount: Number(r.company_amount) || 0,
      brokerAmount: Number(r.broker_amount) || 0,
      bonusAmount: Number(r.bonus_amount) || 0,
      status: r.status,
      computedAt: r.computed_at,
    }))

    const totals = aggregateCommissions(ledger)
    const ranking = rankBrokerCommissions(ledger)
    const split = splitPercents(totals)

    // Regras (commissions.read).
    const { data: ruleRows } = await imi
      .from('commission_rules')
      .select('id, name, base_rate, company_share, broker_share, active')
      .order('priority', { ascending: true })
    const rules: CommissionRuleView[] = (ruleRows ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      baseRate: Number(r.base_rate),
      companyShare: Number(r.company_share),
      brokerShare: Number(r.broker_share),
      active: r.active,
    }))

    // Perfis por corretor (gestor edita; corretor vê o seu via RLS).
    const { data: profileRows } = await imi
      .from('commission_profiles')
      .select('id, user_id, broker_rate, bonus_rate, target_amount, user:users ( full_name )')
    const profiles: CommissionProfileView[] = (profileRows ?? []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      name: p.user?.full_name ?? '—',
      brokerRate: p.broker_rate != null ? Number(p.broker_rate) : null,
      bonusRate: p.bonus_rate != null ? Number(p.bonus_rate) : null,
      targetAmount: p.target_amount != null ? Number(p.target_amount) : null,
    }))

    return {
      totals,
      split,
      ranking,
      ledger,
      rules,
      profiles,
      canManage,
      hasData: ledger.length > 0 || rules.length > 0 || profiles.length > 0,
    }
  } catch {
    return empty
  }
}
