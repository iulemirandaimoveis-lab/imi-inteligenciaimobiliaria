// src/app/api/bpo/dashboard/route.ts
// ── BPO Dashboard — Aggregate stats across companies ────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const empresaId = searchParams.get('empresa_id')
        const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
        const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()))

        // Date range for current month
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`
        const lastDay = new Date(ano, mes, 0).getDate()
        const endDate = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // 1. Revenue (receitas)
        let receitaQuery = supabaseAdmin
            .from('bpo_transacoes')
            .select('valor')
            .eq('tipo', 'receita')
            .gte('data', startDate)
            .lte('data', endDate)
        if (empresaId) receitaQuery = receitaQuery.eq('empresa_id', empresaId)
        const { data: receitas } = await receitaQuery

        // 2. Expenses (despesas)
        let despesaQuery = supabaseAdmin
            .from('bpo_transacoes')
            .select('valor')
            .eq('tipo', 'despesa')
            .gte('data', startDate)
            .lte('data', endDate)
        if (empresaId) despesaQuery = despesaQuery.eq('empresa_id', empresaId)
        const { data: despesas } = await despesaQuery

        const totalReceita = (receitas || []).reduce((sum, r) => sum + Number(r.valor), 0)
        const totalDespesa = (despesas || []).reduce((sum, d) => sum + Number(d.valor), 0)
        const lucroLiquido = totalReceita - totalDespesa

        // 3. Reconciliation stats
        let concQuery = supabaseAdmin
            .from('bpo_transacoes')
            .select('conciliado', { count: 'exact' })
        if (empresaId) concQuery = concQuery.eq('empresa_id', empresaId)
        concQuery = concQuery.gte('data', startDate).lte('data', endDate)
        const { data: allTx, count: totalTx } = await concQuery

        let conciliadoQuery = supabaseAdmin
            .from('bpo_transacoes')
            .select('id', { count: 'exact' })
            .eq('conciliado', true)
            .gte('data', startDate)
            .lte('data', endDate)
        if (empresaId) conciliadoQuery = conciliadoQuery.eq('empresa_id', empresaId)
        const { count: totalConciliado } = await conciliadoQuery

        const conciliacaoPct = (totalTx && totalTx > 0)
            ? Math.round(((totalConciliado || 0) / totalTx) * 100)
            : 0

        // 4. Pending reconciliation
        let pendQuery = supabaseAdmin
            .from('bpo_conciliacoes')
            .select('id', { count: 'exact' })
            .eq('status', 'pendente')
        if (empresaId) pendQuery = pendQuery.eq('empresa_id', empresaId)
        const { count: pendingReconciliation } = await pendQuery

        // 5. Alerts count
        let alertQuery = supabaseAdmin
            .from('bpo_alertas')
            .select('id, severidade', { count: 'exact' })
            .eq('lido', false)
        if (empresaId) alertQuery = alertQuery.eq('empresa_id', empresaId)
        const { data: alertas, count: alertCount } = await alertQuery

        const alertsBySeverity = {
            critical: (alertas || []).filter(a => a.severidade === 'critical').length,
            warning: (alertas || []).filter(a => a.severidade === 'warning').length,
            info: (alertas || []).filter(a => a.severidade === 'info').length,
        }

        // 6. DRE cache summary
        let dreQuery = supabaseAdmin
            .from('bpo_dre_cache')
            .select('*')
            .eq('mes', mes)
            .eq('ano', ano)
        if (empresaId) dreQuery = dreQuery.eq('empresa_id', empresaId)
        const { data: dreData } = await dreQuery

        // 7. Recent transactions
        let recentQuery = supabaseAdmin
            .from('bpo_transacoes')
            .select('id, descricao, valor, tipo, data, conciliado, categoria_id, origem')
            .order('data', { ascending: false })
            .limit(10)
        if (empresaId) recentQuery = recentQuery.eq('empresa_id', empresaId)
        const { data: recentTx } = await recentQuery

        // 8. Empresas count
        const { count: empresasCount } = await supabaseAdmin
            .from('bpo_empresas')
            .select('id', { count: 'exact' })
            .eq('ativo', true)

        return NextResponse.json({
            periodo: { mes, ano },
            kpis: {
                receita_bruta: totalReceita,
                despesas: totalDespesa,
                lucro_liquido: lucroLiquido,
                conciliacao_pct: conciliacaoPct,
                pending_reconciliation: pendingReconciliation || 0,
                alertas_count: alertCount || 0,
                empresas_ativas: empresasCount || 0,
            },
            alertas: alertsBySeverity,
            dre_summary: dreData?.[0] || null,
            recent_transactions: recentTx || [],
        })
    } catch (err) {
        console.error('[BPO Dashboard]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
