// GET /api/tracking/session — Get session analytics for the backoffice
// POST /api/tracking/session — Update session duration (heartbeat from client)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        // Auth check — analytics data requires authentication
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('time_range') || '30d'
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)

        // Sessions summary
        const { data: sessions, error } = await supabaseAdmin
            .from('tracking_sessions')
            .select('*')
            .gte('started_at', startDate.toISOString())
            .eq('is_bot', false)
            .order('started_at', { ascending: false })
            .limit(500)

        if (error) throw error

        const totalSessions = sessions?.length || 0
        const avgPages = totalSessions > 0
            ? Math.round((sessions?.reduce((s, se) => s + (se.page_count || 0), 0) || 0) / totalSessions * 10) / 10
            : 0
        const avgDuration = totalSessions > 0
            ? Math.round((sessions?.reduce((s, se) => s + (se.total_duration || 0), 0) || 0) / totalSessions)
            : 0

        // Bounce rate (1 page sessions)
        const bounced = sessions?.filter(s => (s.page_count || 0) <= 1).length || 0
        const bounceRate = totalSessions > 0 ? Math.round((bounced / totalSessions) * 100) : 0

        // By device
        const deviceMap: Record<string, number> = {}
        sessions?.forEach(s => {
            const d = s.device_type || 'desktop'
            deviceMap[d] = (deviceMap[d] || 0) + 1
        })

        // By source
        const sourceMap: Record<string, number> = {}
        sessions?.forEach(s => {
            const src = s.utm_source || 'direct'
            sourceMap[src] = (sourceMap[src] || 0) + 1
        })

        // Sessions per day
        const dayMap: Record<string, number> = {}
        sessions?.forEach(s => {
            const day = s.started_at?.split('T')[0]
            if (day) dayMap[day] = (dayMap[day] || 0) + 1
        })
        const sessionsByDay = []
        for (let i = daysAgo - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            sessionsByDay.push({ day: key, sessions: dayMap[key] || 0 })
        }

        // Top entry pages
        const entryMap: Record<string, number> = {}
        sessions?.forEach(s => {
            const p = s.first_page || '/'
            entryMap[p] = (entryMap[p] || 0) + 1
        })
        const topEntryPages = Object.entries(entryMap)
            .map(([page, count]) => ({ page, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return NextResponse.json({
            totalSessions,
            avgPagesPerSession: avgPages,
            avgDurationSeconds: avgDuration,
            bounceRate,
            byDevice: Object.entries(deviceMap).map(([name, value]) => ({
                name, value,
                percentage: totalSessions > 0 ? Math.round((value / totalSessions) * 100) : 0,
            })),
            bySource: Object.entries(sourceMap).map(([name, value]) => ({
                name, value,
                percentage: totalSessions > 0 ? Math.round((value / totalSessions) * 100) : 0,
            })).sort((a, b) => b.value - a.value),
            sessionsByDay,
            topEntryPages,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Session analytics error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// Heartbeat — update session duration
export async function POST(request: NextRequest) {
    try {
        const { sessionId, duration, scrollDepth, pagePath } = await request.json()
        if (!sessionId) return NextResponse.json({ ok: true })

        await supabaseAdmin
            .from('tracking_sessions')
            .update({
                total_duration: duration ? Number(duration) : 0,
                last_activity_at: new Date().toISOString(),
                last_page: pagePath || undefined,
            })
            .eq('session_id', sessionId)

        // Also update the latest page_view duration
        if (duration && pagePath) {
            const { data: latestView } = await supabaseAdmin
                .from('page_views')
                .select('id')
                .eq('session_id', sessionId)
                .eq('page_path', pagePath)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (latestView) {
                await supabaseAdmin
                    .from('page_views')
                    .update({
                        duration_seconds: Number(duration),
                        scroll_depth: scrollDepth ? Number(scrollDepth) : 0,
                    })
                    .eq('id', latestView.id)
            }
        }

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: true })
    }
}
