import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

export async function GET(request: NextRequest) {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')

    // Single contract fetch
    if (id) {
        const { data, error } = await supabase
            .from('contratos')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    // List all contracts
    let query = supabase
        .from('contratos')
        .select('*')
        .order('criado_em', { ascending: false })

    if (status && status !== 'todos') {
        query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
    const supabase = getSupabase()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    updates.atualizado_em = new Date().toISOString()

    const { data, error } = await supabase
        .from('contratos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Soft delete: set status to cancelado
    const { data, error } = await supabase
        .from('contratos')
        .update({
            status: 'cancelado',
            atualizado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}
