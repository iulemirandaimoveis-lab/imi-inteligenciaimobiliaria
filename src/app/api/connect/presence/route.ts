import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Auth check — prevent spoofing
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { status, last_seen_at } = body

    // Use authenticated user.id, not body.user_id (prevents spoofing)
    await supabaseAdmin.from('user_presence').upsert({
      user_id: user.id,
      status: status || 'offline',
      last_seen_at: last_seen_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
