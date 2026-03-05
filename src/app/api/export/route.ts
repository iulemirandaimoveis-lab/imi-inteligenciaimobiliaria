// GET /api/export?module=leads&format=csv
// GET /api/export?module=financeiro&format=csv&month=2026-03
// GET /api/export?module=avaliacoes&format=csv
// GET /api/export?module=campanhas&format=csv
// GET /api/export?module=contratos&format=csv
// Exports data as CSV — no external dependencies
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCSV(rows: Record<string, unknown>[]): string {
    if (!rows || rows.length === 0) return ''
    const headers = Object.keys(rows[0])
    const escape = (v: unknown): string => {
        if (v === null || v === undefined) return ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
    }
    const lines = [
        headers.map(h => escape(h)).join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(','))
    ]
    return lines.join('\n')
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const moduleName = searchParams.get('module') || 'leads'
        const month = searchParams.get('month') // e.g. '2026-03'

        let rows: Record<string, unknown>[] = []
        let filename = `export-${moduleName}-${new Date().toISOString().split('T')[0]}.csv`

        switch (moduleName) {
            case 'leads': {
                let query = supabase
                    .from('leads')
                    .select('id, name, email, phone, source, utm_source, utm_campaign, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5000)
                if (month) {
                    const start = `${month}-01T00:00:00.000Z`
                    const [y, m] = month.split('-').map(Number)
                    const end = new Date(y, m, 1).toISOString()
                    query = query.gte('created_at', start).lt('created_at', end)
                }
                const { data } = await query
                rows = (data || []) as Record<string, unknown>[]
                filename = `leads-${month || 'todos'}.csv`
                break
            }

            case 'financeiro': {
                let query = supabase
                    .from('financial_transactions')
                    .select('id, type, category, description, amount, date, status, notes, created_at')
                    .order('date', { ascending: false })
                    .limit(5000)
                if (month) {
                    const start = `${month}-01`
                    const [y, m] = month.split('-').map(Number)
                    const endDate = new Date(y, m, 1).toISOString().split('T')[0]
                    query = query.gte('date', start).lt('date', endDate)
                }
                const { data } = await query
                rows = (data || []) as Record<string, unknown>[]
                filename = `financeiro-${month || 'todos'}.csv`
                break
            }

            case 'avaliacoes': {
                let query = supabase
                    .from('avaliacoes')
                    .select('id, protocolo, status, honorarios, honorarios_status, cidade, tipo, data_inicio, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2000)
                if (month) {
                    const start = `${month}-01T00:00:00.000Z`
                    const [y, m] = month.split('-').map(Number)
                    const end = new Date(y, m, 1).toISOString()
                    query = query.gte('created_at', start).lt('created_at', end)
                }
                const { data } = await query
                rows = (data || []) as Record<string, unknown>[]
                filename = `avaliacoes-${month || 'todos'}.csv`
                break
            }

            case 'campanhas': {
                const { data } = await supabase
                    .from('campaigns')
                    .select('id, name, channel, status, budget, spent, leads, clicks, impressions, cost_per_lead, created_at')
                    .order('created_at', { ascending: false })
                    .limit(500)
                rows = (data || []) as Record<string, unknown>[]
                filename = `campanhas-export.csv`
                break
            }

            case 'contratos': {
                const { data } = await supabase
                    .from('contratos')
                    .select('id, numero, categoria, status, idioma, criado_por_nome, criado_em, atualizado_em')
                    .order('criado_em', { ascending: false })
                    .limit(1000)
                rows = (data || []) as Record<string, unknown>[]
                filename = `contratos-export.csv`
                break
            }

            default:
                return NextResponse.json({ error: `Módulo '${module}' não suportado. Use: leads, financeiro, avaliacoes, campanhas, contratos` }, { status: 400 })
        }

        const csv = toCSV(rows)

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (err: unknown) {
        console.error('Export error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
