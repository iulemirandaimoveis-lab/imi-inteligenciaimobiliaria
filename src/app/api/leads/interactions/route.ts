import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedSupabase() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null as any, user: null }
    return { supabase, user }
}

export async function POST(request: Request) {
    const { supabase, user } = await getAuthenticatedSupabase()
    if (!supabase || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { lead_id, interaction_type, notes } = body

    if (!lead_id || !interaction_type) {
        return NextResponse.json({ error: 'lead_id e interaction_type obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('lead_interactions')
        .insert({
            lead_id,
            interaction_type,
            notes: notes || null,
            performed_by: user.id,
            created_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        console.error('lead_interactions insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function GET(request: Request) {
    const { supabase, user } = await getAuthenticatedSupabase()
    if (!supabase || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
        return NextResponse.json({ error: 'lead_id obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
}
