// src/app/api/proposals/track/route.ts
// Public endpoint — no auth required (token validates indirectly via proposal_id)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proposal_id, event_type, metadata, time_on_page_seconds, device_type } = body

    if (!proposal_id || !event_type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify proposal exists (basic auth check)
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('id', proposal_id)
      .single()

    if (!proposal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Insert event
    const { error } = await supabase.from('proposal_events').insert({
      proposal_id,
      event_type,
      metadata: metadata ?? {},
      time_on_page_seconds: time_on_page_seconds ?? null,
      device_type: device_type ?? null,
      ip: req.headers.get('x-forwarded-for') ?? req.ip ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
    })

    if (error) throw error

    // Auto update status: sent → viewed
    if (event_type === 'proposal_opened' && proposal.status === 'sent') {
      await supabase
        .from('proposals')
        .update({ status: 'viewed' })
        .eq('id', proposal_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[track]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
