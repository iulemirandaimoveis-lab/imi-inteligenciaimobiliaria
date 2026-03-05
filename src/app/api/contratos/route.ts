import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const status = searchParams.get('status')

        // Single contract fetch
        if (id) {
            const { data, error } = await supabase
                .from('contratos')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json(data)
        }

        // List all contracts
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset = (page - 1) * limit

        let query = supabase
            .from('contratos')
            .select('*', { count: 'exact' })
            .order('criado_em', { ascending: false })

        if (status && status !== 'todos') {
            query = query.eq('status', status)
        }

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        if (!body.categoria && !body.modelo_nome) {
            return NextResponse.json({ error: 'Categoria ou modelo_nome obrigatório' }, { status: 400 })
        }

        // Auto-generate contract number
        const numero = `CTR-${Date.now()}`

        const { data, error } = await supabase
            .from('contratos')
            .insert({
                numero,
                modelo_id: body.modelo_id || null,
                modelo_nome: body.modelo_nome || null,
                categoria: body.categoria || 'geral',
                status: body.status || 'rascunho',
                idioma: body.idioma || 'pt-BR',
                contratante: body.contratante || {},
                contratado: body.contratado || {},
                dados_contrato: body.dados_contrato || {},
                conteudo_markdown: body.conteudo_markdown || null,
                pdf_url: body.pdf_url || null,
                docx_url: body.docx_url || null,
                drive_url: body.drive_url || null,
                criado_por: body.criado_por || null,
                criado_por_nome: body.criado_por_nome || null,
                plataforma_assinatura: body.plataforma_assinatura || null,
                signatarios: body.signatarios || [],
                notas: body.notas || null,
                tags: body.tags || [],
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        updates.atualizado_em = new Date().toISOString()

        const { data, error } = await supabase
            .from('contratos')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        // Soft delete: set status to cancelado
        const { data, error } = await supabase
            .from('contratos')
            .update({
                status: 'cancelado',
                atualizado_em: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
    } catch (err: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
