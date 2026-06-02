import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const RepasseCreateSchema = z.object({
    agency_id: z.string().min(1),
    empreendimento_nome: z.string().min(1),
    cliente_nome: z.string().min(1),
    valor_venda: z.number().positive(),
    percentual_comissao: z.number().positive().max(100),
    data_venda: z.string().min(1),
    notes: z.string().optional(),
})

const RepassePatchSchema = z.object({
    id: z.string().min(1),
    status: z.enum([
        'aguardando_nf',
        'nf_emitida',
        'pago_pela_construtora',
        'repasse_disponivel',
        'repassado',
        'cancelado',
    ]).optional(),
    data_nf_emissao: z.string().optional(),
    data_pagamento_construtora: z.string().optional(),
    data_repasse_prevista: z.string().optional(),
    data_repasse_realizada: z.string().optional(),
    nota_fiscal_id: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const agency_id = searchParams.get('agency_id')
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') ?? '50', 10)

        let query = supabaseAdmin
            .from('commission_repasses')
            .select(`
                id,
                agency_id,
                partner_agencies ( name ),
                empreendimento_nome,
                cliente_nome,
                valor_venda,
                percentual_comissao,
                valor_comissao_bruta,
                valor_repasse_liquido,
                status,
                data_venda,
                data_nf_emissao,
                data_pagamento_construtora,
                data_repasse_prevista,
                data_repasse_realizada,
                nota_fiscal_id
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (agency_id) query = query.eq('agency_id', agency_id)
        if (status) query = query.eq('status', status)

        const { data, error } = await query

        if (error) {
            console.error('[repasses/GET] Query error:', error.message)
            return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
        }

        const repasses = (data ?? []).map((r: Record<string, unknown>) => ({
            ...r,
            agency_name: (r.partner_agencies as { name: string } | null)?.name ?? null,
            partner_agencies: undefined,
        }))

        return NextResponse.json({ data: repasses })
    } catch (err) {
        console.error('[repasses/GET] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno', data: [] }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        let rawBody: unknown
        try {
            rawBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = RepasseCreateSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const { agency_id, empreendimento_nome, cliente_nome, valor_venda, percentual_comissao, data_venda, notes } =
            parsed.data

        const valor_comissao_bruta = valor_venda * percentual_comissao / 100
        const valor_repasse_liquido = valor_comissao_bruta

        const { data, error } = await supabaseAdmin
            .from('commission_repasses')
            .insert({
                agency_id,
                empreendimento_nome,
                cliente_nome,
                valor_venda,
                percentual_comissao,
                valor_comissao_bruta,
                valor_repasse_liquido,
                data_venda,
                notes,
                status: 'aguardando_nf',
                created_by: user.id,
            })
            .select()
            .single()

        if (error) {
            console.error('[repasses/POST] Insert error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch (err) {
        console.error('[repasses/POST] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        let rawBody: unknown
        try {
            rawBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = RepassePatchSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const { id, ...updates } = parsed.data

        const { data, error } = await supabaseAdmin
            .from('commission_repasses')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('[repasses/PATCH] Update error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (err) {
        console.error('[repasses/PATCH] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
