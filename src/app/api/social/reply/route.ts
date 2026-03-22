/**
 * POST /api/social/reply
 * Reply to any message on any platform (Instagram, Facebook, WhatsApp, Twitter)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
    replyInstagramDM,
    replyFacebookMessage,
    replyTwitterDM,
} from '@/lib/social/publisher'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { message_id, content, platform } = body

    if (!message_id || !content || !platform) {
        return NextResponse.json(
            { error: 'message_id, content e platform são obrigatórios' },
            { status: 400 },
        )
    }

    const validPlatforms = ['instagram', 'facebook', 'whatsapp', 'twitter']
    if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
            { error: `Plataforma inválida. Use: ${validPlatforms.join(', ')}` },
            { status: 400 },
        )
    }

    try {
        // Look up the original message
        const { data: originalMessage, error: msgError } = await supabaseAdmin
            .from('social_messages')
            .select('*')
            .eq('id', message_id)
            .single()

        if (msgError || !originalMessage) {
            return NextResponse.json({ error: 'Mensagem original não encontrada' }, { status: 404 })
        }

        // Look up the social account for this platform to get access_token
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

        // Call the appropriate reply function based on platform
        let replyResult
        switch (platform) {
            case 'instagram':
                replyResult = await replyInstagramDM(
                    accessToken,
                    socialAccount.ig_user_id || socialAccount.account_id,
                    originalMessage.sender_id,
                    content,
                )
                break
            case 'facebook':
                replyResult = await replyFacebookMessage(
                    accessToken,
                    socialAccount.page_id || socialAccount.account_id,
                    originalMessage.sender_id,
                    content,
                )
                break
            case 'twitter':
                replyResult = await replyTwitterDM(
                    accessToken,
                    originalMessage.sender_id,
                    content,
                )
                break
            case 'whatsapp':
                // WhatsApp uses a different flow (Evolution API), handled separately
                return NextResponse.json(
                    { error: 'Use /api/whatsapp/send para respostas WhatsApp' },
                    { status: 400 },
                )
            default:
                return NextResponse.json({ error: 'Plataforma não suportada' }, { status: 400 })
        }

        // Save outbound message to social_messages
        const { data: savedReply, error: saveError } = await supabaseAdmin
            .from('social_messages')
            .insert({
                platform,
                direction: 'outbound',
                conversation_id: originalMessage.conversation_id,
                sender_id: user.id,
                recipient_id: originalMessage.sender_id,
                content,
                status: 'sent',
                user_id: user.id,
                external_message_id: replyResult?.message_id || null,
            })
            .select()
            .single()

        if (saveError) {
            console.error('Erro ao salvar resposta:', saveError)
        }

        // Update original message status to 'replied'
        await supabaseAdmin
            .from('social_messages')
            .update({ status: 'replied' })
            .eq('id', message_id)

        return NextResponse.json({
            success: true,
            reply: savedReply || { content, platform, status: 'sent' },
        })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao enviar resposta' },
            { status: 500 },
        )
    }
}
