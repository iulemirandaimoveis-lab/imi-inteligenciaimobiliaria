// =============================================================================
// GET /api/analytics/report — Relatório Unificado de Analytics Próprio
// =============================================================================
// Substitui: GA4 Reports, Looker Studio, CDPs dashboards
//
// Lê exclusivamente de analytics_events (plataforma própria)
// Retorna KPIs, timeline, funil, atribuição, páginas, dispositivos,
// jornadas de visitantes e top CTAs — sem nenhuma dependência de terceiros.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ── Tipo da linha de analytics_events ─────────────────────────────────────────
interface EventRow {
    event_type: string
    event_name: string | null
    session_id: string
    visitor_id: string | null
    page_path: string | null
    page_title: string | null
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_content: string | null
    device_type: string | null
    browser: string | null
    os: string | null
    country: string | null
    city: string | null
    duration_seconds: number | null
    scroll_depth: number | null
    development_slug: string | null
    properties: Record<string, unknown>
    created_at: string
}

export async function GET(request: NextRequest) {
    // Auth obrigatório — dados de analytics são restritos ao backoffice
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const daysAgo = range === '1d' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    const startISO = startDate.toISOString()
    const nowISO   = new Date().toISOString()

    try {
        // Todas as consultas em paralelo para mínima latência
        const [
            kpisResult,
            timelineResult,
            eventsResult,
        ] = await Promise.all([
            // KPIs via função SQL otimizada
            supabaseAdmin.rpc('analytics_events_kpis', {
                p_start_date: startISO,
                p_end_date:   nowISO,
            }),

            // Timeline diária
            supabaseAdmin.rpc('analytics_events_timeline', {
                p_start_date: startISO,
                p_num_days:   daysAgo,
            }),

            // Eventos brutos — para todos os breakdowns client-side
            supabaseAdmin
                .from('analytics_events')
                .select(
                    'event_type, event_name, session_id, visitor_id, ' +
                    'page_path, page_title, utm_source, utm_medium, utm_campaign, utm_content, ' +
                    'device_type, browser, os, country, city, ' +
                    'duration_seconds, scroll_depth, development_slug, ' +
                    'properties, created_at'
                )
                .gte('created_at', startISO)
                .eq('is_bot', false)
                .order('created_at', { ascending: false })
                .limit(15000),
        ])

        const kpis     = (kpisResult.data as Record<string, number> | null) ?? {}
        const timeline = timelineResult.data ?? []
        const events   = (eventsResult.data ?? []) as EventRow[]

        // ── Atribuição por Fonte (UTM Source) ─────────────────────────────────
        const sourceMap: Record<string, { sessions: Set<string>; clicks: number; forms: number }> = {}
        events.forEach(e => {
            const src = e.utm_source || 'direto'
            if (!sourceMap[src]) sourceMap[src] = { sessions: new Set(), clicks: 0, forms: 0 }
            sourceMap[src].sessions.add(e.session_id)
            if (['click', 'cta_click'].includes(e.event_type)) sourceMap[src].clicks++
            if (e.event_type === 'form_submit') sourceMap[src].forms++
        })
        const bySource = Object.entries(sourceMap)
            .map(([source, d]) => ({
                source,
                sessions:   d.sessions.size,
                clicks:     d.clicks,
                forms:      d.forms,
            }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 15)

        // ── Atribuição por Médium ──────────────────────────────────────────────
        const mediumMap: Record<string, number> = {}
        events
            .filter(e => e.event_type === 'page_view')
            .forEach(e => {
                const m = e.utm_medium || 'nenhum'
                mediumMap[m] = (mediumMap[m] || 0) + 1
            })
        const byMedium = Object.entries(mediumMap)
            .map(([medium, views]) => ({ medium, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)

        // ── Atribuição por Campanha ────────────────────────────────────────────
        const campaignMap: Record<string, { sessions: Set<string>; clicks: number }> = {}
        events.filter(e => e.utm_campaign).forEach(e => {
            const c = e.utm_campaign!
            if (!campaignMap[c]) campaignMap[c] = { sessions: new Set(), clicks: 0 }
            campaignMap[c].sessions.add(e.session_id)
            if (['click', 'cta_click'].includes(e.event_type)) campaignMap[c].clicks++
        })
        const byCampaign = Object.entries(campaignMap)
            .map(([campaign, d]) => ({
                campaign,
                sessions: d.sessions.size,
                clicks:   d.clicks,
            }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 15)

        // ── Dispositivos ───────────────────────────────────────────────────────
        const deviceMap: Record<string, number> = {}
        const browserMap: Record<string, number> = {}
        const osMap: Record<string, number> = {}
        events
            .filter(e => e.event_type === 'page_view')
            .forEach(e => {
                const d = e.device_type || 'desktop'
                deviceMap[d] = (deviceMap[d] || 0) + 1
                const b = e.browser || 'other'
                browserMap[b] = (browserMap[b] || 0) + 1
                const o = e.os || 'other'
                osMap[o] = (osMap[o] || 0) + 1
            })
        const totalPV = Object.values(deviceMap).reduce((s, v) => s + v, 0) || 1
        const byDevice = Object.entries(deviceMap)
            .map(([device, count]) => ({
                device,
                count,
                pct: Math.round((count / totalPV) * 100),
            }))
            .sort((a, b) => b.count - a.count)
        const byBrowser = Object.entries(browserMap)
            .map(([browser, count]) => ({ browser, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        const byOS = Object.entries(osMap)
            .map(([os, count]) => ({ os, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)

        // ── Top Páginas ────────────────────────────────────────────────────────
        const pageMap: Record<string, {
            views: number; totalDuration: number; scrollSum: number; scrollCount: number
        }> = {}
        events
            .filter(e => e.event_type === 'page_view' && e.page_path)
            .forEach(e => {
                const p = e.page_path!
                if (!pageMap[p]) pageMap[p] = { views: 0, totalDuration: 0, scrollSum: 0, scrollCount: 0 }
                pageMap[p].views++
                if (e.duration_seconds) pageMap[p].totalDuration += e.duration_seconds
                if (e.scroll_depth) {
                    pageMap[p].scrollSum += e.scroll_depth
                    pageMap[p].scrollCount++
                }
            })
        const topPages = Object.entries(pageMap)
            .map(([page, d]) => ({
                page,
                views:       d.views,
                avgDuration: d.views > 0 ? Math.round(d.totalDuration / d.views) : 0,
                avgScroll:   d.scrollCount > 0 ? Math.round(d.scrollSum / d.scrollCount) : 0,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 20)

        // ── Top Imóveis / Lançamentos ──────────────────────────────────────────
        const propMap: Record<string, number> = {}
        events
            .filter(e => e.event_type === 'page_view' && e.development_slug)
            .forEach(e => { propMap[e.development_slug!] = (propMap[e.development_slug!] || 0) + 1 })
        const topProperties = Object.entries(propMap)
            .map(([slug, views]) => ({ slug, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)

        // ── Top CTAs / Eventos Nomeados ────────────────────────────────────────
        const ctaMap: Record<string, { count: number; sessions: Set<string> }> = {}
        events
            .filter(e => e.event_name && e.event_type !== 'page_view' && e.event_type !== 'engagement')
            .forEach(e => {
                const k = e.event_name!
                if (!ctaMap[k]) ctaMap[k] = { count: 0, sessions: new Set() }
                ctaMap[k].count++
                ctaMap[k].sessions.add(e.session_id)
            })
        const topCTAs = Object.entries(ctaMap)
            .map(([name, d]) => ({
                name,
                total:          d.count,
                uniqueSessions: d.sessions.size,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 20)

        // ── Funil de Conversão ─────────────────────────────────────────────────
        const sessionsSet = new Set(events.filter(e => e.event_type === 'page_view').map(e => e.session_id))
        const engagedSet  = new Set(events.filter(e => e.event_type === 'engagement').map(e => e.session_id))
        const ctaSet      = new Set(events.filter(e => ['click','cta_click'].includes(e.event_type)).map(e => e.session_id))
        const formSet     = new Set(events.filter(e => e.event_type === 'form_submit').map(e => e.session_id))
        const leadSet     = new Set(events.filter(e => e.event_type === 'lead').map(e => e.session_id))
        const funnelBase  = sessionsSet.size || 1
        const funnel = [
            { stage: 'Sessões',       count: sessionsSet.size, pct: 100 },
            { stage: 'Engajamento',   count: engagedSet.size,  pct: Math.round((engagedSet.size / funnelBase) * 100) },
            { stage: 'Clicou no CTA', count: ctaSet.size,      pct: Math.round((ctaSet.size / funnelBase) * 100) },
            { stage: 'Formulário',    count: formSet.size,     pct: Math.round((formSet.size / funnelBase) * 100) },
            { stage: 'Lead',          count: leadSet.size,     pct: Math.round((leadSet.size / funnelBase) * 100) },
        ]

        // ── Geo ────────────────────────────────────────────────────────────────
        const countryMap: Record<string, number> = {}
        const cityMap: Record<string, number> = {}
        events.forEach(e => {
            if (e.country) countryMap[e.country] = (countryMap[e.country] || 0) + 1
            if (e.city) cityMap[e.city] = (cityMap[e.city] || 0) + 1
        })
        const byCountry = Object.entries(countryMap)
            .map(([country, events]) => ({ country, events }))
            .sort((a, b) => b.events - a.events)
            .slice(0, 20)
        const byCity = Object.entries(cityMap)
            .map(([city, events]) => ({ city, events }))
            .sort((a, b) => b.events - a.events)
            .slice(0, 20)

        // ── Comportamento Temporal ─────────────────────────────────────────────
        const hourMap: Record<number, number> = {}
        events
            .filter(e => e.event_type === 'page_view')
            .forEach(e => {
                const h = new Date(e.created_at).getHours()
                hourMap[h] = (hourMap[h] || 0) + 1
            })
        const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: hourMap[h] || 0 }))

        const dowLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const dowMap: Record<number, number> = {}
        events
            .filter(e => e.event_type === 'page_view')
            .forEach(e => {
                const d = new Date(e.created_at).getDay()
                dowMap[d] = (dowMap[d] || 0) + 1
            })
        const byDayOfWeek = Array.from({ length: 7 }, (_, d) => ({ day: dowLabels[d], views: dowMap[d] || 0 }))

        // ── Jornadas de Visitantes ─────────────────────────────────────────────
        const sessionPages: Record<string, Array<{ page: string; ts: string }>> = {}
        events
            .filter(e => e.event_type === 'page_view' && e.page_path)
            .forEach(e => {
                if (!sessionPages[e.session_id]) sessionPages[e.session_id] = []
                sessionPages[e.session_id].push({ page: e.page_path!, ts: e.created_at })
            })
        Object.values(sessionPages).forEach(p => p.sort((a, b) => a.ts.localeCompare(b.ts)))
        const visitorJourneys = Object.entries(sessionPages)
            .filter(([_, p]) => p.length >= 2)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 15)
            .map(([sessionId, pages]) => ({
                session: sessionId.slice(0, 10),
                pages:   pages.length,
                path:    pages.map(p => p.page),
                started: pages[0]?.ts,
            }))

        // ── Fluxos Mais Comuns ─────────────────────────────────────────────────
        const flowMap: Record<string, number> = {}
        Object.values(sessionPages).forEach(pages => {
            for (let i = 0; i < pages.length - 1; i++) {
                const from = pages[i].page
                const to   = pages[i + 1].page
                if (from === to) continue
                const k = `${from} → ${to}`
                flowMap[k] = (flowMap[k] || 0) + 1
            }
        })
        const topFlows = Object.entries(flowMap)
            .map(([flow, count]) => ({ flow, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)

        // ── Feed Recente ───────────────────────────────────────────────────────
        const recentFeed = events.slice(0, 30).map(e => ({
            type:    e.event_type,
            name:    e.event_name,
            page:    e.page_path || '/',
            source:  e.utm_source || 'direto',
            device:  e.device_type || 'desktop',
            country: e.country,
            at:      e.created_at,
        }))

        // ── Ações do Backoffice ────────────────────────────────────────────────
        const backofficeActions = events
            .filter(e => e.event_type === 'backoffice_action')
            .slice(0, 50)
            .map(e => ({
                name:       e.event_name || 'ação',
                page:       e.page_path,
                properties: e.properties,
                at:         e.created_at,
            }))

        // ── Depth de Engajamento ───────────────────────────────────────────────
        // Distribuição de scroll depth nos visitantes
        const scrollBuckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
        events
            .filter(e => e.event_type === 'scroll' && e.scroll_depth)
            .forEach(e => {
                const d = e.scroll_depth!
                if (d <= 25) scrollBuckets['0-25']++
                else if (d <= 50) scrollBuckets['26-50']++
                else if (d <= 75) scrollBuckets['51-75']++
                else scrollBuckets['76-100']++
            })
        const scrollDistribution = Object.entries(scrollBuckets).map(([range, count]) => ({ range, count }))

        return NextResponse.json({
            kpis: {
                pageViews:          kpis.pageViews ?? 0,
                sessions:           kpis.sessions ?? 0,
                visitors:           kpis.visitors ?? 0,
                clicks:             kpis.clicks ?? 0,
                formSubmits:        kpis.formSubmits ?? 0,
                avgDurationSeconds: kpis.avgDurationSeconds ?? 0,
                bounceRate:         kpis.bounceRate ?? 0,
                conversionRate:     sessionsSet.size > 0
                    ? Math.round((leadSet.size / sessionsSet.size) * 100 * 10) / 10
                    : 0,
            },
            timeline,
            funnel,
            bySource,
            byMedium,
            byCampaign,
            byDevice,
            byBrowser,
            byOS,
            topPages,
            topProperties,
            topCTAs,
            byCountry,
            byCity,
            byHour,
            byDayOfWeek,
            scrollDistribution,
            visitorJourneys,
            topFlows,
            recentFeed,
            backofficeActions,
            meta: {
                range,
                daysAgo,
                startDate: startISO,
                generatedAt: nowISO,
                eventsProcessed: events.length,
            },
        })

    } catch (err) {
        console.error('[Analytics/report] Erro:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
