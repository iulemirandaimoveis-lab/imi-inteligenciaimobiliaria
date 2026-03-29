import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, status, last_seen_at } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    await supabaseAdmin.from('user_presence').upsert({
      user_id,
      status: status || 'offline',
      last_seen_at: last_seen_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
