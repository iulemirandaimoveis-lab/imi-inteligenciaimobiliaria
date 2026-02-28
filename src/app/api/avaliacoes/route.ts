import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)

export async function GET(request: NextRequest) {
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
    let query = supabase
        .from('avaliacoes')
        .select('*')
        .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
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

    const { data, error } = await supabase
        .from('avaliacoes')
        .insert(payload)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

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
