import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const PartnerAgencySchema = z.object({
    name: z.string().min(1),
    legal_name: z.string().min(1).optional(),
    cnpj: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    agency_type: z.string().optional(),
    notes: z.string().optional(),
})

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: sessionErr,
        } = await supabase.auth.getUser()
        if (sessionErr || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data, error } = await supabaseAdmin
            .from('partner_agencies')
            .select(`
                id,
                name,
                legal_name,
                cnpj,
                address,
                city,
                state,
                phone,
                email,
                agency_type,
                is_active,
                notes,
                partner_agency_contracts (
                    contratado_nome,
                    contratado_creci,
                    status,
                    repasse_dias_uteis,
                    data_assinatura
                )
            `)
            .order('name', { ascending: true })

        if (error) {
            console.error('[partner-agencies/GET] Query error:', error.message)
            return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
    } catch (err) {
        console.error('[partner-agencies/GET] Unexpected error:', err)
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

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        let rawBody: unknown
        try {
            rawBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
        }

        const parsed = PartnerAgencySchema.safeParse(rawBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('partner_agencies')
            .upsert(parsed.data, { onConflict: 'cnpj' })
            .select()
            .single()

        if (error) {
            console.error('[partner-agencies/POST] Upsert error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch (err) {
        console.error('[partner-agencies/POST] Unexpected error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
