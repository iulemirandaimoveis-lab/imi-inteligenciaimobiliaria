import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name, email, phone, interest, development_id,
            attribution, sessionId,
        } = body

        if (!name || (!email && !phone)) {
            return NextResponse.json({ error: 'Identificação básica obrigatória' }, { status: 400 })
        }

        // 1. Create lead with full UTM attribution
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
                name,
                email: email || null,
                phone: phone || null,
                interest_type: interest || null,
                development_id: development_id || null,
                source: attribution?.source || 'site_direto',
                utm_source: attribution?.source || null,
                utm_medium: attribution?.medium || null,
                utm_campaign: attribution?.campaign || null,
                utm_content: attribution?.content || null,
                status: 'new',
                origin: 'website',
                custom_fields: {
                    session_id: sessionId || null,
                    short_code: attribution?.shortCode || null,
                    captured_at: new Date().toISOString(),
                },
            })
            .select()
            .single()

        if (leadError) throw leadError

        // 2. Link session to lead if sessionId provided
        if (sessionId) {
            ; (async () => {
                try {
                    await supabase
                        .from('tracking_sessions')
                        .update({ lead_id: lead.id })
                        .eq('session_id', sessionId)
                } catch { }
            })();
        }

        // 3. Create notification for new lead
        const devName = development_id ? '(imóvel vinculado)' : ''
            ; (async () => {
                try {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: DEFAULT_USER_ID,
                            type: 'new_lead',
                            title: `📩 Novo lead: ${name}`,
                            message: `${email || phone} — Origem: ${attribution?.source || 'site direto'} ${devName}`.trim(),
                            data: {
                                lead_id: lead.id,
                                source: attribution?.source || 'direct',
                                campaign: attribution?.campaign || null,
                                session_id: sessionId || null,
                            },
                            read: false,
                        })
                } catch (err: any) {
                    console.error('Notification error:', err)
                }
            })();

        // 4. AI qualification (non-blocking, soft fail)
        try {
            const { qualifyLeadWithClaude } = await import('@/lib/ai/lead-qualifier')
            qualifyLeadWithClaude({
                lead_id: lead.id,
                lead_data: lead,
                requested_by: 'system_automation',
            }).catch(() => { })
        } catch {
            // AI module might not be available — that's fine
        }

        return NextResponse.json({
            success: true,
            lead_id: lead.id,
            message: 'Lead capturado com sucesso',
        })
    } catch (err: any) {
        console.error('Lead Capture Error:', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
