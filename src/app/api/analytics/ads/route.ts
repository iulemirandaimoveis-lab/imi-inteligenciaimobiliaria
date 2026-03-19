import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, format, startOfDay } from 'date-fns'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // 1. Get stats for last 30 days
        const { data: metrics } = await supabase
            .from('ads_metrics')
            .select('*')
            .gte('date', subDays(new Date(), 30).toISOString())
            .order('date', { ascending: true })
        // 2. Aggregate by date
        const timelineObj = metrics?.reduce((acc: Record<string, { date: string; spend: number; conversions: number }>, curr) => {
            const date = format(new Date(curr.date), 'dd/MM')
            if (!acc[date]) {
                acc[date] = { date, spend: 0, conversions: 0 }
            }
            acc[date].spend += Number(curr.spend) || 0
            acc[date].conversions += Number(curr.conversions) || 0
            return acc
        }, {})
        const timeline = Object.values(timelineObj || {}).sort((a: { date: string }, b: { date: string }) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        // 3. Campaign summary
        const { data: campaigns } = await supabase
            .from('ads_campaigns_summary')
            .select('*')
        return NextResponse.json({
            timeline,
            campaigns
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
