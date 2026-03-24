import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/send-notification'

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
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await req.json()
        const token = generateToken()
        const validityDays = body.validity_days || 7

        const { data, error } = await supabaseAdmin
            .from('propostas')
            .insert({
                token,
                property_id: body.property_id,
                property_name: body.property_name,
                property_price: body.property_price,
                property_address: body.property_address,
                lead_id: body.lead_id,
                lead_name: body.lead_name,
                lead_email: body.lead_email,
                lead_phone: body.lead_phone,
                broker_id: user.id,
                broker_name: body.broker_name || user.user_metadata?.name,
                broker_creci: body.broker_creci,
                broker_phone: body.broker_phone,
                status: 'draft',
                proposed_value: body.proposed_value || body.property_price,
                down_payment_pct: body.down_payment_pct || 20,
                financing_rate: body.financing_rate || 9.5,
                financing_term: body.financing_term || 360,
                sections: body.sections || ['header','cover','gallery','description','proposal','simulator','cta'],
                validity_days: validityDays,
                expires_at: new Date(Date.now() + validityDays * 86400000).toISOString(),
                conditions: body.conditions || {},
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        const proposalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/p/${token}`

        await sendNotification({
            title: '📋 Nova Proposta Criada',
            message: `Proposta para ${body.lead_name} — ${body.property_name}. Link: ${proposalUrl}`,
            type: 'info',
            userId: user.id,
        })

        return NextResponse.json({ success: true, data, url: proposalUrl, token })
    } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
}
