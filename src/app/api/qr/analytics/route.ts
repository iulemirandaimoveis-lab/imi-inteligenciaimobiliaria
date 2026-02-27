import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const developmentId = searchParams.get('development_id')
        const timeRange = searchParams.get('time_range') || '30d'

        const supabase = await createClient()

        const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)

        // Get tracked links for this development (or all)
        let linksQuery = supabase
            .from('tracked_links')
            .select('id, development_id, campaign_name, short_code, clicks, utm_params, created_at')
            .order('created_at', { ascending: false })

        if (developmentId) {
            linksQuery = linksQuery.eq('development_id', developmentId)
        }

        const { data: links, error: linksError } = await linksQuery

        if (linksError) {
            console.error('Error fetching links:', linksError)
            return NextResponse.json({ error: linksError.message }, { status: 500 })
        }

        // Get link events
        let eventsQuery = supabase
            .from('link_events')
            .select('*')
            .gte('created_at', startDate.toISOString())

        if (developmentId && links && links.length > 0) {
            const linkIds = links.map(l => l.id)
            eventsQuery = eventsQuery.in('tracked_link_id', linkIds)
        }

        const { data: events, error: eventsError } = await eventsQuery

        if (eventsError) {
            console.error('Error fetching events:', eventsError)
            // Return empty analytics if events table doesn't exist yet
            return NextResponse.json({
                totalClicks: links?.reduce((s, l) => s + (l.clicks || 0), 0) || 0,
                totalLinks: links?.length || 0,
                clicksBySource: [],
                clicksByDevice: [],
                clicksByDay: [],
                topCampaigns: links?.slice(0, 5).map(l => ({
                    campaign: l.campaign_name,
                    clicks: l.clicks || 0,
                    conversions: 0,
                    conversionRate: 0
                })) || [],
                topLocations: [],
                events: []
            })
        }

        // Aggregate analytics
        const totalClicks = events?.length || 0
        
        // By source
        const sourceCounts: Record<string, number> = {}
        events?.forEach(e => {
            const source = e.utm_params?.source || e.metadata?.utm_source || 'direct'
            sourceCounts[source] = (sourceCounts[source] || 0) + 1
        })
        const clicksBySource = Object.entries(sourceCounts)
            .map(([name, value]) => ({ name, value, percentage: totalClicks > 0 ? Math.round((value / totalClicks) * 100) : 0 }))
            .sort((a, b) => b.value - a.value)

        // By device
        const deviceCounts: Record<string, number> = {}
        events?.forEach(e => {
            const device = e.device_type || 'desktop'
            deviceCounts[device] = (deviceCounts[device] || 0) + 1
        })
        const clicksByDevice = Object.entries(deviceCounts)
            .map(([name, value]) => ({ name, value, percentage: totalClicks > 0 ? Math.round((value / totalClicks) * 100) : 0 }))

        // By day
        const dayMap: Record<string, number> = {}
        events?.forEach(e => {
            const day = e.created_at?.split('T')[0]
            if (day) dayMap[day] = (dayMap[day] || 0) + 1
        })
        const clicksByDay = []
        for (let i = daysAgo - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            clicksByDay.push({ day: key, clicks: dayMap[key] || 0 })
        }

        // Top campaigns
        const campaignMap: Record<string, { clicks: number; conversions: number }> = {}
        events?.forEach(e => {
            const campaign = e.utm_params?.campaign || 'sem_campanha'
            if (!campaignMap[campaign]) campaignMap[campaign] = { clicks: 0, conversions: 0 }
            campaignMap[campaign].clicks++
            if (e.metadata?.converted) campaignMap[campaign].conversions++
        })
        const topCampaigns = Object.entries(campaignMap)
            .map(([campaign, stats]) => ({
                campaign,
                clicks: stats.clicks,
                conversions: stats.conversions,
                conversionRate: stats.clicks > 0 ? parseFloat(((stats.conversions / stats.clicks) * 100).toFixed(1)) : 0
            }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10)

        // Top locations
        const locationMap: Record<string, number> = {}
        events?.forEach(e => {
            const loc = e.location || e.metadata?.city || 'Desconhecido'
            locationMap[loc] = (locationMap[loc] || 0) + 1
        })
        const topLocations = Object.entries(locationMap)
            .map(([city, clicks]) => ({ city, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5)

        return NextResponse.json({
            totalClicks,
            totalLinks: links?.length || 0,
            clicksBySource,
            clicksByDevice,
            clicksByDay,
            topCampaigns,
            topLocations,
        })

    } catch (error: any) {
        console.error('Error in /api/qr/analytics:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
