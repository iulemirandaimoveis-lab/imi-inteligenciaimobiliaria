// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list notifications
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — mark as read
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await req.json()
        const { id, read_all } = body

        if (read_all) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('read', false)
            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
        const { error } = await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — create notification
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const body = await req.json()
        const { type, title, message, data: extraData } = body
        if (!title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })

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
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
