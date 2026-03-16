import { supabaseAdmin } from '@/lib/supabase/admin'

export async function generateExecutiveReport(params: {
    tenant_id?: string
    report_type?: string
    period_start?: string
    period_end?: string
    generated_by?: string
}) {
    const { report_type = 'geral', period_start, period_end } = params
    const now = new Date()
    const start = period_start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const end = period_end || now.toISOString()

    const [leadsResult, financialResult, contractsResult, followUpsResult] = await Promise.all([
        supabaseAdmin
            .from('leads')
            .select('id, status, source, created_at', { count: 'exact' })
            .gte('created_at', start)
            .lte('created_at', end),
        supabaseAdmin
            .from('financial_transactions')
            .select('id, type, amount, status')
            .gte('created_at', start)
            .lte('created_at', end),
        supabaseAdmin
            .from('contratos')
            .select('id, status, criado_em', { count: 'exact' })
            .gte('criado_em', start)
            .lte('criado_em', end),
        supabaseAdmin
            .from('lead_follow_ups')
            .select('id, status', { count: 'exact' })
            .gte('created_at', start)
            .lte('created_at', end),
    ])

    const leads = leadsResult.data || []
    const transactions = financialResult.data || []
    const contracts = contractsResult.data || []
    const followUps = followUpsResult.data || []

    // Lead metrics
    const totalLeads = leads.length
    const leadsByStatus: Record<string, number> = {}
    const leadsBySource: Record<string, number> = {}
    for (const l of leads) {
        const s = (l as Record<string, unknown>).status as string || 'unknown'
        const src = (l as Record<string, unknown>).source as string || 'direto'
        leadsByStatus[s] = (leadsByStatus[s] || 0) + 1
        leadsBySource[src] = (leadsBySource[src] || 0) + 1
    }

    // Financial metrics
    let totalReceita = 0
    let totalDespesa = 0
    let pendente = 0
    for (const t of transactions) {
        const rec = t as Record<string, unknown>
        const amount = Number(rec.amount) || 0
        if (rec.type === 'receita') totalReceita += amount
        else totalDespesa += amount
        if (rec.status === 'pendente') pendente += amount
    }

    // Follow-up metrics
    const completedFollowUps = followUps.filter(f => (f as Record<string, unknown>).status === 'completed').length
    const pendingFollowUps = followUps.filter(f => (f as Record<string, unknown>).status === 'pending').length

    const report = {
        id: `report_${Date.now()}`,
        status: 'generated',
        type: report_type,
        period: { start, end },
        generated_at: now.toISOString(),
        summary: {
            leads: {
                total: totalLeads,
                by_status: leadsByStatus,
                by_source: leadsBySource,
                conversion_rate: totalLeads > 0
                    ? Math.round((leadsByStatus['converted'] || 0) / totalLeads * 100)
                    : 0,
            },
            financial: {
                receita: Math.round(totalReceita * 100) / 100,
                despesa: Math.round(totalDespesa * 100) / 100,
                saldo: Math.round((totalReceita - totalDespesa) * 100) / 100,
                pendente: Math.round(pendente * 100) / 100,
            },
            contracts: {
                total: contracts.length,
            },
            follow_ups: {
                total: followUps.length,
                completed: completedFollowUps,
                pending: pendingFollowUps,
            },
        },
    }

    return report
}
