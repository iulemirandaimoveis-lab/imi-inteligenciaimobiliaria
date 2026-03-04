import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

export async function GET(request: NextRequest) {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single()
        if (error) return Response.json({ error: error.message }, { status: 404 })
        return Response.json(data)
    }

    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}

export async function POST(request: NextRequest) {
    const supabase = getSupabase()
    const body = await request.json()

    const { data, error } = await supabase
        .from('campaigns')
        .insert({
            name: body.name,
            channel: body.channel || body.platform,
            status: body.status || 'draft',
            budget: body.budget,
            daily_budget: body.daily_budget,
            start_date: body.start_date,
            end_date: body.end_date,
            objective: body.objective,
            utm_source: body.utm_source,
            utm_campaign: body.utm_campaign,
        })
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
    const supabase = getSupabase()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

    const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
}
