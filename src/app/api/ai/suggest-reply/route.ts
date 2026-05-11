/**
 * POST /api/ai/suggest-reply
 * Sugere resposta inteligente para Social Inbox (WhatsApp, Gmail, Instagram DMs)
 * Usa Claude Haiku — velocidade máxima para respostas em tempo real
 */
import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const CHANNEL_CONTEXT: Record<string, string> = {
    gmail:     'email profissional — tom formal mas caloroso',
    whatsapp:  'WhatsApp — direto, amigável, máximo 3 frases, sem formalidade excessiva',
    instagram: 'comentário Instagram — breve, engajadora, emoji opcional',
    facebook:  'Facebook — amigável e profissional',
    linkedin:  'LinkedIn — profissional e corporativo',
}

// Cached system prompt — same for all replies, warm across calls
const SUGGEST_REPLY_SYSTEM = `Você é Iule Miranda, corretora de imóveis premium em Recife/PE.
Você representa a IMI — Iule Miranda Imóveis, especializada em imóveis de alto padrão (R$ 400k–R$ 5M+).
Bairros: Boa Viagem, Pina, Piedade, Setúbal, Candeias.
Tom: sofisticado, caloroso, eficiente. Nunca prometa o que não pode cumprir.
Responda APENAS o texto da mensagem — sem explicações, sem aspas, sem prefixo.
Inclua sempre um próximo passo concreto (visita, ligação, reunião).
Use o nome da pessoa se disponível.`

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = await limiters.ai(user.id)
    if (!rl.success) return NextResponse.json({ error: 'Limite de requisições excedido. Aguarde 1 minuto.' }, { status: 429 })

    const body = await req.json()
    const { action, channel, from, subject, message, tenant_id } = body

    if (action !== 'suggest_reply' && !message) {
        return NextResponse.json({ error: 'action suggest_reply ou message obrigatório' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
        return NextResponse.json({
            reply: 'Olá! Obrigada pela mensagem. Vou verificar as informações e retorno em breve. Podemos agendar uma conversa?',
        })
    }

    const channelCtx = CHANNEL_CONTEXT[channel] || 'mensagem profissional'

    const userPrompt = `Canal: ${channelCtx}
${from    ? `De: ${from}\n`    : ''}${subject ? `Assunto: ${subject}\n` : ''}
Mensagem recebida:
"${message}"

Escreva uma resposta:`

    try {
        const response = await callClaude({
            tenant_id: tenant_id || user.id,
            prompt: userPrompt,
            system_prompt: SUGGEST_REPLY_SYSTEM,
            model: 'claude-haiku-4-5-20251001',
            temperature: 0.7,
            max_tokens: 300,
            request_type: 'suggest_reply',
            requested_by: user.id,
            use_cache: true,
        })

        return NextResponse.json({ reply: response.content })
    } catch (e: unknown) {
        console.error('[AI suggest-reply] error:', e instanceof Error ? e.message : e)
        return NextResponse.json({ error: 'Erro ao gerar sugestão de resposta. Tente novamente.' }, { status: 500 })
    }
}
