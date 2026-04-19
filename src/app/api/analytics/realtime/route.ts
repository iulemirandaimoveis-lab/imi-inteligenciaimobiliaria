// =============================================================================
// GET /api/analytics/realtime — Visitantes Ativos em Tempo Real
// =============================================================================
// Substitui: GA4 Real-Time, Plausible Live Visitors, Hotjar Live Feed
//
// Retorna:
//   • Sessões ativas nos últimos 5 min
//   • Visitantes únicos nos últimos 5 min
//   • Sessões ao vivo (último 1 min)
//   • Top páginas em tempo real
//   • Top fontes de tráfego
//   • Feed ao vivo (últimos 20 eventos)
//   • Breakdown por país
//   • Breakdown por device
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AnalyticsEventRow {
    id: string
    session_id: string
    visitor_id: string | null
    event_type: string
    event_name: string | null
    page_path: string | null
    page_title: string | null
    utm_source: string | null
    country: string | null
    device_type: string | null
    browser: string | null
    created_at: string
}

interface HourlyEventRow {
    created_at: string
    session_id: string
}

export async function GET(request: NextRequest) {
    // Auth check — dados de real-time são apenas para o backoffice
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const now = new Date()
        const fiveMinAgo  = new Date(now.getTime() - 5  * 60 * 1000).toISOString()
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
        const oneHourAgo  = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

        // Busca paralela para performance máxima
        const [
            { data: recentRaw },
            { data: hourlyRaw },
        ] = await Promise.all([
            // Últimos 30 min — base para métricas de real-time
            supabaseAdmin
                .from('analytics_events')
                .select(
                    'id, session_id, visitor_id, event_type, event_name, ' +
                    'page_path, page_title, utm_source, country, device_type, ' +
                    'browser, created_at'
                )
                .gte('created_at', thirtyMinAgo)
                .eq('is_bot', false)
                .order('created_at', { ascending: false })
                .limit(2000),

            // Última hora — para sparkline de atividade
            supabaseAdmin
                .from('analytics_events')
                .select('created_at, session_id')
                .gte('created_at', oneHourAgo)
                .eq('is_bot', false)
                .limit(5000),
        ])

        const recent = (recentRaw ?? []) as AnalyticsEventRow[]
        const hourly = (hourlyRaw ?? []) as HourlyEventRow[]

        // ── Sessões / Visitantes Ativos ────────────────────────────────────────
        const fiveMinEvents  = recent.filter(e => e.created_at >= fiveMinAgo)
        const activeSessions = new Set(fiveMinEvents.map(e => e.session_id)).size
        const activeVisitors = new Set(
            fiveMinEvents.filter(e => e.visitor_id).map(e => e.visitor_id)
        ).size

        // "Ao vivo agora" — sessões com evento no último 1 min
        const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString()
        const liveNow = new Set(
            recent.filter(e => e.created_at >= oneMinAgo).map(e => e.session_id)
        ).size

        // ── Top Páginas (últimos 5 min) ────────────────────────────────────────
        const pageMap: Record<string, { path: string; title: string | null; views: number }> = {}
        fiveMinEvents
            .filter(e => e.event_type === 'page_view' && e.page_path)
            .forEach(e => {
                const p = e.page_path!
                if (!pageMap[p]) pageMap[p] = { path: p, title: e.page_title, views: 0 }
                pageMap[p].views++
            })
        const topPages = Object.values(pageMap)
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)

        // ── Top Fontes (últimos 5 min) ─────────────────────────────────────────
        const sourceMap: Record<string, number> = {}
        fiveMinEvents
            .filter(e => e.event_type === 'page_view')
            .forEach(e => {
                const src = e.utm_source || 'direto'
                sourceMap[src] = (sourceMap[src] || 0) + 1
            })
        const topSources = Object.entries(sourceMap)
            .map(([source, sessions]) => ({ source, sessions }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 8)

        // ── Por País (últimos 5 min) ───────────────────────────────────────────
        const countryMap: Record<string, number> = {}
        fiveMinEvents.forEach(e => {
            if (e.country) countryMap[e.country] = (countryMap[e.country] || 0) + 1
        })
        const byCountry = Object.entries(countryMap)
            .map(([country, events]) => ({ country, events }))
            .sort((a, b) => b.events - a.events)
            .slice(0, 15)

        // ── Por Device (últimos 5 min) ─────────────────────────────────────────
        const deviceMap: Record<string, number> = {}
        fiveMinEvents.forEach(e => {
            const d = e.device_type || 'desktop'
            deviceMap[d] = (deviceMap[d] || 0) + 1
        })
        const byDevice = Object.entries(deviceMap)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count)

        // ── Atividade por Minuto (última hora) ────────────────────────────────
        // Agrupa por minuto para sparkline
        const minuteMap: Record<string, number> = {}
        hourly.forEach(e => {
            const minute = e.created_at.slice(0, 16) // "2026-04-14T10:35"
            minuteMap[minute] = (minuteMap[minute] || 0) + 1
        })
        // Preenche todos os minutos da última hora
        const activityByMinute: Array<{ minute: string; events: number }> = []
        for (let i = 59; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 60 * 1000)
            const key = d.toISOString().slice(0, 16)
            activityByMinute.push({ minute: key, events: minuteMap[key] || 0 })
        }

        // ── Feed Ao Vivo (últimos 25 eventos) ─────────────────────────────────
        const eventTypeLabels: Record<string, string> = {
            page_view:         'Visualizou página',
            cta_click:         'Clicou no CTA',
            form_submit:       'Enviou formulário',
            scroll:            'Scroll',
            engagement:        'Engajamento',
            external_link:     'Link externo',
            lead:              'Lead gerado',
            backoffice_action: 'Ação no backoffice',
            click:             'Clique',
            custom:            'Evento customizado',
        }
        const liveFeed = recent.slice(0, 25).map(e => ({
            id:       e.id,
            session:  e.session_id.slice(0, 8),
            type:     e.event_type,
            label:    eventTypeLabels[e.event_type] || e.event_type,
            name:     e.event_name || null,
            page:     e.page_path || '/',
            country:  e.country,
            device:   e.device_type || 'desktop',
            browser:  e.browser,
            at:       e.created_at,
        }))

        // ── Métricas dos Últimos 30 Min ────────────────────────────────────────
        const last30Sessions = new Set(recent.map(e => e.session_id)).size
        const last30PageViews = recent.filter(e => e.event_type === 'page_view').length
        const last30Clicks    = recent.filter(e => ['click','cta_click'].includes(e.event_type)).length
        const last30Forms     = recent.filter(e => e.event_type === 'form_submit').length

        return NextResponse.json({
            // Agora (últimos 5 min)
            activeSessions,
            activeVisitors,
            liveNow,

            // Métricas 30 min
            last30: {
                sessions:  last30Sessions,
                pageViews: last30PageViews,
                clicks:    last30Clicks,
                formSubmits: last30Forms,
            },

            // Breakdowns
            topPages,
            topSources,
            byCountry,
            byDevice,

            // Gráfico de atividade
            activityByMinute: activityByMinute.slice(-30), // últimos 30 min

            // Feed ao vivo
            liveFeed,

            updatedAt: now.toISOString(),
        })

    } catch (err) {
        console.error('[Analytics/realtime] Erro:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
