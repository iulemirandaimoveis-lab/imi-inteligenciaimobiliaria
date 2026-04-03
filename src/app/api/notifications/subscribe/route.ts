// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SubscribePostSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
})

const SubscribeDeleteSchema = z.object({
    endpoint: z.string().url(),
})
// POST /api/notifications/subscribe
// Body: { endpoint, keys: { p256dh, auth } }
// Upserts the Web Push subscription for the current authenticated user
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        const body = await req.json()
        const parsed = SubscribePostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const { endpoint, keys } = parsed.data
        const { error: dbError } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'endpoint' }
            )
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
// DELETE /api/notifications/subscribe
// Body: { endpoint }
// Removes a push subscription for the current user
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        const body = await req.json()
        const parsedDel = SubscribeDeleteSchema.safeParse(body)
        if (!parsedDel.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsedDel.error.flatten() }, { status: 400 })
        }
        const { endpoint } = parsedDel.data
        const { error: dbError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', endpoint)
        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
