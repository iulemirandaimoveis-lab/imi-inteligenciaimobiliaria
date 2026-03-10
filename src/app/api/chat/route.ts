import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Você é a assistente virtual da IMI - Inteligência Imobiliária, uma empresa premium de avaliações imobiliárias e consultoria patrimonial.

SOBRE A IMI:
- Especialista em laudos técnicos NBR 14653 (norma brasileira de avaliações)
- CRECI 17933 | CNAI 53290
- Atuação: Recife, João Pessoa, Dubai e EUA
- Serviços: Avaliações técnicas, consultoria patrimonial, corretagem curada, crédito imobiliário
- Fundador: Iule Miranda, 12+ anos de experiência

REGRAS:
- Seja conciso e profissional
- Responda em português por padrão, mas se o usuário escrever em outro idioma, responda nesse idioma
- Máximo de 150 palavras por resposta
- Para assuntos fora do escopo imobiliário, redirecione educadamente
- Incentive o contato com a equipe para avaliações e consultoria
- WhatsApp: +55 81 9 9723-0455
- Email: iulemirandaimoveis@gmail.com`

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages required' }, { status: 400 })
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                message: 'Estou temporariamente indisponível. Fale conosco pelo WhatsApp: +55 81 9 9723-0455',
            })
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
                system: SYSTEM_PROMPT,
                messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
                    role: m.role,
                    content: m.content,
                })),
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Anthropic API error:', error)
            return NextResponse.json({
                message: 'Desculpe, tive um problema técnico. Fale conosco pelo WhatsApp: +55 81 9 9723-0455',
            })
        }

        const data = await response.json()
        const assistantMessage = data.content?.[0]?.text || 'Desculpe, não consegui processar. Tente novamente.'

        return NextResponse.json({ message: assistantMessage })
    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json({
            message: 'Erro interno. Fale conosco pelo WhatsApp: +55 81 9 9723-0455',
        }, { status: 500 })
    }
}
