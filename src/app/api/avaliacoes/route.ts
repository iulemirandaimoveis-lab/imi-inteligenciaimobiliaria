import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { avaliacaoSchema, avaliacaoUpdateSchema } from '@/lib/schemas'
import { createNotification } from '@/lib/notifications'

// ─── Zod schema for POST body (loose — accepts camelCase + snake_case) ──────
const avaliacaoPostSchema = z.object({
    tipo_imovel: z.string().optional(),
    tipoImovel: z.string().optional(),
    tipo: z.string().optional(),
    endereco: z.string().min(1, 'Endereço é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    area_privativa: z.any().optional(),
    areaPrivativa: z.any().optional(),
    area_total: z.any().optional(),
    areaTotal: z.any().optional(),
    quartos: z.any().optional(),
    banheiros: z.any().optional(),
    vagas: z.any().optional(),
    andar: z.string().optional(),
    ano_construcao: z.any().optional(),
    anoConstrucao: z.any().optional(),
    anoContrucao: z.any().optional(),
    padrao: z.string().optional(),
    estado_conservacao: z.string().optional(),
    estadoConservacao: z.string().optional(),
    caracteristicas: z.any().optional(),
    cliente_nome: z.string().optional(),
    clienteNome: z.string().optional(),
    cliente_email: z.string().optional(),
    clienteEmail: z.string().optional(),
    cliente_telefone: z.string().optional(),
    clienteTelefone: z.string().optional(),
    cliente_cpf_cnpj: z.string().optional(),
    clienteCpfCnpj: z.string().optional(),
    clienteCPFCNPJ: z.string().optional(),
    cliente_documento: z.string().optional(),
    clienteDocumento: z.string().optional(),
    cliente_tipo: z.string().optional(),
    clienteTipo: z.string().optional(),
    solicitante_instituicao: z.string().optional(),
    solicitanteInstituicao: z.string().optional(),
    finalidade: z.string().optional(),
    metodologia: z.string().optional(),
    grau_fundamentacao: z.string().optional(),
    grauFundamentacao: z.string().optional(),
    grau_precisao: z.string().optional(),
    grauPrecisao: z.string().optional(),
    prazo_entrega: z.any().optional(),
    prazoEntrega: z.any().optional(),
    observacoes: z.string().optional(),
    honorarios: z.any().optional(),
    valorHonorarios: z.any().optional(),
    forma_pagamento: z.string().optional(),
    formaPagamento: z.string().optional(),
    status: z.string().optional(),
    comparaveis: z.any().optional(),
}).passthrough()

// ─── Zod schema for PUT body ────────────────────────────────────────────────
const avaliacaoPutSchema = z.object({
    id: z.string().uuid('ID inválido'),
}).passthrough()

// ─── GET /api/avaliacoes ────────────────────────────────────────────────────
export const GET = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')

    // Single fetch by ID
    if (id) {
        const { data, error } = await supabase
            .from('avaliacoes')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
        return NextResponse.json(data)
    }

    // List all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
    const offset = (page - 1) * limit

    let query = supabase
        .from('avaliacoes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json({
        data,
        pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit),
        },
    })
}, { auth: true })

// ─── POST /api/avaliacoes ───────────────────────────────────────────────────
export const POST = apiHandler(avaliacaoPostSchema, async (_request: NextRequest, body: z.infer<typeof avaliacaoPostSchema>, ctx: ApiContext) => {
    const { supabase, user } = ctx

    const payload: Record<string, any> = {
        tipo_imovel: body.tipo_imovel || body.tipoImovel || body.tipo,
        endereco: body.endereco,
        complemento: body.complemento,
        bairro: body.bairro,
        cidade: body.cidade || 'Recife',
        estado: body.estado || 'PE',
        cep: body.cep,
        area_privativa: body.area_privativa || body.areaPrivativa ? Number(body.areaPrivativa || body.area_privativa) : null,
        area_total: body.area_total || body.areaTotal ? Number(body.areaTotal || body.area_total) : null,
        quartos: body.quartos ? Number(body.quartos) : null,
        banheiros: body.banheiros ? Number(body.banheiros) : null,
        vagas: body.vagas ? Number(body.vagas) : null,
        andar: body.andar,
        ano_construcao: body.ano_construcao || body.anoConstrucao || body.anoContrucao,
        padrao: body.padrao,
        estado_conservacao: body.estado_conservacao || body.estadoConservacao,
        caracteristicas: body.caracteristicas,
        cliente_nome: body.cliente_nome || body.clienteNome,
        cliente_email: body.cliente_email || body.clienteEmail,
        cliente_telefone: body.cliente_telefone || body.clienteTelefone,
        cliente_cpf_cnpj: body.cliente_cpf_cnpj || body.clienteCpfCnpj || body.clienteCPFCNPJ || body.cliente_documento || body.clienteDocumento,
        cliente_tipo: body.cliente_tipo || body.clienteTipo || 'PF',
        solicitante_instituicao: body.solicitante_instituicao || body.solicitanteInstituicao,
        finalidade: body.finalidade,
        metodologia: body.metodologia,
        grau_fundamentacao: body.grau_fundamentacao || body.grauFundamentacao,
        grau_precisao: body.grau_precisao || body.grauPrecisao,
        prazo_entrega: body.prazo_entrega || body.prazoEntrega || null,
        observacoes: body.observacoes,
        honorarios: body.honorarios || body.valorHonorarios ? Number(body.honorarios || body.valorHonorarios) : null,
        forma_pagamento: body.forma_pagamento || body.formaPagamento,
        status: body.status || 'aguardando_docs',
        comparaveis: body.comparaveis ? (Array.isArray(body.comparaveis) ? body.comparaveis : null) : null,
    }

    // Remove undefined values
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key]
    })

    // Validate normalized payload
    const parsed = avaliacaoSchema.partial().safeParse(payload)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    if (!payload.endereco) {
        return NextResponse.json({ error: 'Endereço é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('avaliacoes')
        .insert(payload)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })

    // Notification — fire-and-forget
    if (user) {
        createNotification({
            userId: user.id,
            type: 'avaliacao_nova',
            title: 'Nova Avaliação',
            message: `Avaliação para ${body.cliente_nome || body.clienteNome || 'cliente'} criada`,
            data: { avaliacao_id: data.id },
        }).catch(() => {})
    }

    return NextResponse.json({ data }, { status: 201 })
}, { auth: true, auditAction: 'avaliacao.create' })

// ─── PUT /api/avaliacoes ────────────────────────────────────────────────────
export const PUT = apiHandler(avaliacaoPutSchema, async (_request: NextRequest, body: z.infer<typeof avaliacaoPutSchema>, ctx: ApiContext) => {
    const { supabase } = ctx
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const parsed = avaliacaoUpdateSchema.partial().safeParse({ id, ...updates })
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    ;(updates as Record<string, any>).updated_at = new Date().toISOString()

    const { data, error } = await supabase
        .from('avaliacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json({ data })
}, { auth: true, auditAction: 'avaliacao.update' })

// ─── DELETE /api/avaliacoes ─────────────────────────────────────────────────
export const DELETE = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
    const { supabase } = ctx
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Soft delete: set status to cancelada
    const { data, error } = await supabase
        .from('avaliacoes')
        .update({
            status: 'cancelada',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
    return NextResponse.json({ success: true, data })
}, { auth: true, auditAction: 'avaliacao.delete' })
