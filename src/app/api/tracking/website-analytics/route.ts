export const dynamic = 'force-dynamic'
// GET /api/tracking/website-analytics — Website visitor analytics (GA4-style)
// Data source: page_views + tracking_sessions tables
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get('time_range') || '30d'
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)
        const startISO = startDate.toISOString()

        // Fetch in parallel for performance
        const [
            pvResult,
            sessResult,
        ] = await Promise.all([
            supabaseAdmin
                .from('page_views')
                .select('id, session_id, page_path, page_url, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, os, country, city, region, duration_seconds, scroll_depth, development_slug, created_at')
                .gte('created_at', startISO)
                .order('created_at', { ascending: false })
                .limit(5000),
            supabaseAdmin
                .from('tracking_sessions')
                .select('session_id, first_page, last_page, page_count, total_duration, device_type, browser, os, country, city, region, utm_source, utm_medium, utm_campaign, is_bot, started_at, created_at, last_activity_at, visitor_fingerprint, is_return_visit')
                .gte('created_at', startISO)
                .eq('is_bot', false)
                .order('created_at', { ascending: false })
                .limit(3000),
        ])

        const pvs = pvResult.data || []
        const sessions = sessResult.data || []

        // ── KPIs ──────────────────────────────────────────────────────────────
        const totalPageViews = pvs.length
        const totalSessions = sessions.length
        const uniqueSessionIds = new Set(pvs.map(p => p.session_id).filter(Boolean))
        const bounced = sessions.filter(s => (s.page_count ?? 1) <= 1).length
        const bounceRate = totalSessions > 0 ? Math.round((bounced / totalSessions) * 100) : 0
        const avgDuration = totalSessions > 0
            ? Math.round(sessions.reduce((s, se) => s + (se.total_duration ?? 0), 0) / totalSessions)
            : 0
        const avgPages = totalSessions > 0
            ? Math.round((sessions.reduce((s, se) => s + (se.page_count ?? 1), 0) / totalSessions) * 10) / 10
            : 0
        const returnVisitors = sessions.filter(s => s.is_return_visit).length
        const newVisitors = totalSessions - returnVisitors
        const returnRate = totalSessions > 0 ? Math.round((returnVisitors / totalSessions) * 100) : 0

        // ── Daily timeline ────────────────────────────────────────────────────
        const dayMapPV: Record<string, number> = {}
        const dayMapSess: Record<string, number> = {}
        pvs.forEach(p => {
            const day = (p.created_at as string).slice(0, 10)
            dayMapPV[day] = (dayMapPV[day] ?? 0) + 1
        })
        sessions.forEach(s => {
            const day = ((s.started_at || s.created_at) as string).slice(0, 10)
            dayMapSess[day] = (dayMapSess[day] ?? 0) + 1
        })
        const dailyTimeline = []
        for (let i = daysAgo - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            dailyTimeline.push({ day: key, pageViews: dayMapPV[key] ?? 0, sessions: dayMapSess[key] ?? 0 })
        }

        // ── By Device ─────────────────────────────────────────────────────────
        const deviceMap: Record<string, number> = {}
        pvs.forEach(p => { const d = p.device_type ?? 'desktop'; deviceMap[d] = (deviceMap[d] ?? 0) + 1 })
        const byDevice = Object.entries(deviceMap)
            .map(([name, value]) => ({ name, value, pct: totalPageViews > 0 ? Math.round((value / totalPageViews) * 100) : 0 }))
            .sort((a, b) => b.value - a.value)

        // ── By Browser ────────────────────────────────────────────────────────
        const browserMap: Record<string, number> = {}
        pvs.forEach(p => { const b = p.browser ?? 'other'; browserMap[b] = (browserMap[b] ?? 0) + 1 })
        const byBrowser = Object.entries(browserMap)
            .map(([name, value]) => ({ name, value, pct: totalPageViews > 0 ? Math.round((value / totalPageViews) * 100) : 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)

        // ── By OS ─────────────────────────────────────────────────────────────
        const osMap: Record<string, number> = {}
        pvs.forEach(p => { const o = p.os ?? 'other'; osMap[o] = (osMap[o] ?? 0) + 1 })
        const byOS = Object.entries(osMap)
            .map(([name, value]) => ({ name, value, pct: totalPageViews > 0 ? Math.round((value / totalPageViews) * 100) : 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)

        // ── By Country ────────────────────────────────────────────────────────
        const countryMap: Record<string, number> = {}
        // Use sessions (more accurate per visit) when country available, fall back to page_views
        const geoSource = sessions.filter(s => s.country)
        if (geoSource.length > 0) {
            geoSource.forEach(s => { const c = s.country!; countryMap[c] = (countryMap[c] ?? 0) + 1 })
        } else {
            pvs.filter(p => p.country).forEach(p => { const c = p.country!; countryMap[c] = (countryMap[c] ?? 0) + 1 })
        }
        const geoTotal = Object.values(countryMap).reduce((a, b) => a + b, 0)
        const byCountry = Object.entries(countryMap)
            .map(([country, sessions]) => ({ country, sessions, pct: geoTotal > 0 ? Math.round((sessions / geoTotal) * 100) : 0 }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 20)

        // ── By City ───────────────────────────────────────────────────────────
        const cityMap: Record<string, { sessions: number; country: string }> = {}
        const citySrc = sessions.filter(s => s.city)
        if (citySrc.length > 0) {
            citySrc.forEach(s => {
                const key = s.city!
                if (!cityMap[key]) cityMap[key] = { sessions: 0, country: s.country ?? '' }
                cityMap[key].sessions++
            })
        } else {
            pvs.filter(p => p.city).forEach(p => {
                const key = p.city!
                if (!cityMap[key]) cityMap[key] = { sessions: 0, country: p.country ?? '' }
                cityMap[key].sessions++
            })
        }
        const byCity = Object.entries(cityMap)
            .map(([city, d]) => ({ city, sessions: d.sessions, country: d.country }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 15)

        // ── By Traffic Source ─────────────────────────────────────────────────
        const sourceMap: Record<string, { sessions: number; pageViews: number }> = {}
        sessions.forEach(s => {
            const src = s.utm_source ?? classifyReferrer(null)
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, pageViews: 0 }
            sourceMap[src].sessions++
        })
        pvs.forEach(p => {
            const src = p.utm_source ?? classifyReferrer(p.referrer)
            if (!sourceMap[src]) sourceMap[src] = { sessions: 0, pageViews: 0 }
            sourceMap[src].pageViews++
        })
        const bySource = Object.entries(sourceMap)
            .map(([source, d]) => ({ source, ...d }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10)

        // ── Top Pages ─────────────────────────────────────────────────────────
        const pageMap: Record<string, { views: number; totalDuration: number; count: number }> = {}
        pvs.forEach(p => {
            const path = normalizePath(p.page_path ?? p.page_url ?? '/')
            if (!pageMap[path]) pageMap[path] = { views: 0, totalDuration: 0, count: 0 }
            pageMap[path].views++
            if (p.duration_seconds) { pageMap[path].totalDuration += p.duration_seconds; pageMap[path].count++ }
        })
        const topPages = Object.entries(pageMap)
            .map(([path, d]) => ({ path, views: d.views, avgDuration: d.count > 0 ? Math.round(d.totalDuration / d.count) : 0 }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 20)

        // ── Top Entry Pages ───────────────────────────────────────────────────
        const entryMap: Record<string, number> = {}
        sessions.forEach(s => { const p = normalizePath(s.first_page ?? '/'); entryMap[p] = (entryMap[p] ?? 0) + 1 })
        const topEntryPages = Object.entries(entryMap)
            .map(([path, sessions]) => ({ path, sessions }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10)

        // ── Top Exit Pages ────────────────────────────────────────────────────
        const exitMap: Record<string, number> = {}
        sessions.forEach(s => { const p = normalizePath(s.last_page ?? '/'); exitMap[p] = (exitMap[p] ?? 0) + 1 })
        const topExitPages = Object.entries(exitMap)
            .map(([path, sessions]) => ({ path, sessions }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10)

        // ── Top Properties ────────────────────────────────────────────────────
        const propMap: Record<string, number> = {}
        pvs.filter(p => p.development_slug).forEach(p => {
            const slug = p.development_slug!
            propMap[slug] = (propMap[slug] ?? 0) + 1
        })
        const topProperties = Object.entries(propMap)
            .map(([slug, views]) => ({ slug, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)

        // ── By Hour of Day ────────────────────────────────────────────────────
        const hourMap = new Array(24).fill(0)
        pvs.forEach(p => { hourMap[new Date(p.created_at as string).getHours()]++ })
        const byHour = hourMap.map((views, hour) => ({ hour, views }))

        // ── By Day of Week ────────────────────────────────────────────────────
        const dowLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const dowMap = new Array(7).fill(0)
        pvs.forEach(p => { dowMap[new Date(p.created_at as string).getDay()]++ })
        const byDayOfWeek = dowMap.map((views, i) => ({ day: dowLabels[i], views }))

        // ── Recent Visitors Feed ──────────────────────────────────────────────
        const recentVisitors = sessions.slice(0, 30).map(s => ({
            session_id: s.session_id?.slice(0, 12) ?? '???',
            device_type: s.device_type ?? 'desktop',
            browser: s.browser ?? '?',
            os: s.os ?? '?',
            country: s.country,
            city: s.city,
            region: s.region,
            first_page: normalizePath(s.first_page ?? '/'),
            page_count: s.page_count ?? 1,
            total_duration: s.total_duration ?? 0,
            utm_source: s.utm_source,
            is_return_visit: s.is_return_visit ?? false,
            created_at: s.started_at ?? s.created_at,
        }))

        // ── Scroll Depth Distribution ─────────────────────────────────────────
        const scrollBuckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
        pvs.forEach(p => {
            const d = p.scroll_depth ?? 0
            if (d <= 25) scrollBuckets['0-25']++
            else if (d <= 50) scrollBuckets['26-50']++
            else if (d <= 75) scrollBuckets['51-75']++
            else scrollBuckets['76-100']++
        })
        const scrollDepthDist = Object.entries(scrollBuckets).map(([range, views]) => ({ range, views }))

        return NextResponse.json({
            kpis: {
                totalPageViews,
                totalSessions,
                uniqueSessions: uniqueSessionIds.size,
                bounceRate,
                avgDurationSeconds: avgDuration,
                avgPagesPerSession: avgPages,
                newVisitors,
                returnVisitors,
                returnRate,
                hasGeoData: byCountry.length > 0,
            },
            dailyTimeline,
            byDevice,
            byBrowser,
            byOS,
            byCountry,
            byCity,
            bySource,
            topPages,
            topEntryPages,
            topExitPages,
            topProperties,
            byHour,
            byDayOfWeek,
            recentVisitors,
            scrollDepthDist,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

function classifyReferrer(referrer: string | null): string {
    if (!referrer) return 'direto'
    try {
        const host = new URL(referrer).hostname.replace('www.', '')
        if (/google|bing|yahoo|duckduckgo|yandex/i.test(host)) return 'busca orgânica'
        if (/facebook|instagram|linkedin|twitter|tiktok|youtube/i.test(host)) return 'social'
        if (/whatsapp/i.test(host)) return 'whatsapp'
        return host
    } catch { return 'direto' }
}

function normalizePath(path: string): string {
    // Strip query string and trailing slash for grouping
    try {
        const u = new URL(path, 'https://x.com')
        return u.pathname.replace(/\/$/, '') || '/'
    } catch { return path.split('?')[0] || '/' }
}
