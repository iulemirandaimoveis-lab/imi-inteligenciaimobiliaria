/**
 * POST /api/omnichannel/send
 * Envia mensagem de reply via WhatsApp
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message_id, reply } = await req.json()
    if (!message_id || !reply) return NextResponse.json({ error: 'message_id e reply são obrigatórios' }, { status: 400 })

    // Get conversation from DB
    const { data: msg } = await supabase
        .from('whatsapp_messages')
        .select('conversation_id, whatsapp_conversations(phone_number, tenant_id, lead_id)')
        .eq('id', message_id)
        .single()

    if (!msg?.whatsapp_conversations) {
        return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    const conv = msg.whatsapp_conversations as any
    const result = await sendWhatsAppMessage({
        tenant_id: conv.tenant_id || user.id,
        phone_number: conv.phone_number,
        message: reply,
        lead_id: conv.lead_id,
    })

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message_id: result.message_id })
}
