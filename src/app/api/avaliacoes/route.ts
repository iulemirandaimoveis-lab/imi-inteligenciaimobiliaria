import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { avaliacaoSchema, avaliacaoUpdateSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const parsed = avaliacaoUpdateSchema.partial().safeParse({ id, ...updates })
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
        .from('avaliacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}
