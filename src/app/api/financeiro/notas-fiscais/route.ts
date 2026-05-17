import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const NFCreateSchema = z.object({
    tomador_nome: z.string().min(1),
    tomador_cpf_cnpj: z.string().optional(),
    tomador_endereco: z.string().optional(),
    tomador_municipio: z.string().optional(),
    tomador_uf: z.string().optional(),
    tomador_email: z.string().email().optional(),
    valor_servicos: z.number().positive(),
    deducoes: z.number().min(0).default(0),
    aliquota_iss: z.number().min(0).max(10).default(2.0),
    descricao_servico: z.string().optional(),
    data_competencia: z.string().optional(),
    agency_id: z.string().optional(),
    repasse_id: z.string().optional(),
    observacoes: z.string().optional(),
})

const NFPatchSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['rascunho', 'emitida', 'cancelada', 'substituida']).optional(),
    numero: z.string().optional(),
    nfse_numero: z.string().optional(),
    codigo_verificacao: z.string().optional(),
    data_emissao: z.string().optional(),
    document_url: z.string().optional(),
    motivo_cancelamento: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const sp = request.nextUrl.searchParams
        const agency_id = sp.get('agency_id')
        const status = sp.get('status')
        const repasse_id = sp.get('repasse_id')
        const limit = Math.min(parseInt(sp.get('limit') ?? '50', 10), 200)

        let query = supabaseAdmin
            .from('notas_fiscais')
            .select(`
                id, numero, serie, nfse_numero, codigo_verificacao,
                tipo, status,
                prestador_nome, prestador_cpf, prestador_cnpj, prestador_creci,
                tomador_nome, tomador_cpf_cnpj, tomador_endereco, tomador_municipio, tomador_uf, tomador_email,
                descricao_servico, codigo_servico_lc116,
                aliquota_iss, valor_servicos, deducoes, base_calculo, valor_iss, valor_liquido, iss_retido,
                data_emissao, data_competencia, motivo_cancelamento,
                repasse_id, agency_id, document_url, observacoes,
                created_at, updated_at,
                partner_agencies ( name )
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (agency_id) query = query.eq('agency_id', agency_id)
        if (status) query = query.eq('status', status)
        if (repasse_id) query = query.eq('repasse_id', repasse_id)

        const { data, error } = await query
        if (error) {
            console.error('[notas-fiscais/GET]', error.message)
            return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
        }

        const nfs = (data ?? []).map((nf: Record<string, unknown>) => ({
            ...nf,
            agency_name: (nf.partner_agencies as { name: string } | null)?.name ?? null,
            partner_agencies: undefined,
        }))

        return NextResponse.json({ data: nfs })
    } catch (err) {
        console.error('[notas-fiscais/GET] unexpected:', err)
        return NextResponse.json({ error: 'Erro interno', data: [] }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        let rawBody: unknown
        try { rawBody = await request.json() } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = NFCreateSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const {
            tomador_nome, tomador_cpf_cnpj, tomador_endereco, tomador_municipio, tomador_uf, tomador_email,
            valor_servicos, deducoes, aliquota_iss,
            descricao_servico, data_competencia, agency_id, repasse_id, observacoes,
        } = parsed.data

        const base_calculo = valor_servicos - deducoes
        const valor_iss = Math.round(base_calculo * aliquota_iss / 100 * 100) / 100
        const valor_liquido = valor_servicos - valor_iss

        const { data: nf, error: insertErr } = await supabaseAdmin
            .from('notas_fiscais')
            .insert({
                tomador_nome,
                tomador_cpf_cnpj: tomador_cpf_cnpj ?? null,
                tomador_endereco: tomador_endereco ?? null,
                tomador_municipio: tomador_municipio ?? null,
                tomador_uf: tomador_uf ?? null,
                tomador_email: tomador_email ?? null,
                descricao_servico: descricao_servico ?? 'Serviços de corretagem imobiliária — intermediação de compra e venda/locação de imóveis, conforme contrato',
                valor_servicos,
                deducoes,
                base_calculo,
                aliquota_iss,
                valor_iss,
                valor_liquido,
                data_competencia: data_competencia ?? null,
                agency_id: agency_id ?? null,
                repasse_id: repasse_id ?? null,
                observacoes: observacoes ?? null,
                status: 'rascunho',
                created_by: user.id,
            })
            .select()
            .single()

        if (insertErr) {
            console.error('[notas-fiscais/POST]', insertErr.message)
            return NextResponse.json({ error: insertErr.message }, { status: 500 })
        }

        // Se vinculado a um repasse, atualizar seu status e nota_fiscal_id
        if (repasse_id && nf) {
            await supabaseAdmin
                .from('commission_repasses')
                .update({ nota_fiscal_id: nf.id, status: 'nf_emitida', data_nf_emissao: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() })
                .eq('id', repasse_id)
        }

        return NextResponse.json({ data: nf }, { status: 201 })
    } catch (err) {
        console.error('[notas-fiscais/POST] unexpected:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: sessionErr } = await supabase.auth.getUser()
        if (sessionErr || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        let rawBody: unknown
        try { rawBody = await request.json() } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = NFPatchSchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const { id, ...updates } = parsed.data
        const { data, error } = await supabaseAdmin
            .from('notas_fiscais')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('[notas-fiscais/PATCH]', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (err) {
        console.error('[notas-fiscais/PATCH] unexpected:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
