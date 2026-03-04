
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, type, neighborhood, city, state, features, selling_points, area, bedrooms, bathrooms, parking, priceMin, deliveryDate } = body

        const specs = [
            area ? `${area}m²` : null,
            bedrooms ? `${bedrooms} quarto${Number(bedrooms) > 1 ? 's' : ''}` : null,
            bathrooms ? `${bathrooms} banheiro${Number(bathrooms) > 1 ? 's' : ''}` : null,
            parking ? `${parking} vaga${Number(parking) > 1 ? 's' : ''}` : null,
        ].filter(Boolean).join(', ')

        const allFeatures = [...(features || []), ...(selling_points || [])].filter(Boolean)

        const prompt = `Você é um redator imobiliário de luxo. Escreva uma descrição magnética e profissional para o seguinte empreendimento:

Nome: ${name}
Tipo: ${type}
Localização: ${[neighborhood, city, state].filter(Boolean).join(', ')}${specs ? `\nEspecificações: ${specs}` : ''}${allFeatures.length ? `\nDiferenciais: ${allFeatures.join(', ')}` : ''}${deliveryDate ? `\nEntrega: ${deliveryDate}` : ''}

REGRAS:
1. Tom sofisticado, aspiracional, focado em lifestyle premium e qualidade de vida.
2. 2 a 3 parágrafos curtos (máximo 250 palavras no total).
3. Destaque localização, diferenciais e potencial do ativo.
4. Retorne APENAS o texto da descrição, sem títulos, bullets ou observações.
5. Não mencione preço. Não use emojis. Português brasileiro.`

        const message = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }]
        })

        const description = message.content[0].type === 'text' ? message.content[0].text : ''

        return NextResponse.json({ description })

    } catch (err: any) {
        console.error('AI Description Error:', err)
        return NextResponse.json({ error: 'Falha na geração IA' }, { status: 500 })
    }
}
