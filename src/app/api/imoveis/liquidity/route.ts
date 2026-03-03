import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
// @ts-ignore
export const maxDuration = 60

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Verifica auth
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await req.json()
        if (!id) {
            return NextResponse.json({ error: 'ID do imóvel não fornecido' }, { status: 400 })
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key do Anthropic não configurada' }, { status: 500 })
        }

        // Busca o imóvel
        const { data: imovel, error: dbError } = await supabase
            .from('developments')
            .select('*')
            .eq('id', id)
            .single()

        if (dbError || !imovel) {
            return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
        }

        // Se já tiver score salvo, pode retornar direto (opcional, dependendo de como quer forçar refetch)
        if (imovel.specs && (imovel.specs as any).liquidity_score) {
            return NextResponse.json({ data: (imovel.specs as any).liquidity_score })
        }

        const anthropic = new Anthropic({ apiKey })

        const systemPrompt = `Você é um Analista Imobiliário Quantitativo sênior. 
A Avaliação de Liquidez (Liquidity Score) mede a facilidade e rapidez projetadas para vender ou alugar um imóvel.
Você receberá os dados em JSON de um empreendimento imobiliário.
Baseado exclusivamente nas variáveis fornecidas (localização, preço, área, quartos, infraestrutura etc.), você deve:
1. Avaliar os pontos fortes que aceleram a venda (ex: preço/m² competitivo, muitos features, ótima localização).
2. Avaliar os pontos fracos que podem atrasar a venda (ex: poucas vagas, faltam informações, ticket muito alto sem compensação estrutural).
3. Estimar um "Score de Liquidez" de 0 a 100.
4. Fornecer uma breve análise do porquê dessa nota.

Retorne APENAS um JSON rígido e sintaticamente válido no formato abaixo, sem texto adicional e sem blocos \`\`\`json:
{
  "score": 85,
  "analysis": "O imóvel possui excelente liquidez devido a...",
  "strengths": ["Localização premium", "Muitas áreas de lazer"],
  "weaknesses": ["Preço por metro quadrado acima da média local"]
}`

        const propertyDataStr = JSON.stringify({
            name: imovel.name,
            type: imovel.type || imovel.property_type,
            location: imovel.neighborhood || imovel.location,
            city: imovel.city,
            area: imovel.private_area || imovel.area,
            bedrooms: imovel.bedrooms,
            parking: imovel.parking_spaces || imovel.parking,
            features: imovel.features,
            price_min: imovel.price_min,
            price_max: imovel.price_max,
            price_per_sqm: imovel.price_per_sqm
        }, null, 2);

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{
                role: 'user',
                content: `Analise a liquidez deste imóvel:\n${propertyDataStr}`
            }]
        })

        const content = response.content.find(b => b.type === 'text');
        const textContent = content && content.type === 'text' ? content.text : '';

        const jsonMatch = textContent.match(/\\{[\\s\\S]*\\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : textContent
        const scoredData = JSON.parse(jsonStr)

        // Salvar no DB
        const currentSpecs = typeof imovel.specs === 'object' && imovel.specs !== null ? imovel.specs : {}
        const newSpecs = { ...currentSpecs, liquidity_score: scoredData }

        await supabase
            .from('developments')
            .update({ specs: newSpecs })
            .eq('id', id)

        return NextResponse.json({ data: scoredData })
    } catch (err: any) {
        console.error('Erro na AI Liquidity Score:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
