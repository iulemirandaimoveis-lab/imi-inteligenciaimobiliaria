import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── Style presets ─────────────────────────────────────────────────────────────
const STYLE_PROMPTS: Record<string, string> = {
    premium: 'luxury minimalist design, dark gradient background with gold accents, clean typography, architectural photography, premium real estate aesthetic, elegant and sophisticated',
    moderno: 'modern bold graphic design, geometric shapes, vibrant dark background, contemporary architecture silhouette, strong visual hierarchy',
    editorial: 'editorial magazine style, editorial photography, high contrast, dramatic lighting, professional business aesthetic',
    aquarela: 'watercolor and ink illustration, soft colors, artistic brush strokes, architectural sketches, creative and warm',
    foto: 'photorealistic aerial view of luxury real estate, golden hour lighting, modern architecture, high resolution photography style',
}

export async function POST(req: NextRequest) {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { titulo, subtitulo = '', pilar = 'Mercado', estilo = 'premium' } = body

    if (!titulo) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

    const styleDesc = STYLE_PROMPTS[estilo] || STYLE_PROMPTS.premium

    const prompt = `Professional eBook cover design for a real estate book titled "${titulo}"${subtitulo ? ` with subtitle "${subtitulo}"` : ''}.
Theme: ${pilar} in the Brazilian luxury real estate market.
Style: ${styleDesc}.
The cover should look like a premium professional publication.
Book format: 6x9 inches, portrait orientation.
Do NOT include visible text in the image — only visual elements.
High quality, print-ready design.`

    try {
        const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1792',
                quality: 'hd',
                style: 'vivid',
            }),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error((err as any)?.error?.message || `OpenAI error ${res.status}`)
        }
        const response = await res.json()

        const imageUrl = response.data?.[0]?.url
        if (!imageUrl) throw new Error('Nenhuma imagem gerada')

        // Log usage
        await supabase.from('ai_requests').insert({
            user_id: user.id,
            type: 'ebook_cover',
            model: 'dall-e-3',
            cost_cents: 12, // ~$0.12 per HD image
        }).throwOnError().catch(() => null)

        return NextResponse.json({ success: true, url: imageUrl, revised_prompt: response.data?.[0]?.revised_prompt })
    } catch (err: any) {
        console.error('[generate-cover]', err)
        return NextResponse.json({ error: err.message || 'Erro na geração da capa' }, { status: 500 })
    }
}
