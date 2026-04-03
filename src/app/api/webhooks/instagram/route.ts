/**
 * GET  /api/webhooks/instagram — Meta webhook verification
 * POST /api/webhooks/instagram — Receive inbound Instagram messages
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET — Meta webhook verification handshake
 */
export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode')
    const token = req.nextUrl.searchParams.get('hub.verify_token')
    const challenge = req.nextUrl.searchParams.get('hub.challenge')

    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN

    if (mode === 'subscribe' && token === verifyToken) {
        console.debug('[Instagram Webhook] Verificação bem-sucedida')
        return new NextResponse(challenge, { status: 200 })
    }

    console.warn('[Instagram Webhook] Verificação falhou — token inválido')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

interface InstagramMessage {
    mid: string
    text?: string
    attachments?: { type: string; payload: { url: string } }[]
}

interface InstagramMessagingEntry {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: InstagramMessage
}

interface InstagramWebhookEntry {
    id: string
    time: number
    messaging?: InstagramMessagingEntry[]
}

interface InstagramWebhookPayload {
    object: string
    entry: InstagramWebhookEntry[]
}

/**
 * POST — Receive inbound Instagram messages via webhook
 */
export async function POST(req: NextRequest) {
    // Return 200 OK immediately to acknowledge receipt (Meta requires fast response)
    const body: InstagramWebhookPayload = await req.json()

    if (body.object !== 'instagram') {
        return NextResponse.json({ error: 'Not an Instagram event' }, { status: 400 })
    }

    // Process messages asynchronously (don't block the webhook response)
    processInstagramMessages(body.entry).catch((err) => {
        console.error('[Instagram Webhook] Erro ao processar mensagens:', err)
    })

    return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processInstagramMessages(entries: InstagramWebhookEntry[]) {
    for (const entry of entries) {
        if (!entry.messaging) continue

        for (const event of entry.messaging) {
            if (!event.message) continue

            const senderId = event.sender.id
            const messageText = event.message.text || ''
            const platformMessageId = event.message.mid
            const timestamp = new Date(event.timestamp).toISOString()

            // Check for dedup
            const { data: existing } = await supabaseAdmin
                .from('social_messages')
                .select('id')
                .eq('platform_message_id', platformMessageId)
                .eq('platform', 'instagram')
                .maybeSingle()

            if (existing) continue

            // Try to match sender to leads
            let leadId: string | null = null
            const { data: lead } = await supabaseAdmin
                .from('leads')
                .select('id')
                .eq('instagram_id', senderId)
                .maybeSingle()

            if (lead) {
                leadId = lead.id
            }

            // Save inbound message
            await supabaseAdmin
                .from('social_messages')
                .insert({
                    platform: 'instagram',
                    platform_message_id: platformMessageId,
                    direction: 'inbound',
                    sender_id: senderId,
                    content: messageText,
                    status: 'received',
                    lead_id: leadId,
                    created_at: timestamp,
                })
        }
    }
}
