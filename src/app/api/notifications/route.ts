// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const NotificationPutSchema = z.object({
    id: z.string().uuid().optional(),
    read_all: z.boolean().optional(),
})

const NotificationPostSchema = z.object({
    type: z.string().max(50).optional(),
    title: z.string().min(1).max(500),
    message: z.string().max(2000).optional(),
    data: z.record(z.unknown()).optional(),
})

// GET — list notifications
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}

// PUT — mark as read
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await req.json()
        const parsedPut = NotificationPutSchema.safeParse(body)
        if (!parsedPut.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsedPut.error.flatten() }, { status: 400 })
        }
        const { id, read_all } = parsedPut.data

        if (read_all) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('read', false)
                .or(`user_id.eq.${user.id},user_id.is.null`)
            if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        const { error } = await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', id)
            .or(`user_id.eq.${user.id},user_id.is.null`)
        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}

// POST — create notification
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await req.json()
        const parsedPost = NotificationPostSchema.safeParse(body)
        if (!parsedPost.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsedPost.error.flatten() }, { status: 400 })
        }
        const { type, title, message, data: extraData } = parsedPost.data

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: user?.id || null,
                type: type || 'info',
                title,
                message: message || null,
                data: extraData || null,
                read: false,
            })
            .select()
            .single()
        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}
