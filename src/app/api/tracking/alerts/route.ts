export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tracking/alerts?link_id=xxx — get alert settings for a link
// GET /api/tracking/alerts — get all alert settings for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('link_id')

    let query = supabase
      .from('link_alert_settings')
      .select('*, tracked_links(id, short_code, campaign_name, title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (linkId) {
      query = query.eq('tracked_link_id', linkId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ alerts: data || [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/tracking/alerts — create or update alert settings
// Body: { tracked_link_id, alert_mode, min_clicks_threshold? }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { tracked_link_id, alert_mode, min_clicks_threshold } = body

    if (!tracked_link_id) {
      return NextResponse.json({ error: 'tracked_link_id required' }, { status: 400 })
    }
    if (!['every', 'hourly', 'daily', 'off'].includes(alert_mode)) {
      return NextResponse.json({ error: 'Invalid alert_mode' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('link_alert_settings')
      .upsert({
        tracked_link_id,
        user_id: user.id,
        alert_mode,
        min_clicks_threshold: min_clicks_threshold || 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tracked_link_id,user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ alert: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/tracking/alerts?link_id=xxx — remove alert for a link
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('link_id')
    if (!linkId) return NextResponse.json({ error: 'link_id required' }, { status: 400 })

    const { error } = await supabase
      .from('link_alert_settings')
      .delete()
      .eq('tracked_link_id', linkId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
