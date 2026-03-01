// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

// GET — list notifications
export async function GET() {
    try {
        const supabase = getSupabase()
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — mark as read
export async function PUT(req: NextRequest) {
    try {
        const supabase = getSupabase()
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
        const supabase = getSupabase()
        const body = await req.json()
        const { type, title, message, data: extraData } = body
        if (!title) return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: DEFAULT_USER_ID,
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
