// src/app/api/projetos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list projetos (with optional filters)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const id = searchParams.get('id')

        if (id) {
            const { data, error } = await supabase
                .from('projetos')
                .select('*')
                .eq('id', id)
                .single()
            if (error) return NextResponse.json({ error: error.message }, { status: 404 })
            return NextResponse.json(data)
        }

        let query = supabase
            .from('projetos')
            .select('*')
            .order('created_at', { ascending: false })

        // Filter by status if provided; otherwise exclude archived
        if (status) query = query.eq('status', status)
        else query = query.not('status', 'eq', 'arquivado')

        const { data, error } = await query.limit(100)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — create projeto
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await req.json()
        const { nome, tipo, descricao, cidade, estado, status, fase, unidades, unidades_vendidas, area_total_m2, vgv, imagem_url, latitude, longitude, data_lancamento, data_entrega_prev } = body

        if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('projetos')
            .insert({
                nome,
                tipo: tipo || null,
                descricao: descricao || null,
                cidade: cidade || null,
                estado: estado || null,
                status: status || 'estruturacao',
                fase: fase || null,
                unidades: unidades || 0,
                unidades_vendidas: unidades_vendidas || 0,
                area_total_m2: area_total_m2 || null,
                vgv: vgv || 0,
                imagem_url: imagem_url || null,
                latitude: latitude || null,
                longitude: longitude || null,
                data_lancamento: data_lancamento || null,
                data_entrega_prev: data_entrega_prev || null,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — update projeto
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const body = await req.json()
        const { id, ...updates } = body
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        updates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('projetos')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE — soft delete projeto (status = 'arquivado')
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('projetos')
            .update({ status: 'arquivado', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
