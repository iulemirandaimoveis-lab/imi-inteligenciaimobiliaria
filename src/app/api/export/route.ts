// GET /api/export?module=leads&format=csv
// GET /api/export?module=financeiro&format=csv&month=2026-03
// GET /api/export?module=avaliacoes&format=csv
// GET /api/export?module=campanhas&format=csv
// GET /api/export?module=contratos&format=csv
// GET /api/export?module=leads&format=pdf
// Exports data as CSV or PDF (HTML print-ready) — no external dependencies
export const dynamic = 'force-dynamic'
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
                    .select('id, type, category, description, amount, due_date, paid_date, status, payment_method, notes, created_at')
                    .order('due_date', { ascending: false })
                    .limit(5000)
                if (month) {
                    const start = `${month}-01`
                    const [y, m] = month.split('-').map(Number)
                    const endDate = new Date(y, m, 1).toISOString().split('T')[0]
                    query = query.gte('due_date', start).lt('due_date', endDate)
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
                return NextResponse.json({ error: `Módulo '${moduleName}' não suportado. Use: leads, financeiro, avaliacoes, campanhas, contratos` }, { status: 400 })
        }
        const format = searchParams.get('format') || 'csv'
        if (format === 'pdf') {
            const pdfFilename = filename.replace('.csv', '.html')
            const headers = rows.length > 0 ? Object.keys(rows[0]) : []
            const moduleLabel = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
            const dateStr = new Date().toLocaleDateString('pt-BR')
            const tableRows = rows.map(row =>
                `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
            ).join('\n')
            const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório ${moduleLabel} — IMI</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 24px; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a1a1a; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; max-width: 200px; }
  tr:nth-child(even) td { background: #f9fafb; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Relatório de ${moduleLabel}</h1>
<div class="meta">Exportado em ${dateStr} · ${rows.length} registro${rows.length !== 1 ? 's' : ''} · IMI Inteligência Imobiliária</div>
<table>
<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`
            return new NextResponse(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Disposition': `inline; filename="${pdfFilename}"`,
                    'Cache-Control': 'no-store',
                },
            })
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
