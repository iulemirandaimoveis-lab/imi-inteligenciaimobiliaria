import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const developmentId = searchParams.get('id')
    const timeRange = searchParams.get('range') || '30d'

    if (!developmentId) {
        return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const sinceISO = sinceDate.toISOString()

    try {
        const supabase = await createClient()
        // 1. Get development info
        const { data: development } = await supabase
            .from('developments')
            .select('id, name, slug, city, state, neighborhood')
            .eq('id', developmentId)
            .single()

        // 2. Get tracked links for this development
        const { data: trackedLinks } = await supabase
            .from('tracking_links')
            .select('id, campaign_name, clicks, utm_params, created_at')
            .eq('development_id', developmentId)

        const linkIds = (trackedLinks || []).map(l => l.id)
        const totalClicks = (trackedLinks || []).reduce((sum, l) => sum + (l.clicks || 0), 0)

        // 3. Get link events for these tracked links within time range
        let events: any[] = []
        if (linkIds.length > 0) {
            const { data: eventsData } = await supabase
                .from('link_events')
                .select('id, tracked_link_id, event_type, utm_params, device_type, location, created_at, metadata')
                .in('tracked_link_id', linkIds)
                .gte('created_at', sinceISO)
                .order('created_at', { ascending: true })

            events = eventsData || []
        }

        // 4. Get leads for this development within time range
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, source, utm_source, status, created_at')
            .eq('development_id', developmentId)
            .gte('created_at', sinceISO)
            .order('created_at', { ascending: true })

        const totalLeads = (leads || []).length
        const convertedLeads = (leads || []).filter(l =>
            l.status === 'converted' || l.status === 'qualified' || l.status === 'won'
        ).length

        // 5. Compute daily performance
        const dailyMap: Record<string, { views: number; clicks: number; leads: number }> = {}
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (days - 1 - i))
            const key = d.toISOString().split('T')[0]
            dailyMap[key] = { views: 0, clicks: 0, leads: 0 }
        }

        events.forEach(e => {
            const day = new Date(e.created_at).toISOString().split('T')[0]
            if (dailyMap[day]) {
                dailyMap[day].clicks++
                if (e.event_type === 'view' || e.event_type === 'pageview') {
                    dailyMap[day].views++
                }
            }
        });

        (leads || []).forEach(l => {
            const day = new Date(l.created_at).toISOString().split('T')[0]
            if (dailyMap[day]) {
                dailyMap[day].leads++
            }
        })

        const performanceTemporal = Object.entries(dailyMap).map(([date, data]) => ({
            date,
            views: data.clicks, // In tracking, each click = a view
            clicks: data.clicks,
            leads: data.leads,
        }))

        // 6. Traffic sources from UTM params
        const sourceMap: Record<string, number> = {}
        events.forEach(e => {
            const src = e.utm_params?.utm_source || 'Direto'
            sourceMap[src] = (sourceMap[src] || 0) + 1
        });
        // Also count lead sources
        (leads || []).forEach(l => {
            const src = l.utm_source || l.source || 'Direto'
            sourceMap[src] = (sourceMap[src] || 0) + 1
        })

        const totalSourceHits = Object.values(sourceMap).reduce((s, v) => s + v, 0) || 1
        const fontesTrafico = Object.entries(sourceMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([source, visits]) => ({
                source: formatSourceName(source),
                visits,
                percentage: Math.round((visits / totalSourceHits) * 1000) / 10,
            }))

        // 7. Device breakdown
        const deviceMap: Record<string, number> = {}
        events.forEach(e => {
            const device = e.device_type || 'desktop'
            deviceMap[device] = (deviceMap[device] || 0) + 1
        })

        // 8. Location breakdown
        const locationMap: Record<string, number> = {}
        events.forEach(e => {
            const loc = e.location || 'Desconhecido'
            locationMap[loc] = (locationMap[loc] || 0) + 1
        })

        const totalLocHits = Object.values(locationMap).reduce((s, v) => s + v, 0) || 1
        const topLocations = Object.entries(locationMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([city, count]) => ({
                city,
                percentage: Math.round((count / totalLocHits) * 100),
            }))

        // 9. Campaign breakdown
        const campaignMap: Record<string, { clicks: number; leads: number }> = {};
        (trackedLinks || []).forEach(link => {
            const name = link.campaign_name || 'Sem campanha'
            if (!campaignMap[name]) campaignMap[name] = { clicks: 0, leads: 0 }
            campaignMap[name].clicks += link.clicks || 0
        })

        const topCampaigns = Object.entries(campaignMap)
            .sort((a, b) => b[1].clicks - a[1].clicks)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                clicks: data.clicks,
                leads: data.leads,
            }))

        return NextResponse.json({
            development: development || { id: developmentId, name: 'Imóvel' },
            kpis: {
                totalClicks,
                totalEvents: events.length,
                totalLeads,
                convertedLeads,
                taxaConversao: totalClicks > 0
                    ? Math.round((totalLeads / totalClicks) * 1000) / 10
                    : 0,
                trackedLinksCount: (trackedLinks || []).length,
            },
            performanceTemporal,
            fontesTrafico,
            devices: deviceMap,
            topLocations,
            topCampaigns,
            timeRange,
        })
    } catch (err: any) {
        console.error('Development Analytics Error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}

function formatSourceName(source: string): string {
    const map: Record<string, string> = {
        instagram: 'Instagram',
        facebook: 'Facebook',
        google: 'Google',
        whatsapp: 'WhatsApp',
        email: 'Email Marketing',
        linkedin: 'LinkedIn',
        direct: 'Acesso Direto',
        Direto: 'Acesso Direto',
        qrcode: 'QR Code',
        placa: 'Placa Física',
        referral: 'Indicação',
    }
    return map[source] || source.charAt(0).toUpperCase() + source.slice(1)
}
