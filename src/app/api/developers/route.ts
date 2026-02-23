import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('name', { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}

export async function POST(request: NextRequest) {
    const body = await request.json()

    const payload = {
        name: body.nomeFantasia || body.name,
        legal_name: body.razaoSocial || body.legal_name,
        cnpj: body.cnpj,
        email: body.email,
        phone: body.telefone || body.celular || body.phone,
        website: body.website,
        address: body.logradouro
            ? `${body.logradouro}, ${body.numero}${body.complemento ? ' ' + body.complemento : ''} - ${body.bairro}, ${body.cidade}/${body.estado}, CEP ${body.cep}`
            : body.address,
        description: body.descricao || body.description,
        logo_url: body.logo_url,
        is_active: true,
    }

    const { data, error } = await supabase
        .from('developers')
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
        .from('developers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}
