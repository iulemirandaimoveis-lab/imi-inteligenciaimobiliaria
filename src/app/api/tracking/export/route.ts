export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tracking/export?time_range=30d&format=csv
// Exports tracking data as CSV
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('time_range') || '30d'
    const format = searchParams.get('format') || 'csv'
    const linkId = searchParams.get('link_id') // optional: export single link

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    const startISO = startDate.toISOString()

    // Fetch link events with link info
    let query = supabase
      .from('link_events')
      .select(`
        id, event_type, device_type, browser, os, location, referrer,
        created_at, tracked_link_id, metadata,
        tracked_links!inner(short_code, campaign_name, destination_url, channel)
      `)
      .gte('created_at', startISO)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (linkId) {
      query = query.eq('tracked_link_id', linkId)
    }

    const { data: events, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!events?.length) {
      return NextResponse.json({ error: 'Nenhum dado para exportar' }, { status: 404 })
    }

    if (format === 'csv') {
      // Build CSV
      const headers = [
        'Data', 'Tipo', 'Link', 'Campanha', 'Canal', 'Destino',
        'Dispositivo', 'Navegador', 'SO', 'Cidade', 'Estado', 'País',
        'Referrer',
      ]

      const rows = events.map(evt => {
        const link = evt.tracked_links as any
        const meta = (evt.metadata || {}) as any
        return [
          new Date(evt.created_at).toLocaleString('pt-BR'),
          evt.event_type,
          link?.short_code || '',
          link?.campaign_name || '',
          link?.channel || '',
          link?.destination_url || '',
          evt.device_type || '',
          evt.browser || '',
          evt.os || '',
          meta.city || evt.location || '',
          meta.region || '',
          meta.country || '',
          evt.referrer || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`)
      })

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tracking-export-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({ events, total: events.length })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
