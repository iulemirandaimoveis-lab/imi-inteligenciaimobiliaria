// src/app/api/bpo/transacoes/route.ts
// ── BPO Transactions CRUD ───────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET — list transactions (filterable)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const empresaId  = searchParams.get('empresa_id')
        const tipo       = searchParams.get('tipo')
        const categoriaId = searchParams.get('categoria_id')
        const conciliado = searchParams.get('conciliado')
        const dataInicio = searchParams.get('data_inicio')
        const dataFim    = searchParams.get('data_fim')
        const page       = parseInt(searchParams.get('page') || '1')
        const limit      = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
        const offset     = (page - 1) * limit

        let query = supabaseAdmin
            .from('bpo_transacoes')
            .select(`
                id, empresa_id, conta_id, categoria_id, data, descricao,
                valor, tipo, origem, conciliado, comprovante_url, metadata, created_at,
                bpo_categorias(nome, tipo, grupo)
            `, { count: 'exact' })
            .order('data', { ascending: false })
            .range(offset, offset + limit - 1)

        if (empresaId)   query = query.eq('empresa_id', empresaId)
        if (tipo)        query = query.eq('tipo', tipo)
        if (categoriaId) query = query.eq('categoria_id', categoriaId)
        if (conciliado)  query = query.eq('conciliado', conciliado === 'true')
        if (dataInicio)  query = query.gte('data', dataInicio)
        if (dataFim)     query = query.lte('data', dataFim)

        const { data, error, count } = await query

        if (error) {
            return NextResponse.json({ error: error.message, data: [], pagination: { page, limit, total: 0, pages: 0 } }, { status: 500 })
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        })
    } catch (err) {
        console.error('[BPO Transacoes GET]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST — create manual transaction
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { empresa_id, conta_id, categoria_id, data, descricao, valor, tipo } = body

        if (!empresa_id || !data || !valor || !tipo) {
            return NextResponse.json({ error: 'empresa_id, data, valor e tipo são obrigatórios' }, { status: 400 })
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return NextResponse.json({ error: 'tipo deve ser "receita" ou "despesa"' }, { status: 400 })
        }

        const { data: tx, error } = await supabaseAdmin
            .from('bpo_transacoes')
            .insert({
                empresa_id,
                conta_id: conta_id || null,
                categoria_id: categoria_id || null,
                data,
                descricao: descricao || '',
                valor: Number(valor),
                tipo,
                origem: 'manual',
                conciliado: false,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: tx }, { status: 201 })
    } catch (err) {
        console.error('[BPO Transacoes POST]', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
