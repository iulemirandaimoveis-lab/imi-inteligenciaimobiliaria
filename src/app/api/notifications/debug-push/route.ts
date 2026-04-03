import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWebPush } from '@/lib/web-push'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Auth check — admin only
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, email, name')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Check VAPID config
    const vapidPublic = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = !!process.env.VAPID_PRIVATE_KEY

    // Check user's push subscriptions
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, created_at, updated_at')
      .eq('user_id', user.id)

    // Check total subscriptions in system
    const { count: totalSubs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })

    // Send test push if user has subscriptions
    let testPushResult = 'no_subscriptions'
    if (subs && subs.length > 0) {
      try {
        await sendWebPush(user.id, {
          title: '🔔 Teste IMI Push',
          body: `Push funcionando para ${profile.name || profile.email}!`,
          url: '/backoffice/hoje',
        })
        testPushResult = 'sent'
      } catch (err) {
        testPushResult = `error: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: profile.email, role: profile.role },
      vapid: { public_key_set: vapidPublic, private_key_set: vapidPrivate },
      subscriptions: {
        user_count: subs?.length ?? 0,
        user_subs: subs?.map(s => ({
          id: s.id,
          endpoint_preview: s.endpoint?.slice(0, 60) + '...',
          updated_at: s.updated_at,
        })) ?? [],
        total_system: totalSubs ?? 0,
        error: subsError?.message,
      },
      test_push: testPushResult,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    )
  }
}
