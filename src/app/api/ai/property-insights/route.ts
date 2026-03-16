import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const { property_id, tenant_id } = await req.json()

        if (!property_id) {
            return NextResponse.json({ error: 'property_id is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch property data
        const { data: property, error: propErr } = await supabase
            .from('developments')
            .select('*')
            .eq('id', property_id)
            .single()

        if (propErr || !property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }

        // Fetch lead count for this property
        const { count: leadCount } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('development_id', property_id)

        // Fetch QR scan count
        const { count: scanCount } = await supabase
            .from('qr_scans')
            .select('id', { count: 'exact', head: true })
            .eq('property_id', property_id)

        // Build rich context for Claude
        const propertyContext = `
DADOS DO IMÓVEL:
- Nome: ${property.name || 'N/A'}
- Tipo: ${property.property_type || property.type || 'N/A'}
- Status: ${property.status || 'N/A'}
- Endereço: ${property.address || 'N/A'}
- Bairro: ${property.neighborhood || 'N/A'}
- Cidade: ${property.city || 'N/A'} / ${property.state || 'N/A'}
- Preço Mín: R$ ${property.price_min?.toLocaleString('pt-BR') || 'N/A'}
- Preço Máx: R$ ${property.price_max?.toLocaleString('pt-BR') || 'N/A'}
- Área: ${property.area_min || 'N/A'} - ${property.area_max || 'N/A'} m²
- Quartos: ${property.bedrooms_min || 'N/A'} - ${property.bedrooms_max || 'N/A'}
- Vagas: ${property.parking_min || property.parking || 'N/A'}
- Suítes: ${property.suites || 'N/A'}
- Total de Unidades: ${property.units_count || 'N/A'}
- Unidades Disponíveis: ${property.available_units || 'N/A'}
- Construtora: ${property.developer || 'N/A'}
- Data de Entrega: ${property.delivery_date || 'N/A'}
- Descrição: ${property.description?.substring(0, 500) || 'Sem descrição'}
- Diferenciais: ${JSON.stringify(property.features || property.amenities || [])}

MÉTRICAS:
- Leads interessados: ${leadCount || 0}
- QR Codes escaneados: ${scanCount || 0}
- Cadastrado em: ${property.created_at ? new Date(property.created_at).toLocaleDateString('pt-BR') : 'N/A'}
`.trim()

        const systemPrompt = `Você é um analista sênior de inteligência imobiliária da IMI Intelligence, a plataforma líder em tecnologia para o mercado imobiliário brasileiro.

Seu papel é analisar dados de imóveis e gerar insights estratégicos de alto nível para corretores e gestores.

Responda SEMPRE em JSON válido com exatamente esta estrutura:
{
  "market_position": {
    "summary": "Uma frase sobre posição competitiva",
    "score": 7,
    "details": "2-3 frases de análise"
  },
  "price_recommendation": {
    "summary": "Uma frase sobre precificação",
    "suggested_action": "manter" | "aumentar" | "reduzir",
    "details": "2-3 frases com justificativa"
  },
  "listing_optimization": {
    "score": 8,
    "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"],
    "details": "1-2 frases"
  },
  "competitive_analysis": {
    "strengths": ["ponto forte 1", "ponto forte 2"],
    "weaknesses": ["ponto fraco 1"],
    "opportunity": "Uma oportunidade estratégica"
  },
  "lead_strategy": {
    "summary": "Estratégia para converter leads",
    "priority_actions": ["ação 1", "ação 2"]
  }
}

Regras:
- Seja específico e prático, não genérico
- Use dados reais fornecidos (preços, área, localização)
- Scores são de 1-10
- suggested_action DEVE ser: "manter", "aumentar" ou "reduzir"
- Máximo 3 suggestions no listing_optimization
- Máximo 3 strengths, 2 weaknesses
- Seja assertivo e direto`

        const effectiveTenantId = tenant_id || property.tenant_id || 'default'

        const response = await callClaude({
            tenant_id: effectiveTenantId,
            prompt: `Analise este imóvel e gere insights estratégicos:\n\n${propertyContext}`,
            system_prompt: systemPrompt,
            temperature: 0.6,
            max_tokens: 2048,
            request_type: 'property_insights',
            related_entity_type: 'development',
            related_entity_id: property_id,
        })

        // Parse JSON from response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({
                error: 'Failed to parse AI response',
                raw: response.content,
            }, { status: 500 })
        }

        const insights = JSON.parse(jsonMatch[0])

        return NextResponse.json({
            insights,
            ai_request_id: response.ai_request_id,
            tokens: { input: response.tokens_input, output: response.tokens_output },
            cost_usd: response.cost_usd,
        })
    } catch (error: any) {
        console.error('Property insights error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
