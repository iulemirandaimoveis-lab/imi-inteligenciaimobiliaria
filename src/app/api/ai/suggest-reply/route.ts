/**
 * POST /api/ai/suggest-reply
 * Sugere resposta inteligente para Social Inbox (WhatsApp, Gmail, Instagram DMs)
 * Usa Claude Haiku para velocidade
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const CHANNEL_CONTEXT: Record<string, string> = {
    gmail:     'email profissional, tom formal mas caloroso',
    whatsapp:  'WhatsApp, tom direto, amigável e rápido — máximo 3 frases',
    instagram: 'resposta de comentário Instagram, breve e engajadora',
    facebook:  'resposta no Facebook, amigável e profissional',
    linkedin:  'LinkedIn, tom profissional e corporativo',
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, channel, from, subject, message } = body

    // Support both direct call and action-based call from inbox
    if (action !== 'suggest_reply' && !message) {
        return NextResponse.json({ error: 'action suggest_reply ou message obrigatório' }, { status: 400 })
    }

    const channelCtx = CHANNEL_CONTEXT[channel] || 'mensagem, tom profissional'

    const systemPrompt = `Você é Iule Miranda, corretora de imóveis premium em Recife/PE.
Você representa a IMI — Iule Miranda Imóveis, especializada em imóveis de alto padrão (R$ 400k–R$ 5M+).
Tom: sofisticado, caloroso, eficiente. Nunca prometa o que não pode cumprir.
Você está respondendo via ${channelCtx}.

REGRAS:
- Responda APENAS o texto da mensagem, sem explicações
- Seja conciso e direto
- Inclua próximo passo concreto (visita, ligação, reunião)
- Use nome da pessoa se disponível
- Para WhatsApp: máximo 2-3 frases`

    const userPrompt = `${from ? `Mensagem de: ${from}\n` : ''}${subject ? `Assunto: ${subject}\n` : ''}
Mensagem recebida:
"${message}"

Escreva uma resposta profissional e eficaz:`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        // Fallback response if no key
        return NextResponse.json({
            reply: `Olá! Obrigada pela mensagem. Vou verificar as informações e retorno em breve. Podemos agendar uma conversa? 😊`,
        })
    }

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        })
        const data = await res.json()
        const reply = data.content?.[0]?.text || ''
        return NextResponse.json({ reply })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
