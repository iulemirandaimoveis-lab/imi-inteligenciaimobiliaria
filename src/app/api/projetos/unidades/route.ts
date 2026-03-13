import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list unidades for a projeto
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const projetoId = searchParams.get('projeto_id')
        if (!projetoId) return NextResponse.json({ error: 'projeto_id é obrigatório' }, { status: 400 })

        const { data, error } = await supabase
            .from('projeto_unidades')
            .select('*')
            .eq('projeto_id', projetoId)
            .order('torre', { ascending: true })
            .order('andar', { ascending: true })
            .order('numero', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — create or bulk upsert unidades
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await req.json()

        // Bulk upsert
        if (Array.isArray(body.unidades)) {
            const { projeto_id, unidades } = body
            if (!projeto_id) return NextResponse.json({ error: 'projeto_id é obrigatório' }, { status: 400 })

            const rows = unidades.map((u: any) => ({
                projeto_id,
                torre: u.torre || null,
                andar: u.andar || null,
                numero: u.numero,
                planta_tipo: u.planta_tipo || null,
                area_privativa: u.area_privativa || null,
                preco: u.preco || null,
                status: u.status || 'disponivel',
                reservado_por: u.reservado_por || null,
                observacoes: u.observacoes || null,
            }))

            const { data, error } = await supabase
                .from('projeto_unidades')
                .insert(rows)
                .select()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ inserted: data?.length || 0, data }, { status: 201 })
        }

        // Single insert
        const { projeto_id, torre, andar, numero, planta_tipo, area_privativa, preco, status, observacoes } = body
        if (!projeto_id || !numero) {
            return NextResponse.json({ error: 'projeto_id e numero são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('projeto_unidades')
            .insert({
                projeto_id, torre, andar, numero, planta_tipo,
                area_privativa, preco, status: status || 'disponivel', observacoes,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT — update single unidade
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
            .from('projeto_unidades')
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

// DELETE — remove unidade
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('projeto_unidades')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
