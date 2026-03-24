// src/app/api/notifications/broadcast/route.ts
// Broadcast system notifications to all active users (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const BroadcastPostSchema = z.object({
    type: z.string().max(50).optional(),
    title: z.string().min(1).max(500),
    message: z.string().max(2000).optional(),
    data: z.record(z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
    try {
        // Verify the caller is authenticated
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = BroadcastPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const { type = 'system', title, message, data: extraData } = parsed.data

        // Get all active users from auth.users
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 500,
        })

        if (usersError) {
            return NextResponse.json({ error: usersError.message }, { status: 500 })
        }

        const userIds = users.users.map(u => u.id)

        if (userIds.length === 0) {
            return NextResponse.json({ message: 'No users to notify', count: 0 })
        }

        // Insert one notification per user
        const notifications = userIds.map(userId => ({
            user_id: userId,
            type,
            title,
            message: message || null,
            data: extraData || null,
            read: false,
        }))

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(notifications)
            .select('id')

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Notificação enviada para ${data?.length || 0} usuários`,
        }, { status: 201 })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
