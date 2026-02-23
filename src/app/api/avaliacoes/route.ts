import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
        .from('avaliacoes')
        .select('*')
        .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}

export async function POST(request: NextRequest) {
    const body = await request.json()

    const payload = {
        cliente_nome: body.cliente_nome || body.clienteNome,
        cliente_email: body.cliente_email || body.clienteEmail,
        cliente_telefone: body.cliente_telefone || body.clienteTelefone,
        cliente_documento: body.cliente_documento || body.clienteDocumento,
        tipo_imovel: body.tipo_imovel || body.tipoImovel,
        endereco: body.endereco,
        bairro: body.bairro,
        cidade: body.cidade || 'Recife',
        estado: body.estado || 'PE',
        cep: body.cep,
        area_total: body.area_total || body.areaTotal,
        area_construida: body.area_construida || body.areaConstruida,
        finalidade: body.finalidade,
        metodologia: body.metodologia,
        valor_estimado: body.valor_estimado || body.valorEstimado,
        honorarios: body.honorarios,
        observacoes: body.observacoes,
        status: body.status || 'pendente',
    }

    const { data, error } = await supabase
        .from('avaliacoes')
        .insert(payload)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

    const { data, error } = await supabase
        .from('avaliacoes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}
