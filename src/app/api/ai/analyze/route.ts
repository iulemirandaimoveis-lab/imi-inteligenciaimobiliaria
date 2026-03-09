import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Você é o assistente de inteligência da IMI — Inteligência Imobiliária.
Especialista em mercado imobiliário premium brasileiro.
Responda SEMPRE em JSON válido, nunca em markdown.
Seja direto, preciso e acionável. Máximo de 2 frases por campo de texto.`

function buildLeadPrompt(data: any): string {
  return `Analise este lead imobiliário e retorne JSON no formato exato:
{
  "insight": "análise do potencial de conversão em 1-2 frases",
  "nextAction": "próxima ação recomendada específica",
  "score": número 0-100,
  "urgency": "alta" | "media" | "baixa",
  "buyerProfile": "perfil do comprador em 1 frase",
  "estimatedTimeline": "prazo estimado de compra",
  "keyRisk": "principal risco ou obstáculo identificado",
  "approach": "instagram" | "whatsapp" | "email" | "ligacao" | "visita"
}

DADOS DO LEAD:
- Nome: ${data.name}
- Email: ${data.email || 'N/A'}
- Telefone: ${data.phone || 'N/A'}
- Status: ${data.status || 'cold'}
- Origem: ${data.source || 'N/A'}
- Interesse: ${data.interest || data.interest_type || 'N/A'}
- Capital disponível: ${data.capital ? `R$ ${Number(data.capital).toLocaleString('pt-BR')}` : 'Não informado'}
- Budget min: ${data.budget_min ? `R$ ${Number(data.budget_min).toLocaleString('pt-BR')}` : 'N/A'}
- Budget max: ${data.budget_max ? `R$ ${Number(data.budget_max).toLocaleString('pt-BR')}` : 'N/A'}
- Score atual: ${data.score || 0}
- Criado em: ${data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : 'N/A'}
- Última interação: ${data.last_interaction_at ? new Date(data.last_interaction_at).toLocaleDateString('pt-BR') : 'Nenhuma'}
- Localização de interesse: ${data.interest_location || 'N/A'}
- Tags: ${Array.isArray(data.tags) ? data.tags.join(', ') : 'Nenhuma'}
- Notas: ${data.notes || 'Nenhuma'}`
}

function buildCampanhaPrompt(data: any): string {
  const cpl = data.leads > 0 && data.cost > 0 ? (data.cost / data.leads).toFixed(2) : null
  const roi = data.revenue > 0 && data.cost > 0 ? (((data.revenue - data.cost) / data.cost) * 100).toFixed(1) : null

  return `Analise esta campanha de marketing imobiliário e retorne JSON no formato exato:
{
  "insight": "análise de performance em 1-2 frases",
  "nextAction": "otimização recomendada específica",
  "score": número 0-100 (eficiência),
  "status": "excelente" | "bom" | "regular" | "ruim",
  "cplAnalysis": "análise do CPL em 1 frase",
  "channelRecommendation": "recomendação de canal",
  "budgetSuggestion": "sugestão de ajuste de budget",
  "keyInsight": "insight principal sobre a campanha"
}

DADOS DA CAMPANHA:
- Nome: ${data.name || data.title}
- Canal: ${data.channel || data.type || 'N/A'}
- Status: ${data.status}
- Orçamento: ${data.budget ? `R$ ${Number(data.budget).toLocaleString('pt-BR')}` : 'N/A'}
- Gasto atual: ${data.cost ? `R$ ${Number(data.cost).toLocaleString('pt-BR')}` : 'N/A'}
- Leads gerados: ${data.leads || 0}
- Receita gerada: ${data.revenue ? `R$ ${Number(data.revenue).toLocaleString('pt-BR')}` : 'Não informada'}
- CPL calculado: ${cpl ? `R$ ${cpl}` : 'N/A'}
- ROI calculado: ${roi ? `${roi}%` : 'N/A'}
- Impressões: ${data.impressions || 'N/A'}
- Cliques: ${data.clicks || 'N/A'}
- CTR: ${data.impressions && data.clicks ? `${((data.clicks / data.impressions) * 100).toFixed(2)}%` : 'N/A'}
- Período: ${data.start_date ? new Date(data.start_date).toLocaleDateString('pt-BR') : 'N/A'} → ${data.end_date ? new Date(data.end_date).toLocaleDateString('pt-BR') : 'Em andamento'}`
}

function buildAvaliacaoPrompt(data: any): string {
  return `Analise esta avaliação imobiliária e retorne JSON no formato exato:
{
  "insight": "análise do imóvel e seu valor de mercado em 1-2 frases",
  "nextAction": "próximo passo para o perito/avaliador",
  "score": número 0-100 (completude e qualidade da avaliação),
  "priceAnalysis": "análise do valor estimado em 1 frase",
  "marketTrend": "alta" | "estavel" | "queda",
  "investmentGrade": "A" | "B" | "C" | "D",
  "keyFactor": "principal fator que influencia o valor",
  "recommendation": "recomendação para o cliente"
}

DADOS DA AVALIAÇÃO:
- Imóvel: ${data.property_address || data.address || 'N/A'}
- Tipo: ${data.property_type || 'N/A'}
- Área: ${data.area ? `${data.area}m²` : 'N/A'}
- Bairro/Cidade: ${data.neighborhood || 'N/A'}${data.city ? ', ' + data.city : ''}
- Valor estimado: ${data.estimated_value ? `R$ ${Number(data.estimated_value).toLocaleString('pt-BR')}` : 'Pendente'}
- Valor R$/m²: ${data.area && data.estimated_value ? `R$ ${Math.round(data.estimated_value / data.area).toLocaleString('pt-BR')}` : 'N/A'}
- Padrão: ${data.standard || data.quality || 'N/A'}
- Estado de conservação: ${data.condition || 'N/A'}
- Propósito: ${data.purpose || 'N/A'}
- Status: ${data.status || 'N/A'}
- Solicitante: ${data.client_name || 'N/A'}
- Notas: ${data.notes || 'Nenhuma'}`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, data } = await req.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'type e data são obrigatórios' }, { status: 400 })
    }

    let prompt: string
    switch (type) {
      case 'lead':
        prompt = buildLeadPrompt(data)
        break
      case 'campanha':
        prompt = buildCampanhaPrompt(data)
        break
      case 'avaliacao':
        prompt = buildAvaliacaoPrompt(data)
        break
      default:
        return NextResponse.json({ error: `Tipo inválido: ${type}` }, { status: 400 })
    }

    const startTime = Date.now()

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Haiku for speed + cost
      max_tokens: 1024,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const latency = Date.now() - startTime
    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock && 'text' in textBlock ? textBlock.text : '{}'

    // Parse JSON from Claude's response
    let analysis: any
    try {
      // Claude sometimes wraps in ```json blocks — strip them
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      // Fallback: return raw text as insight
      analysis = { insight: rawText.slice(0, 300), nextAction: 'Revisar dados e tentar novamente' }
    }

    // Log to ai_requests (best effort — don't fail if this errors)
    try {
      // Get tenant_id if available
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      await supabase.from('ai_requests').insert({
        tenant_id: tenantUser?.tenant_id ?? null,
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        prompt: prompt.slice(0, 1000),
        response: rawText.slice(0, 2000),
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
        tokens_total: response.usage.input_tokens + response.usage.output_tokens,
        cost_usd: (response.usage.input_tokens / 1_000_000) * 0.8 + (response.usage.output_tokens / 1_000_000) * 4.0,
        request_type: `analyze_${type}`,
        requested_by: user.id,
        latency_ms: latency,
        status: 'success',
      })
    } catch {
      // Non-critical — don't fail the response
    }

    return NextResponse.json({ analysis, latency })
  } catch (err: any) {
    console.error('[api/ai/analyze]', err)
    // Return helpful error message
    if (err?.message?.includes('API key')) {
      return NextResponse.json({ error: 'Claude API não configurada. Verifique ANTHROPIC_API_KEY.' }, { status: 503 })
    }
    return NextResponse.json({ error: err.message || 'Erro ao processar análise IA' }, { status: 500 })
  }
}
