import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

export async function GET(request: NextRequest) {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single developer fetch with related developments
    if (id) {
        const { data, error } = await supabase
            .from('developers')
            .select('*, developments(id, name, slug, status, status_comercial, image, city, state, min_price, max_price, total_units, available_units)')
            .eq('id', id)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }

    // List all developers
    const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
    const supabase = getSupabase()
    const body = await request.json()

    // Generate slug from name
    const nameForSlug = body.nomeFantasia || body.name || ''
    const slug = nameForSlug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const payload: Record<string, any> = {
        name: body.nomeFantasia || body.name,
        legal_name: body.razaoSocial || body.legal_name,
        slug: slug || `dev-${Date.now()}`,
        cnpj: body.cnpj,
        email: body.email,
        phone: body.telefone || body.celular || body.phone,
        website: body.website,
        address: body.logradouro
            ? `${body.logradouro}, ${body.numero}${body.complemento ? ' ' + body.complemento : ''} - ${body.bairro}, ${body.cidade}/${body.estado}, CEP ${body.cep}`
            : body.address,
        city: body.cidade || body.city,
        state: body.estado || body.state,
        description: body.observacoes || body.description,
        notes: body.notes,
        logo_url: body.logo_url,
        instagram: body.instagram,
        linkedin: body.linkedin,
        is_active: true,
    }

    const { data, error } = await supabase
        .from('developers')
        .insert(payload)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
    const supabase = getSupabase()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
        .from('developers')
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

    // Soft delete: set is_active = false
    const { data, error } = await supabase
        .from('developers')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}
