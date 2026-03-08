import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const rl = await limiters.ai(user.id)
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Limite de geração IA atingido. Aguarde 1 minuto.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetTime - Date.now()) / 1000)) } }
            )
        }

        const body = await request.json()
        const { tema, canal, development } = body as {
            tema: string
            canal: string
            development: { name: string; price_min?: number; neighborhood?: string }
        }

        if (!tema || !canal || !development?.name) {
            return NextResponse.json({ error: 'tema, canal e development.name são obrigatórios' }, { status: 400 })
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 })
        }

        const canalLabel = canal === 'instagram' ? 'Instagram' : canal === 'linkedin' ? 'LinkedIn' : 'Newsletter/E-mail'
        const price = development.price_min
            ? `A partir de R$ ${Number(development.price_min).toLocaleString('pt-BR')}`
            : ''
        const neighborhood = development.neighborhood ? ` em ${development.neighborhood}` : ''

        const systemPrompt = `Você é um especialista em marketing imobiliário premium e copywriter digital sênior da IMI — Inteligência Imobiliária, uma imobiliária de alto padrão em Recife/PE.

Seu estilo é sofisticado, aspiracional e autêntico. Você conhece o mercado imobiliário de Recife e escreve para compradores de alto poder aquisitivo.

REGRAS:
- Use linguagem elegante, não genérica
- Emojis com moderação e elegância
- Hashtags relevantes para mercado imobiliário de Recife
- CTA claro e persuasivo no final
- Para Instagram: informal e visual
- Para LinkedIn: mais formal e analítico
- Para Newsletter: rico em informação e storytelling`

        const userPrompt = `Gere conteúdo de marketing para o imóvel: **${development.name}**${neighborhood}. ${price}

Tema: ${tema}
Canal: ${canalLabel}

Retorne EXATAMENTE este JSON (sem markdown, sem código, só o objeto JSON puro):
{
  "legenda": "texto da legenda completo para ${canalLabel}",
  "reels": "roteiro completo para Reels/vídeo curto com timecodes [0:00] etc",
  "prompt": "prompt em inglês para gerar imagem IA (Midjourney/DALL-E style) relacionada ao imóvel e tema"
}`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 2000,
                temperature: 0.7,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        })

        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Claude API error: ${errText}`)
        }

        const data = await response.json()
        const rawText = data.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('')

        let parsed: { legenda: string; reels: string; prompt: string }
        try {
            // Strip possible markdown code block
            const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
            parsed = JSON.parse(clean)
        } catch {
            // Fallback: return raw as legenda
            parsed = {
                legenda: rawText,
                reels: 'Não foi possível gerar o roteiro. Tente novamente.',
                prompt: 'Real estate photography, modern architecture, Recife, professional lighting.',
            }
        }

        return NextResponse.json({
            legenda: parsed.legenda || '',
            reels: parsed.reels || '',
            prompt: parsed.prompt || '',
            model: data.model,
            tokens: data.usage?.output_tokens,
        })
    } catch (error: any) {
        console.error('[generate-social-content]', error)
        return NextResponse.json(
            { error: 'Erro ao gerar conteúdo', details: error.message },
            { status: 500 }
        )
    }
}
