// src/app/api/notifications/push/route.ts
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
// Configure VAPID details lazily (inside the request handler) so this module
// can be evaluated during the Next.js build without environment variables present.
function configureWebPush() {
    const email = process.env.VAPID_EMAIL
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    if (email && publicKey && privateKey) {
        webpush.setVapidDetails(email, publicKey, privateKey)
        return true
    }
    return false
}
interface PushPayload {
    title: string
    body: string
    url?: string
    tag?: string
    icon?: string
}
// Checks if the caller is authorized to send push notifications.
// Accepts either:
//   1. A Bearer token matching CRON_SECRET (for internal/server-side use), or
//   2. An authenticated session where the user has role 'admin' or 'ADMIN'.
async function isAuthorized(req: NextRequest): Promise<{ ok: boolean; userId?: string }> {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    // 1. Internal secret (cron jobs, server-side triggers)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return { ok: true }
    }
    // 2. Authenticated admin session
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return { ok: false }
        // Check the user's role in the public.users table
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        const role = (profile?.role || '').toLowerCase()
        if (role === 'admin' || role === 'manager') {
            return { ok: true, userId: user.id }
        }
    } catch {
        // Ignore auth errors — fall through to forbidden
    }
    return { ok: false }
}
// Deletes a stale subscription that the browser/push service has invalidated.
async function deleteStaleSubscription(endpoint: string): Promise<void> {
    try {
        await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint)
    } catch (err) {
    }
}
// Sends a push notification to a single subscription.
// Returns true on success, false on failure.
async function sendToSubscription(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: PushPayload
): Promise<boolean> {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            },
            JSON.stringify(payload)
        )
        return true
    } catch (err: unknown) {
        const errObj = err instanceof Object ? err as Record<string, unknown> : {}
        const statusCode = (errObj.statusCode as number | undefined) ?? (errObj.status as number | undefined)
        if (statusCode === 410 || statusCode === 404) {
            // Subscription is expired or no longer valid — remove it
            console.info('[push] Removing stale subscription (status %d):', statusCode, subscription.endpoint)
            await deleteStaleSubscription(subscription.endpoint)
        } else {
        }
        return false
    }
}
// POST /api/notifications/push
// Body: { userId?: string, title, body, url?, tag?, icon? }
//
// If userId is provided, sends only to that user's subscriptions.
// If userId is omitted, broadcasts to ALL subscriptions (admin-only).
//
// Requires CRON_SECRET bearer token or admin/manager session.
export async function POST(req: NextRequest) {
    try {
        const auth = await isAuthorized(req)
        if (!auth.ok) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
        }
        const vapidReady = configureWebPush()
        if (!vapidReady) {
            return NextResponse.json(
                { error: 'VAPID keys não configuradas no servidor' },
                { status: 500 }
            )
        }
        const body = await req.json()
        const { userId, title, body: msgBody, url, tag, icon } = body
        if (!title || !msgBody) {
            return NextResponse.json(
                { error: 'title e body são obrigatórios' },
                { status: 400 }
            )
        }
        const payload: PushPayload = { title, body: msgBody, url, tag, icon }
        // Fetch subscriptions using service-role client to bypass RLS
        // Keys are stored as JSONB column: keys: { p256dh, auth }
        let query = supabaseAdmin
            .from('push_subscriptions')
            .select('endpoint, keys')
        if (userId) {
            query = query.eq('user_id', userId)
        }
        const { data: subscriptions, error: dbError } = await query
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }
        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ ok: true, sent: 0, message: 'Nenhuma subscription encontrada' })
        }
        // Send to all subscriptions in parallel
        const results = await Promise.allSettled(
            subscriptions.map((sub) => sendToSubscription(sub, payload))
        )
        const sent = results.filter(
            (r) => r.status === 'fulfilled' && r.value === true
        ).length
        const failed = results.length - sent
        console.info(`[push] Sent ${sent}/${results.length} notifications (${failed} failed)`)
        return NextResponse.json({
            ok: true,
            sent,
            failed,
            total: results.length,
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
