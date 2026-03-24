import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
    try {
        const body = await req.json()
        const { event_type, section, data } = body

        // Find proposal by token
        const { data: proposta } = await supabaseAdmin
            .from('propostas')
            .select('id, broker_id, lead_name, property_name, views, viewed_at')
            .eq('token', params.token)
            .single()

        if (!proposta) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })

        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
        const ua = req.headers.get('user-agent') || ''
        const city = req.headers.get('x-vercel-ip-city') || ''
        const isMobile = /mobile|android|iphone/i.test(ua)

        // Insert event
        await supabaseAdmin.from('proposta_events').insert({
            proposta_id: proposta.id,
            event_type,
            section,
            data: data || {},
            device_type: isMobile ? 'mobile' : 'desktop',
            browser: ua.substring(0, 200),
            ip_address: ip,
            city,
        })

        // Update proposal stats
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (event_type === 'view' && !proposta.viewed_at) {
            updates.viewed_at = new Date().toISOString()
            updates.status = 'viewed'
            updates.views = (proposta.views || 0) + 1

            // Notify broker on first view
            const { sendNotification } = await import('@/lib/send-notification')
            await sendNotification({
                title: '👁️ Proposta Visualizada!',
                message: `${proposta.lead_name} abriu a proposta de ${proposta.property_name}`,
                type: 'tracking',
                userId: proposta.broker_id,
            })
        } else if (event_type === 'view') {
            updates.views = (proposta.views || 0) + 1
        }

        updates.last_viewed_at = new Date().toISOString()

        await supabaseAdmin.from('propostas').update(updates).eq('id', proposta.id)

        return NextResponse.json({ success: true })
    } catch { return NextResponse.json({ error: 'Erro interno' }, { status: 500 }) }
}
