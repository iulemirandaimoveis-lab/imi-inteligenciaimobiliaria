import { supabaseAdmin } from '@/lib/supabase/admin'

// Lazy import web-push to avoid build-time native module crashes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _webpush: any = null
async function getWebPush() {
    if (!_webpush) {
        const wp = await import('web-push')
        _webpush = wp.default || wp
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const privateKey = process.env.VAPID_PRIVATE_KEY || ''
        if (publicKey && privateKey) {
            _webpush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:contato@iulemirandaimoveis.com.br', publicKey, privateKey)
        }
    }
    return _webpush
}

export async function sendWebPush(userId: string, payload: { title: string; body: string; url?: string }) {
    try {
        const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId)

        if (!subscriptions?.length) return

        const notification = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: payload.url || '/backoffice/hoje',
            timestamp: Date.now(),
        })

        for (const sub of subscriptions) {
            try {
                await (await getWebPush()).sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, notification)
            } catch (err: any) {
                // Remove invalid subscriptions (410 Gone)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseAdmin
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint)
                }
            }
        }
    } catch (err) {
        console.error('[WebPush] Error:', err)
    }
}

export async function sendWebPushToAll(payload: { title: string; body: string; url?: string }) {
    try {
        const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')

        if (!subscriptions?.length) return

        const notification = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: payload.url || '/backoffice/hoje',
        })

        for (const sub of subscriptions) {
            try {
                await (await getWebPush()).sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, notification)
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                }
            }
        }
    } catch (err) {
        console.error('[WebPush] Broadcast error:', err)
    }
}
