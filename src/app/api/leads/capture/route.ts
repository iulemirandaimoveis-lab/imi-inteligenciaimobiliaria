import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { limiters, getClientIP } from '@/lib/rate-limit'
import { withLogging } from '@/lib/api-logger'
export const POST = withLogging(async (request: Request) => {
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
            attribution, sessionId, financing_status, purchase_timeline,
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
                    financing_status: financing_status || null,
                    purchase_timeline: purchase_timeline || null,
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
        // 3b. Round-robin assignment to active team members (fewest-leads approach, non-blocking)
        void (async () => {
            try {
                // Get active team members
                const { data: members } = await supabaseAdmin
                    .from('brokers')
                    .select('user_id')
                    .eq('status', 'active')
                if (!members || members.length === 0) return
                // Count leads currently assigned to each active broker
                const memberIds = members.map((m) => m.user_id)
                const { data: counts } = await supabaseAdmin
                    .from('leads')
                    .select('assigned_to')
                    .in('assigned_to', memberIds)
                // Build a map of member_id -> lead count, starting at 0 for everyone
                const countMap: Record<string, number> = {}
                for (const m of members) {
                    countMap[m.user_id] = 0
                }
                if (counts) {
                    for (const row of counts) {
                        if (row.assigned_to && countMap[row.assigned_to] !== undefined) {
                            countMap[row.assigned_to]++
                        }
                    }
                }
                // Pick the broker with the fewest leads (first by id for stable tie-breaking)
                const sorted = members
                    .slice()
                    .sort((a, b) => countMap[a.user_id] - countMap[b.user_id] || a.user_id.localeCompare(b.user_id))
                const assignee = sorted[0]
                // Assign the lead to the broker's auth user_id
                await supabaseAdmin
                    .from('leads')
                    .update({ assigned_to: assignee.user_id })
                    .eq('id', lead.id)
            } catch {
                // Assignment failure is non-critical
            }
        })()
        // 4. Auto-create follow-up event in agenda (24h from now)
        void (async () => {
            try {
                const followUpTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
                const endTime = new Date(followUpTime.getTime() + 30 * 60 * 1000)
                await supabaseAdmin.from('calendar_events').insert({
                    title: `Follow-up: ${name}`,
                    description: `Lead capturado via ${attribution?.source || 'site'}. ${email ? `Email: ${email}` : ''} ${phone ? `Tel: ${phone}` : ''}`.trim(),
                    start_time: followUpTime.toISOString(),
                    end_time: endTime.toISOString(),
                    type: 'follow_up',
                    status: 'pending',
                    user_id: adminId,
                    metadata: { lead_id: lead.id, auto_generated: true },
                })
            } catch {
                // Follow-up creation is non-critical
            }
        })()

        // 5. AI qualification (non-blocking, soft fail)
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
    } catch (err) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
})
