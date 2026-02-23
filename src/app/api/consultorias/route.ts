import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}

export async function POST(request: NextRequest) {
    const body = await request.json()

    const { data, error } = await supabase
        .from('consultations')
        .insert({
            client_name: body.client_name || body.clienteNome || body.nome,
            client_email: body.client_email || body.clienteEmail || body.email,
            client_phone: body.client_phone || body.clienteTelefone || body.telefone,
            type: body.type || body.tipo,
            status: body.status || 'pending',
            description: body.description || body.descricao,
            scheduled_at: body.scheduled_at || body.dataAgendamento,
            value: body.value || body.valor,
            notes: body.notes || body.observacoes,
        })
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data }, { status: 201 })
}
