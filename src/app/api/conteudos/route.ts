import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBody, conteudoSchema, conteudoUpdateSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!user) return NextResponse.json({ error: 'Unauthorized', data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }, { status: 401 })

        if (id) {
            const { data, error } = await supabase
                .from('conteudos')
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
            .from('conteudos')
            .select('id, titulo, tipo, plataforma, status, data_publicacao, visualizacoes, engajamento, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching conteudos:', error)
            return NextResponse.json({ error: error.message, data: [], pagination: { page, limit, total: 0, pages: 0 } }, { status: 500 })
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
    } catch (err: any) {
        console.error('Error in GET /api/conteudos:', err)
        return NextResponse.json({ error: 'Internal Server Error', data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const parsed = await parseBody(req, conteudoSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })

        const { data, error } = await supabase
            .from('conteudos')
            .insert({ ...parsed.data, user_id: user.id })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT /api/conteudos — update conteudo by ID
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const parsed = await parseBody(req, conteudoUpdateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { id, ...updates } = parsed.data

        const { data, error } = await supabase
            .from('conteudos')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/conteudos?id=xxx → soft delete (status = 'arquivado')
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('conteudos')
            .update({ status: 'arquivado', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
