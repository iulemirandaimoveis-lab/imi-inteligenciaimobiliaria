import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy import to avoid build-time crashes when web-push native deps aren't available
async function getWebPush() {
    const wp = await import('web-push')
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    const privateKey = process.env.VAPID_PRIVATE_KEY || ''
    if (publicKey && privateKey) {
        wp.default.setVapidDetails(
            'mailto:contato@iulemirandaimoveis.com.br',
            publicKey,
            privateKey
        )
    }
    return wp.default
}

// POST — Subscribe to push notifications
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { subscription } = await req.json()
        if (!subscription?.endpoint) {
            return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })
        }

        // Upsert subscription
        await supabaseAdmin.from('push_subscriptions').upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh,
            auth: subscription.keys?.auth,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'endpoint' })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
