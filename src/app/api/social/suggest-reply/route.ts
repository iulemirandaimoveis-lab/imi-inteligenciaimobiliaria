/**
 * POST /api/social/suggest-reply
 * AI-powered reply suggestion using Claude (Anthropic)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY })

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { message_id } = body

    if (!message_id) {
        return NextResponse.json(
            { error: 'message_id é obrigatório' },
            { status: 400 },
        )
    }

    try {
        // Look up the message
        const { data: message, error: msgError } = await supabaseAdmin
            .from('social_messages')
            .select('*')
            .eq('id', message_id)
            .single()

        if (msgError || !message) {
            return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
        }

        // Get conversation history (last 20 messages in the same conversation)
        let conversationHistory: { direction: string; content: string; created_at: string }[] = []
        if (message.conversation_id) {
            const { data: history } = await supabaseAdmin
                .from('social_messages')
                .select('direction, content, created_at')
                .eq('conversation_id', message.conversation_id)
                .order('created_at', { ascending: true })
                .limit(20)

            conversationHistory = history || []
        }

        // Look up linked lead data
        let leadContext = ''
        if (message.lead_id) {
            const { data: lead } = await supabaseAdmin
                .from('leads')
                .select('name, email, phone, status, source, notes, property_interest')
                .eq('id', message.lead_id)
                .single()

            if (lead) {
                leadContext = [
                    lead.name && `Nome: ${lead.name}`,
                    lead.email && `Email: ${lead.email}`,
                    lead.phone && `Telefone: ${lead.phone}`,
                    lead.status && `Status: ${lead.status}`,
                    lead.source && `Origem: ${lead.source}`,
                    lead.property_interest && `Interesse: ${lead.property_interest}`,
                    lead.notes && `Observações: ${lead.notes}`,
                ].filter(Boolean).join('\n')
            }
        }

        // Build conversation context for the AI
        const conversationContext = conversationHistory
            .map((m) => {
                const role = m.direction === 'inbound' ? 'Cliente' : 'Consultor'
                return `${role}: ${m.content}`
            })
            .join('\n')

        const systemPrompt = `Você é um consultor imobiliário da IMI - Inteligência Imobiliária. Responda de forma profissional, cordial e objetiva em Português (BR).

Seu papel é ajudar clientes interessados em imóveis, responder dúvidas sobre propriedades, agendar visitas e acompanhar o processo de compra/aluguel.

${leadContext ? `--- Dados do Lead ---\n${leadContext}\n` : ''}
${conversationContext ? `--- Histórico da Conversa ---\n${conversationContext}\n` : ''}
--- Última mensagem recebida ---
${message.content}

Gere UMA sugestão de resposta natural e útil. Não inclua saudações genéricas se a conversa já está em andamento. Seja direto e relevante ao contexto.`

        const aiResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: 'Gere uma sugestão de resposta para a última mensagem do cliente.',
                },
            ],
            system: systemPrompt,
        })

        const suggestion =
            aiResponse.content[0].type === 'text'
                ? aiResponse.content[0].text
                : ''

        return NextResponse.json({ suggestion })
    } catch (error: unknown) {
        console.error('[suggest-reply] Erro:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao gerar sugestão' },
            { status: 500 },
        )
    }
}
