import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(params: {
    titulo: string
    subtitulo?: string
    pilar: string
    publico_alvo: string
    tom: string
    num_capitulos: number
    pontos_chave: string[]
}) {
    const pontosStr = params.pontos_chave.length > 0
        ? `\n\nPontos-chave obrigatórios:\n${params.pontos_chave.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : ''

    return `Você é um especialista em mercado imobiliário de luxo brasileiro e escritor de eBooks profissionais.

Escreva um eBook completo em português (pt-BR) com as seguintes especificações:

**Título**: ${params.titulo}
${params.subtitulo ? `**Subtítulo**: ${params.subtitulo}` : ''}
**Pilar temático**: ${params.pilar}
**Público-alvo**: ${params.publico_alvo}
**Tom**: ${params.tom}
**Número de capítulos**: ${params.num_capitulos}${pontosStr}

## Estrutura do eBook:

1. **Introdução** — Apresente o problema, a promessa do livro e por que o leitor deve ler até o fim. (2-3 parágrafos)

${Array.from({ length: params.num_capitulos }, (_, i) => `${i + 2}. **Capítulo ${i + 1}** — [título criativo baseado no tema]. Escreva conteúdo profundo e prático com subtópicos, dados e exemplos do mercado imobiliário brasileiro. (3-4 parágrafos)`).join('\n\n')}

${params.num_capitulos + 2}. **Conclusão** — Síntese dos aprendizados, chamada para ação e próximos passos. (2 parágrafos)

## Diretrizes de Escrita:
- Use dados reais do mercado imobiliário brasileiro quando relevante
- Inclua casos práticos e exemplos concretos
- Tom ${params.tom.toLowerCase()}, com linguagem clara e envolvente
- Evite clichês; prefira insights técnicos e diferenciados
- Estruture cada seção com markdown (## para capítulos, ### para subtópicos)
- O eBook deve ter entre 3.000 e 5.000 palavras

Escreva o eBook completo agora:`
}

export async function POST(req: NextRequest) {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
        titulo,
        subtitulo = '',
        pilar = 'Mercado',
        publico_alvo = 'Investidores',
        tom = 'Profissional',
        num_capitulos = 5,
        pontos_chave = [],
        stream = false,
    } = body

    if (!titulo) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

    const prompt = buildPrompt({ titulo, subtitulo, pilar, publico_alvo, tom, num_capitulos, pontos_chave })

    try {
        if (stream) {
            // ── Streaming mode ──────────────────────────────────────────────
            const encoder = new TextEncoder()
            const readable = new ReadableStream({
                async start(controller) {
                    const stream = anthropic.messages.stream({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 8192,
                        messages: [{ role: 'user', content: prompt }],
                        system: 'Você é um especialista em mercado imobiliário de luxo e escritor de eBooks de alta qualidade para a empresa IMI — Inteligência Imobiliária, baseada em Recife-PE, com portfólio premium.',
                    })

                    for await (const chunk of stream) {
                        if (
                            chunk.type === 'content_block_delta' &&
                            chunk.delta.type === 'text_delta'
                        ) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                },
            })
            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            })
        } else {
            // ── Non-streaming mode ──────────────────────────────────────────
            const msg = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 8192,
                system: 'Você é um especialista em mercado imobiliário de luxo e escritor de eBooks de alta qualidade para a empresa IMI — Inteligência Imobiliária, baseada em Recife-PE, com portfólio premium.',
                messages: [{ role: 'user', content: prompt }],
            })

            const conteudo = msg.content[0].type === 'text' ? msg.content[0].text : ''

            // Log to ai_requests
            try { await supabase.from('ai_requests').insert({ user_id: user.id, type: 'ebook_write', model: 'claude-3-haiku-20240307', tokens_used: msg.usage.input_tokens + msg.usage.output_tokens, cost_cents: Math.round(((msg.usage.input_tokens * 0.00025 + msg.usage.output_tokens * 0.00125) / 1000) * 100) }) } catch { /* ignore */ }

            return NextResponse.json({ success: true, conteudo, tokens: msg.usage })
        }
    } catch (err: any) {
        console.error('[write-ebook]', err)
        return NextResponse.json({ error: err.message || 'Erro na geração' }, { status: 500 })
    }
}
