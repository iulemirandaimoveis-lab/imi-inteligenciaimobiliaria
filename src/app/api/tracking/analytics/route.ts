export const dynamic = 'force-dynamic'
// GET /api/tracking/analytics — Unified tracking analytics for the backoffice
// Combines: page_views + tracking_sessions + link_events + leads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('time_range') || '30d'
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        const startISO = startDate.toISOString()
        // Fetch KPIs + timeline from SQL, detail data for breakdowns in parallel
        const [
            { data: kpisData },
            { data: timelineData },
            { data: sessions },
            { data: linkEvents },
            { data: leads },
            { data: pageViews },
        ] = await Promise.all([
            supabase.rpc('analytics_kpis', { start_date: startISO }),
            supabase.rpc('analytics_daily_timeline', { start_date: startISO, num_days: daysAgo }),
            supabase.from('tracking_sessions')
                .select('utm_source, device_type')
                .or(`started_at.gte.${startISO},created_at.gte.${startISO}`)
                .eq('is_bot', false)
                .limit(5000),
            supabase.from('link_events')
                .select('id, event_type, utm_params, device_type, browser, os, location, metadata, referrer, tracked_link_id, created_at')
                .gte('created_at', startISO)
                .neq('event_type', 'repeat_click')
                .order('created_at', { ascending: false })
                .limit(2000),
            supabase.from('leads')
                .select('id, source, utm_source, utm_campaign, status, created_at')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(500),
            supabase.from('page_views')
                .select('page_path, duration_seconds, development_slug, created_at')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(2000),
        ])
        const kpis = kpisData || {}
        const dailyTimeline = timelineData || []
        const sess = sessions || []
        const uniqueEvts = linkEvents || []
        const lds = leads || []
        const pvs = pageViews || []
        // Derive conversionRate from SQL KPIs
        const conversionRate = kpis.totalSessions > 0
            ? parseFloat(((kpis.totalLeads / kpis.totalSessions) * 100).toFixed(2))
            : 0
        // ── By Source ──
        const sourceMap: Record<string, { sessions: number; clicks: number; leads: number }> = {}
        sess.forEach(s => {
            const src = s.utm_source || 'direct'
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, clicks: 0, leads: 0 }
            sourceMap[src].sessions++
        })
        uniqueEvts.forEach(e => {
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
        const totalSess = kpis.totalSessions || 1
        const byDevice = Object.entries(deviceMap)
            .map(([name, value]) => ({
                name, value,
                percentage: Math.round((value / totalSess) * 100),
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
        uniqueEvts.forEach(e => {
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
        // ── Recent Access Feed (last 20 unique clicks with geo+device) ──
        const recentFeed = uniqueEvts.slice(0, 20).map(e => ({
            id: e.id,
            device_type: e.device_type || 'desktop',
            browser: e.browser || '?',
            os: e.os || '?',
            location: e.location || e.metadata?.city || null,
            city: e.metadata?.city || null,
            region: e.metadata?.region || null,
            country: e.metadata?.country || null,
            referrer: e.referrer || null,
            created_at: e.created_at,
            tracked_link_id: e.tracked_link_id,
        }))
        // ── By Location (city aggregation) ──
        const locationMap: Record<string, number> = {}
        uniqueEvts.forEach(e => {
            const loc = e.metadata?.city || e.location || 'Desconhecido'
            locationMap[loc] = (locationMap[loc] || 0) + 1
        })
        const byLocation = Object.entries(locationMap)
            .map(([city, clicks]) => ({ city, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10)
        return NextResponse.json({
            kpis: {
                totalPageViews: kpis.totalPageViews || 0,
                totalSessions: kpis.totalSessions || 0,
                totalClicks: kpis.totalClicks || 0,
                totalLeads: kpis.totalLeads || 0,
                convertedLeads: kpis.convertedLeads || 0,
                avgPagesPerSession: kpis.avgPagesPerSession || 0,
                avgDurationSeconds: kpis.avgDurationSeconds || 0,
                bounceRate: kpis.bounceRate || 0,
                conversionRate,
                totalTrackedLinks: kpis.totalTrackedLinks || 0,
            },
            dailyTimeline,
            bySource,
            byDevice,
            byLocation,
            topPages,
            topProperties,
            topCampaigns,
            recentFeed,
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
