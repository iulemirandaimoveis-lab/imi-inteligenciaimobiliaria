import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'imi-whatsapp'

/**
 * POST /api/whatsapp/send — Send WhatsApp message via Evolution API
 */
export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
    }

    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
        return NextResponse.json({ error: 'phone e message são obrigatórios' }, { status: 400 })
    }

    // Normalize phone (remove non-digits, ensure country code)
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.startsWith('0')) normalizedPhone = '55' + normalizedPhone.slice(1)
    if (!normalizedPhone.startsWith('55')) normalizedPhone = '55' + normalizedPhone

    try {
        const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
            method: 'POST',
            headers: {
                apikey: EVOLUTION_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                number: normalizedPhone,
                text: message,
            }),
        })

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            return NextResponse.json({
                error: errData?.message ?? 'Erro ao enviar mensagem',
            }, { status: 500 })
        }

        const data = await res.json()

        // Save to DB
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (profile) {
            // Find or create conversation
            let { data: conversation } = await supabase
                .from('whatsapp_conversations')
                .select('id')
                .eq('phone_number', normalizedPhone)
                .maybeSingle()

            if (!conversation) {
                const { data: newConv } = await supabase
                    .from('whatsapp_conversations')
                    .insert({
                        phone_number: normalizedPhone,
                        status: 'active',
                        assigned_to: user.id,
                    })
                    .select('id')
                    .single()
                conversation = newConv
            }

            if (conversation) {
                await supabase.from('whatsapp_messages').insert({
                    conversation_id: conversation.id,
                    direction: 'outbound',
                    message_type: 'text',
                    content: message,
                    status: 'sent',
                    external_id: data?.key?.id ?? null,
                })

                await supabase.from('whatsapp_conversations').update({
                    last_message_at: new Date().toISOString(),
                    last_message_preview: message.substring(0, 100),
                }).eq('id', conversation.id)
            }
        }

        return NextResponse.json({ success: true, messageId: data?.key?.id })
    } catch (error: unknown) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
        }, { status: 500 })
    }
}
