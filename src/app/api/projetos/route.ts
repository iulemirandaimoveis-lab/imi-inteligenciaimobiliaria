// src/app/api/projetos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder'
)

// GET — list projetos (with optional filters)
export async function GET(req: NextRequest) {
    try {
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

        if (status) query = query.eq('status', status)

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

// DELETE — remove projeto
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('projetos')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
