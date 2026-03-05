// src/app/api/automacoes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list automation workflows
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const active = searchParams.get('active') // 'true' or 'false'

        if (id) {
            const { data, error } = await supabase
                .from('automation_workflows')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        let query = supabase
            .from('automation_workflows')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (active === 'true') query = query.eq('is_active', true)
        if (active === 'false') query = query.eq('is_active', false)

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query
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

// POST — create workflow
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await req.json()
        const { name, description, trigger_type, config, is_active } = body

        if (!name) return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('automation_workflows')
            .insert({
                name,
                description: description || null,
                trigger_type: trigger_type || 'manual',
                config: config || {},
                is_active: is_active !== undefined ? is_active : true,
                run_count: 0,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — update workflow
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await req.json()
        const { id, ...updates } = body
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('automation_workflows')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE — remove workflow
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('automation_workflows')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
