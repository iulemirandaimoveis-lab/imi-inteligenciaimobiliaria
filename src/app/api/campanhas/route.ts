import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const { data, error } = await supabase
        .from('ads_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}

export async function POST(request: NextRequest) {
    const body = await request.json()

    const { data, error } = await supabase
        .from('ads_campaigns')
        .insert({
            name: body.name || body.nome,
            platform: body.platform || body.plataforma,
            status: body.status || 'draft',
            budget: body.budget || body.orcamento,
            start_date: body.start_date || body.dataInicio,
            end_date: body.end_date || body.dataFim,
            objective: body.objective || body.objetivo,
            target_audience: body.target_audience || body.publicoAlvo,
            ad_content: body.ad_content || body.conteudo,
        })
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
        .from('ads_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}
