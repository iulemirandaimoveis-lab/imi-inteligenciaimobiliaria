import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        // Fetch all active team members
        const { data: members, error: membersErr } = await supabase
            .from('team_members')
            .select('id, name, email, role, status, total_leads, total_sales, total_revenue, meta_leads_mensal, meta_vendas_mensal, meta_receita_mensal')
            .eq('status', 'active')
            .order('total_revenue', { ascending: false })

        if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

        // Calculate team totals
        const totalLeads = (members || []).reduce((s, m) => s + (m.total_leads || 0), 0)
        const totalSales = (members || []).reduce((s, m) => s + (m.total_sales || 0), 0)
        const totalRevenue = (members || []).reduce((s, m) => s + Number(m.total_revenue || 0), 0)
        const avgConversion = totalLeads > 0 ? Math.round((totalSales / totalLeads) * 100) : 0

        // Build per-member performance data
        const performance = (members || []).map(m => {
            const leads = m.total_leads || 0
            const sales = m.total_sales || 0
            const revenue = Number(m.total_revenue || 0)
            const convRate = leads > 0 ? Math.round((sales / leads) * 100) : 0

            const metaLeads = m.meta_leads_mensal || 0
            const metaVendas = m.meta_vendas_mensal || 0
            const metaReceita = Number(m.meta_receita_mensal || 0)

            return {
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                leads,
                sales,
                revenue,
                conversion_rate: convRate,
                meta_leads: metaLeads,
                meta_vendas: metaVendas,
                meta_receita: metaReceita,
                pct_leads: metaLeads > 0 ? Math.round((leads / metaLeads) * 100) : null,
                pct_vendas: metaVendas > 0 ? Math.round((sales / metaVendas) * 100) : null,
                pct_receita: metaReceita > 0 ? Math.round((revenue / metaReceita) * 100) : null,
            }
        })

        return NextResponse.json({
            team_totals: { totalLeads, totalSales, totalRevenue, avgConversion, memberCount: members?.length || 0 },
            performance,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
