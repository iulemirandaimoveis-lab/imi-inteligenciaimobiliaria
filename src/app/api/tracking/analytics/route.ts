export const dynamic = 'force-dynamic'

// GET /api/tracking/analytics — Unified tracking analytics for the backoffice
// Combines: page_views + tracking_sessions + link_events + leads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('time_range') || '30d'
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        const startISO = startDate.toISOString()

        // Fetch all data in parallel
        const [
            { data: pageViews },
            { data: sessions },
            { data: linkEvents },
            { data: leads },
            { data: trackedLinks },
        ] = await Promise.all([
            supabase.from('page_views')
                .select('*')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(2000),
            supabase.from('tracking_sessions')
                .select('*')
                .gte('started_at', startISO)
                .eq('is_bot', false)
                .order('started_at', { ascending: false })
                .limit(1000),
            supabase.from('link_events')
                .select('*')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(2000),
            supabase.from('leads')
                .select('id, name, source, utm_source, utm_campaign, development_id, status, created_at')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(500),
            supabase.from('tracked_links')
                .select('id, campaign_name, clicks, short_code, created_at')
                .order('created_at', { ascending: false })
                .limit(100),
        ])

        const pvs = pageViews || []
        const sess = sessions || []
        const evts = linkEvents || []
        const lds = leads || []

        // ── KPIs ──
        const totalPageViews = pvs.length
        const totalSessions = sess.length
        const totalClicks = evts.length
        const totalLeads = lds.length
        const convertedLeads = lds.filter(l => l.status === 'converted' || l.status === 'won').length

        const avgPagesPerSession = totalSessions > 0
            ? Math.round((sess.reduce((s, se) => s + (se.page_count || 0), 0) / totalSessions) * 10) / 10
            : 0
        const avgDuration = totalSessions > 0
            ? Math.round(sess.reduce((s, se) => s + (se.total_duration || 0), 0) / totalSessions)
            : 0
        const bounceRate = totalSessions > 0
            ? Math.round((sess.filter(s => (s.page_count || 0) <= 1).length / totalSessions) * 100)
            : 0
        const conversionRate = totalSessions > 0
            ? parseFloat(((totalLeads / totalSessions) * 100).toFixed(2))
            : 0

        // ── By Day ──
        const dayData: Record<string, { views: number; sessions: number; clicks: number; leads: number }> = {}
        for (let i = daysAgo - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            dayData[key] = { views: 0, sessions: 0, clicks: 0, leads: 0 }
        }
        pvs.forEach(pv => { const d = pv.created_at?.split('T')[0]; if (d && dayData[d]) dayData[d].views++ })
        sess.forEach(s => { const d = s.started_at?.split('T')[0]; if (d && dayData[d]) dayData[d].sessions++ })
        evts.forEach(e => { const d = e.created_at?.split('T')[0]; if (d && dayData[d]) dayData[d].clicks++ })
        lds.forEach(l => { const d = l.created_at?.split('T')[0]; if (d && dayData[d]) dayData[d].leads++ })
        const dailyTimeline = Object.entries(dayData).map(([day, data]) => ({ day, ...data }))

        // ── By Source ──
        const sourceMap: Record<string, { sessions: number; clicks: number; leads: number }> = {}
        sess.forEach(s => {
            const src = s.utm_source || 'direct'
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, clicks: 0, leads: 0 }
            sourceMap[src].sessions++
        })
        evts.forEach(e => {
            const src = e.utm_params?.source || 'direct'
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, clicks: 0, leads: 0 }
            sourceMap[src].clicks++
        })
        lds.forEach(l => {
            const src = l.utm_source || l.source || 'direct'
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, clicks: 0, leads: 0 }
            sourceMap[src].leads++
        })
        const bySource = Object.entries(sourceMap)
            .map(([name, d]) => ({ name, ...d, total: d.sessions + d.clicks }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)

        // ── By Device ──
        const deviceMap: Record<string, number> = {}
        sess.forEach(s => { const d = s.device_type || 'desktop'; deviceMap[d] = (deviceMap[d] || 0) + 1 })
        const byDevice = Object.entries(deviceMap)
            .map(([name, value]) => ({
                name, value,
                percentage: totalSessions > 0 ? Math.round((value / totalSessions) * 100) : 0,
            }))

        // ── Top Pages ──
        const pageMap: Record<string, { views: number; avgDuration: number; totalDuration: number }> = {}
        pvs.forEach(pv => {
            const p = pv.page_path || '/'
            if (!pageMap[p]) pageMap[p] = { views: 0, avgDuration: 0, totalDuration: 0 }
            pageMap[p].views++
            pageMap[p].totalDuration += (pv.duration_seconds || 0)
        })
        const topPages = Object.entries(pageMap)
            .map(([page, d]) => ({
                page,
                views: d.views,
                avgDuration: d.views > 0 ? Math.round(d.totalDuration / d.views) : 0,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 15)

        // ── Top Properties ──
        const propMap: Record<string, number> = {}
        pvs.forEach(pv => {
            if (pv.development_slug) propMap[pv.development_slug] = (propMap[pv.development_slug] || 0) + 1
        })
        const topProperties = Object.entries(propMap)
            .map(([slug, views]) => ({ slug, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)

        // ── Top Campaigns ──
        const campaignMap: Record<string, { clicks: number; leads: number }> = {}
        evts.forEach(e => {
            const c = e.utm_params?.campaign || 'sem_campanha'
            if (!campaignMap[c]) campaignMap[c] = { clicks: 0, leads: 0 }
            campaignMap[c].clicks++
        })
        lds.forEach(l => {
            const c = l.utm_campaign || 'sem_campanha'
            if (!campaignMap[c]) campaignMap[c] = { clicks: 0, leads: 0 }
            campaignMap[c].leads++
        })
        const topCampaigns = Object.entries(campaignMap)
            .map(([campaign, d]) => ({
                campaign,
                clicks: d.clicks,
                leads: d.leads,
                conversionRate: d.clicks > 0 ? parseFloat(((d.leads / d.clicks) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10)

        return NextResponse.json({
            kpis: {
                totalPageViews,
                totalSessions,
                totalClicks,
                totalLeads,
                convertedLeads,
                avgPagesPerSession,
                avgDurationSeconds: avgDuration,
                bounceRate,
                conversionRate,
                totalTrackedLinks: trackedLinks?.length || 0,
            },
            dailyTimeline,
            bySource,
            byDevice,
            topPages,
            topProperties,
            topCampaigns,
        })
    } catch (err: unknown) {
        console.error('Tracking analytics error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
