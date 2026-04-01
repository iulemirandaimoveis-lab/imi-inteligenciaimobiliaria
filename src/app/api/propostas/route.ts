import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { withLogging } from '@/lib/api-logger'
import { z } from 'zod'

const PropostaPostSchema = z.object({
    property_id: z.string().min(1),
    property_name: z.string().min(1),
    property_price: z.number().positive(),
    property_address: z.string().optional(),
    lead_id: z.string().optional(),
    lead_name: z.string().min(1),
    lead_email: z.string().email().optional(),
    lead_phone: z.string().optional(),
    broker_name: z.string().optional(),
    broker_creci: z.string().optional(),
    broker_phone: z.string().optional(),
    proposed_value: z.number().positive().optional(),
    down_payment_pct: z.number().min(0).max(100).optional(),
    financing_rate: z.number().min(0).optional(),
    financing_term: z.number().int().positive().optional(),
    sections: z.array(z.string()).optional(),
    validity_days: z.number().int().positive().optional(),
    conditions: z.record(z.unknown()).optional(),
})

export const dynamic = 'force-dynamic'

function generateToken(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)]
    return result
}

// GET - List proposals for current user
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const { data, error } = await supabaseAdmin
            .from('propostas')
            .select('*')
            .order('created_at', { ascending: false })

        return NextResponse.json({ data: data || [], error: error?.message })
    } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
}

// POST - Create new proposal
export const POST = withLogging(async (req: Request) => {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await req.json()
        const parsed = PropostaPostSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const token = generateToken()
        const validityDays = parsed.data.validity_days || 7

        const v = parsed.data
        const { data, error } = await supabaseAdmin
            .from('propostas')
            .insert({
                token,
                property_id: v.property_id,
                property_name: v.property_name,
                property_price: v.property_price,
                property_address: v.property_address,
                lead_id: v.lead_id,
                lead_name: v.lead_name,
                lead_email: v.lead_email,
                lead_phone: v.lead_phone,
                broker_id: user.id,
                broker_name: v.broker_name || user.user_metadata?.name,
                broker_creci: v.broker_creci,
                broker_phone: v.broker_phone,
                status: 'draft',
                proposed_value: v.proposed_value || v.property_price,
                down_payment_pct: v.down_payment_pct || 20,
                financing_rate: v.financing_rate || 9.5,
                financing_term: v.financing_term || 360,
                sections: v.sections || ['header','cover','gallery','description','proposal','simulator','cta'],
                validity_days: validityDays,
                expires_at: new Date(Date.now() + validityDays * 86400000).toISOString(),
                conditions: v.conditions || {},
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        const proposalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/p/${token}`

        await createNotification({
            title: 'Nova Proposta Criada',
            message: `Proposta para ${v.lead_name} — ${v.property_name}`,
            type: 'proposta_nova',
            userId: null,
            url: proposalUrl,
        }).catch(() => {})

        return NextResponse.json({ success: true, data, url: proposalUrl, token })
    } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
})
