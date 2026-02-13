
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Total Stats
        const [
            { count: totalLeads },
            { count: totalDevelopments },
            { data: developmentsData }
        ] = await Promise.all([
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('developments').select('*', { count: 'exact', head: true }),
            supabase.from('developments').select('price_from, inventory_score')
        ])

        // 2. Leads by Source (Origins)
        const { data: sourceData } = await supabase
            .from('leads')
            .select('source')

        const origins = sourceData?.reduce((acc: any, curr) => {
            const src = curr.source || 'Não Identificado'
            acc[src] = (acc[src] || 0) + 1
            return acc
        }, {})

        const originsFormatted = Object.entries(origins || {}).map(([name, value]) => ({
            name: name === 'site_direto' ? 'Site Direto' : name,
            value
        }))

        // 3. Leads Timeline (Last 6 months)
        const { data: timelineData } = await supabase
            .from('leads')
            .select('created_at')
            .gte('created_at', subMonths(new Date(), 6).toISOString())

        const months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i)
            return format(date, 'MMM/yy')
        }).reverse()

        const timeline = months.map(m => ({ month: m, leads: 0 }))

        timelineData?.forEach(l => {
            const m = format(new Date(l.created_at), 'MMM/yy')
            const index = timeline.findIndex(t => t.month === m)
            if (index !== -1) timeline[index].leads++
        })

        // 4. Inventory Value (VGV) - Estimativa
        const totalVGV = developmentsData?.reduce((acc, dev) => acc + (Number(dev.price_from) || 0), 0) || 0

        return NextResponse.json({
            stats: {
                leads: totalLeads || 0,
                developments: totalDevelopments || 0,
                vgv: totalVGV,
                avgScore: developmentsData?.length
                    ? (developmentsData.reduce((acc, d) => acc + (d.inventory_score || 0), 0) / developmentsData.length).toFixed(1)
                    : 0
            },
            charts: {
                origins: originsFormatted,
                timeline: timeline
            }
        })

    } catch (err: any) {
        console.error('Analytics Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
