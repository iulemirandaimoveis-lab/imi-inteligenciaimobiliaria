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
        .from('consultorias')
        .select('*')
        .order('created_at', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data ?? [])
}

export async function POST(request: NextRequest) {
    const body = await request.json()

    const protocolo = `CON-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

    const { data, error } = await supabase
        .from('consultorias')
        .insert({
            protocolo,
            cliente_nome: body.cliente_nome,
            cliente_email: body.cliente_email || null,
            cliente_telefone: body.cliente_telefone || null,
            cliente_tipo: body.cliente_tipo || 'PF',
            tipo: body.tipo,
            descricao: body.descricao || null,
            objetivo: body.objetivo || null,
            cidade: body.cidade || null,
            estado: body.estado || 'PE',
            honorarios: body.honorarios ? Number(body.honorarios) : null,
            forma_pagamento: body.forma_pagamento || null,
            honorarios_status: body.honorarios_status || 'pendente',
            status: 'proposta',
            data_inicio: body.data_inicio || new Date().toISOString().split('T')[0],
            data_prev_conclusao: body.data_prev_conclusao || null,
            observacoes: body.observacoes || null,
        })
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    const { data, error } = await supabase
        .from('consultorias')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
}
