import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!user) return NextResponse.json([], { status: 200 })

        if (id) {
            const { data, error } = await supabase
                .from('consultorias')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        const { data, error, count } = await supabase
            .from('consultorias')
            .select('id, protocolo, cliente_nome, cliente_email, tipo, descricao, cidade, status, honorarios, honorarios_status, data_inicio, data_prev_conclusao, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching consultorias:', error)
            return NextResponse.json([], { status: 200 })
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (err) {
        console.error('consultorias GET error:', err)
        return NextResponse.json([], { status: 200 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()

        if (!body.tipo) return NextResponse.json({ error: 'tipo obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('consultorias')
            .insert({ ...body })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT /api/consultorias — update consultoria by ID
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('consultorias')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/consultorias?id=xxx → soft delete (status = 'cancelado')
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('consultorias')
            .update({ status: 'cancelado', updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
