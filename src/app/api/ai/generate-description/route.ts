import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Cached system prompt — same across all description requests
const DESCRIPTION_SYSTEM = `Você é um redator imobiliário de alto padrão especializado no mercado de Recife/PE.
Escreva descrições magnéticas, técnicas e sofisticadas para imóveis premium (R$ 400k–R$ 5M+).
Tom: elegante, aspiracional, sem clichês como "sonho" ou "lar perfeito".
Destaque: localização estratégica, diferenciais construtivos, liquidez e potencial de valorização.
Público: investidores, executivos, famílias de alta renda, compradores internacionais.
Língua: português brasileiro culto. Sem emojis. Sem menção a preço.`

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await limiters.ai(user.id)
        if (!rl.success) return NextResponse.json({ error: 'Limite de requisições excedido. Aguarde 1 minuto.' }, { status: 429 })

        const body = await request.json()
        const { name, type, neighborhood, city, state, features, selling_points, area, bedrooms, bathrooms, parking, deliveryDate, tenant_id } = body

        const specs = [
            area      ? `${area}m²` : null,
            bedrooms  ? `${bedrooms} quarto${Number(bedrooms)  > 1 ? 's' : ''}` : null,
            bathrooms ? `${bathrooms} banheiro${Number(bathrooms) > 1 ? 's' : ''}` : null,
            parking   ? `${parking} vaga${Number(parking) > 1 ? 's' : ''}` : null,
        ].filter(Boolean).join(', ')

        const allFeatures = [...(features || []), ...(selling_points || [])].filter(Boolean)

        const prompt = `Escreva uma descrição para o imóvel abaixo.

Nome: ${name}
Tipo: ${type}
Localização: ${[neighborhood, city, state].filter(Boolean).join(', ')}${specs ? `\nEspecificações: ${specs}` : ''}${allFeatures.length ? `\nDiferenciais: ${allFeatures.join(', ')}` : ''}${deliveryDate ? `\nPrevisão de entrega: ${deliveryDate}` : ''}

REGRAS:
1. 2 a 3 parágrafos curtos (máximo 250 palavras no total)
2. Parágrafo 1: localização e posicionamento urbano
3. Parágrafo 2: diferenciais construtivos e lifestyle
4. Parágrafo 3: potencial de valorização e convite à visita (CTA sutil)
5. Retorne APENAS o texto da descrição, sem títulos, bullets ou observações`

        const response = await callClaude({
            tenant_id: tenant_id || user.id,
            prompt,
            system_prompt: DESCRIPTION_SYSTEM,
            model: 'claude-sonnet-4-6',
            temperature: 0.75,
            max_tokens: 600,
            request_type: 'generate_description',
            requested_by: user.id,
            use_cache: true,
        })

        return NextResponse.json({ description: response.content })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return NextResponse.json({
            error: process.env.NODE_ENV === 'development'
                ? `Falha na geração IA: ${message}`
                : 'Falha na geração IA',
        }, { status: 500 })
    }
}
