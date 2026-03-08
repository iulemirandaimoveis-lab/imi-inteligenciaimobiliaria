import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { limiters, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        // Rate limiting: 10 requests / 10s per IP (public endpoint)
        const ip = getClientIP(request)
        const rl = await limiters.public(ip)
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetTime - Date.now()) / 1000)) } }
            )
        }

        const body = await request.json()
        const {
            name, email, phone, interest, development_id,
            attribution, sessionId,
        } = body

        if (!name || (!email && !phone)) {
            return NextResponse.json({ error: 'Identificação básica obrigatória' }, { status: 400 })
        }

        // Deduplication: same email submitted within last 5 minutes → return existing lead
        if (email) {
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
            const { data: existing } = await supabaseAdmin
                .from('leads')
                .select('id')
                .eq('email', email)
                .gte('created_at', fiveMinAgo)
                .limit(1)
                .maybeSingle()

            if (existing) {
                return NextResponse.json({
                    success: true,
                    lead_id: existing.id,
                    message: 'Lead já registrado',
                    deduplicated: true,
                })
            }
        }

        // 1. Create lead with full UTM attribution
        const { data: lead, error: leadError } = await supabaseAdmin
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
            void supabaseAdmin
                .from('tracking_sessions')
                .update({ lead_id: lead.id })
                .eq('session_id', sessionId)
        }

        // 3. Create notification for new lead
        // Resolve admin user_id (first user in auth system = admin Iule)
        let adminId: string | null = null
        const { data: adminUser } = await supabaseAdmin.from('profiles').select('id').limit(1).single()
        if (adminUser) adminId = adminUser.id

        const devName = development_id ? '(imóvel vinculado)' : ''
        void supabaseAdmin
            .from('notifications')
            .insert({
                user_id: adminId,
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
