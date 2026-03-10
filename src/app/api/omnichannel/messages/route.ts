/**
 * GET /api/omnichannel/messages
 * Retorna mensagens recentes de WhatsApp (+ outros canais no futuro)
 * formatadas para o Social Inbox
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = Number(req.nextUrl.searchParams.get('limit') || '50')

    // Try WhatsApp messages from DB
    const { data: waMessages } = await supabase
        .from('whatsapp_messages')
        .select('*, whatsapp_conversations(phone_number, lead_id)')
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(limit)

    const messages = (waMessages || []).map((m: any) => ({
        id: m.id,
        channel: 'whatsapp',
        from: m.whatsapp_conversations?.phone_number || 'Desconhecido',
        fromHandle: m.whatsapp_conversations?.phone_number,
        preview: m.content || '',
        body: m.content,
        timestamp: m.created_at,
        unread: m.status === 'received',
        threadId: m.conversation_id,
    }))

    return NextResponse.json({ messages })
}
