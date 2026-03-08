import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const entity_type = searchParams.get('entity_type')
        const action = searchParams.get('action')
        const user_id = searchParams.get('user_id')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = supabase
            .from('audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (entity_type) query = query.eq('entity_type', entity_type)
        if (action) query = query.eq('action', action)
        if (user_id) query = query.eq('user_id', user_id)

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Also get total count
        let countQuery = supabase
            .from('audit_log')
            .select('id', { count: 'exact', head: true })

        if (entity_type) countQuery = countQuery.eq('entity_type', entity_type)
        if (action) countQuery = countQuery.eq('action', action)
        if (user_id) countQuery = countQuery.eq('user_id', user_id)

        const { count } = await countQuery

        return NextResponse.json({
            data: data || [],
            total: count || 0,
            limit,
            offset,
        })
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent } = body

        if (!action || !entity_type) {
            return NextResponse.json({ error: 'action and entity_type required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('audit_log')
            .insert({
                user_id: user_id || null,
                action,
                entity_type,
                entity_id: entity_id || null,
                old_data: old_data || null,
                new_data: new_data || null,
                ip_address: ip_address || request.headers.get('x-forwarded-for') || null,
                user_agent: user_agent || request.headers.get('user-agent') || null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
