/**
 * POST /api/social/sync-messages
 * Pull latest messages from a platform and upsert into social_messages
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
    getInstagramMessages,
    getFacebookMessages,
    getTwitterDMs,
} from '@/lib/social/publisher'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SyncMessagesSchema = z.object({
    platform: z.enum(['instagram', 'facebook', 'twitter']),
})

interface PlatformMessage {
    id: string
    sender_id: string
    sender_name?: string
    content: string
    timestamp: string
    conversation_id?: string
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = SyncMessagesSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { platform } = parsed.data

    try {
        // Look up social account for the platform
        const { data: socialAccount, error: accountError } = await supabaseAdmin
            .from('social_accounts')
            .select('*')
            .eq('platform', platform)
            .eq('user_id', user.id)
            .single()

        if (accountError || !socialAccount) {
            return NextResponse.json(
                { error: `Conta ${platform} não encontrada ou não vinculada` },
                { status: 404 },
            )
        }

        const accessToken = socialAccount.access_token

        // Fetch messages from the platform
        let platformMessages: PlatformMessage[] = []
        switch (platform) {
            case 'instagram':
                platformMessages = await getInstagramMessages(accessToken, socialAccount.ig_user_id || socialAccount.account_id)
                break
            case 'facebook':
                platformMessages = await getFacebookMessages(accessToken, socialAccount.page_id || socialAccount.account_id)
                break
            case 'twitter':
                platformMessages = await getTwitterDMs(accessToken)
                break
        }

        let syncedCount = 0
        let newCount = 0

        for (const msg of platformMessages) {
            // Check for dedup using platform_message_id
            const { data: existing } = await supabaseAdmin
                .from('social_messages')
                .select('id')
                .eq('platform_message_id', msg.id)
                .eq('platform', platform)
                .maybeSingle()

            if (existing) {
                syncedCount++
                continue
            }

            // Try to auto-match sender to leads table
            let leadId: string | null = null
            if (msg.sender_name) {
                const { data: lead } = await supabaseAdmin
                    .from('leads')
                    .select('id')
                    .or(`name.ilike.%${msg.sender_name}%,phone.eq.${msg.sender_id}`)
                    .maybeSingle()

                if (lead) {
                    leadId = lead.id
                }
            }

            // Insert the new message
            const { error: insertError } = await supabaseAdmin
                .from('social_messages')
                .insert({
                    platform,
                    platform_message_id: msg.id,
                    direction: 'inbound',
                    sender_id: msg.sender_id,
                    sender_name: msg.sender_name || null,
                    content: msg.content,
                    conversation_id: msg.conversation_id || null,
                    status: 'received',
                    lead_id: leadId,
                    user_id: user.id,
                    created_at: msg.timestamp || new Date().toISOString(),
                })

            if (!insertError) {
                newCount++
            }
            syncedCount++
        }

        return NextResponse.json({
            synced: syncedCount,
            new: newCount,
        })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao sincronizar mensagens' },
            { status: 500 },
        )
    }
}
