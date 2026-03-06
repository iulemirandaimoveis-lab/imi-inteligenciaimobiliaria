import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseBody } from '@/lib/schemas'
import { z } from 'zod'

// Contratos has a unique DB schema — custom local validation schemas
const contratoBaseObject = z.object({
    categoria: z.string().optional(),
    modelo_nome: z.string().optional(),
    status: z.string().optional(),
    idioma: z.string().optional(),
    contratante: z.record(z.any()).optional(),
    contratado: z.record(z.any()).optional(),
    dados_contrato: z.record(z.any()).optional(),
    conteudo_markdown: z.string().optional(),
    pdf_url: z.string().optional().nullable(),
    docx_url: z.string().optional().nullable(),
    drive_url: z.string().optional().nullable(),
    criado_por: z.string().optional().nullable(),
    criado_por_nome: z.string().optional().nullable(),
    plataforma_assinatura: z.string().optional().nullable(),
    signatarios: z.array(z.any()).optional(),
    notas: z.string().optional(),
    tags: z.array(z.string()).optional(),
})

const contratoCreateSchema = contratoBaseObject.refine(
    d => d.categoria || d.modelo_nome,
    { message: 'categoria ou modelo_nome é obrigatório', path: ['categoria'] }
)

const contratoUpdateSchema = z.object({
    id: z.string().uuid('ID inválido'),
}).merge(contratoBaseObject.partial())

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
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(request, contratoCreateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const body = parsed.data

        // Auto-generate contract number
        const numero = `CTR-${Date.now()}`

        const { data, error } = await supabase
            .from('contratos')
            .insert({
                numero,
                modelo_id: null,
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
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const parsed = await parseBody(request, contratoUpdateSchema)
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error }, { status: 400 })
        const { id, ...updates } = parsed.data

        const updatesToApply = { ...updates, atualizado_em: new Date().toISOString() }

        const { data, error } = await supabase
            .from('contratos')
            .update(updatesToApply)
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
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
