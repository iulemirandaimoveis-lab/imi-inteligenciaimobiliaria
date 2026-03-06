// GET /api/operational-playbooks — Operational SOPs for the backoffice UI
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseBody, playbookSchema, playbookUpdateSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json([], { status: 200 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const category = searchParams.get('category')

        if (id) {
            const { data, error } = await supabase
                .from('playbooks')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        let query = supabase
            .from('playbooks')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        if (category && category !== 'todos') {
            query = query.eq('category', category)
        }

        const { data, error } = await query
        if (error) return NextResponse.json([], { status: 200 })
        return NextResponse.json({ data: data || [] })
    } catch {
        return NextResponse.json([], { status: 200 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(request, playbookSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })

        const slug = parsed.data.name
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')

        const { data, error } = await supabase
            .from('playbooks')
            .insert({ ...parsed.data, slug })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(request, playbookUpdateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { id, ...updates } = parsed.data

        const { data, error } = await supabase
            .from('playbooks')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('playbooks')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
