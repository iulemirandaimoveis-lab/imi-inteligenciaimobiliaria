// src/app/api/proposals/respond/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proposal_id, action, counter } = body

    if (!proposal_id || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, status, expires_at, validity_until')
      .eq('id', proposal_id)
      .single()

    if (!proposal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check expiry
    const expiry = proposal.validity_until || proposal.expires_at
    if (expiry && new Date(expiry) < new Date()) {
      await supabase.from('proposals').update({ status: 'expired' }).eq('id', proposal_id)
      return NextResponse.json({ error: 'Proposal expired' }, { status: 410 })
    }

    if (action === 'accepted') {
      await supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposal_id)
      await supabase.from('proposal_events').insert({
        proposal_id,
        event_type: 'proposal_accepted',
        metadata: {},
        ip: req.headers.get('x-forwarded-for') ?? null,
      })
    } else if (action === 'countered' && counter) {
      await supabase.from('proposals').update({
        status: 'countered',
        counter_proposal: { ...counter, created_at: new Date().toISOString() },
      }).eq('id', proposal_id)
      await supabase.from('proposal_events').insert({
        proposal_id,
        event_type: 'counter_submitted',
        metadata: counter,
        ip: req.headers.get('x-forwarded-for') ?? null,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[respond]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
