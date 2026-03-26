// POST /api/tracking/whatsapp-click — Records WhatsApp button clicks
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { limiters, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)

    // Rate limit: 30 clicks / 60s per IP
    const rl = await limiters.public(ip)
    if (!rl.success) {
      return NextResponse.json({ ok: true }) // Silently drop — never fail tracking
    }

    const body = await request.json()
    const {
      development_id,
      development_name,
      broker_id,
      broker_name,
      source_page,
      unit_id,
      timestamp,
      user_agent,
      referrer,
      url,
    } = body

    if (!source_page) {
      return NextResponse.json({ ok: true }) // Missing data — silently skip
    }

    await supabaseAdmin.from('whatsapp_click_events').insert({
      development_id: development_id || null,
      development_name: development_name || null,
      broker_id: broker_id || null,
      broker_name: broker_name || null,
      source_page,
      unit_id: unit_id || null,
      ip_address: ip,
      user_agent: user_agent || request.headers.get('user-agent') || '',
      referrer: referrer || null,
      page_url: url || null,
      clicked_at: timestamp || new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail client-side tracking
  }
}
