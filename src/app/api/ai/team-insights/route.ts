import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'
import { limiters } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const rl = await limiters.ai(user.id)
        if (!rl.success) return NextResponse.json({ error: 'Limite de requisições excedido. Aguarde 1 minuto.' }, { status: 429 })
        const { performance, team_totals, tenant_id } = await req.json()
        if (!performance || !Array.isArray(performance)) {
            return NextResponse.json({ error: 'performance data required' }, { status: 400 })
        }
        const context = `
RESUMO DA EQUIPE:
- Total de membros: ${team_totals?.memberCount || performance.length}
- Leads totais: ${team_totals?.totalLeads || 0}
- Vendas totais: ${team_totals?.totalSales || 0}
- Receita total: R$ ${(team_totals?.totalRevenue || 0).toLocaleString('pt-BR')}
- Taxa conversão média: ${team_totals?.avgConversion || 0}%
PERFORMANCE INDIVIDUAL:
${performance.map((m: Record<string, unknown>) => `- ${m.name} (${m.role}): ${m.leads} leads, ${m.sales} vendas, R$ ${(m.revenue as number).toLocaleString('pt-BR')} receita, ${m.conversion_rate}% conversão | Meta leads: ${m.pct_leads ?? 'N/A'}%, Meta vendas: ${m.pct_vendas ?? 'N/A'}%, Meta receita: ${m.pct_receita ?? 'N/A'}%`).join('\n')}
`.trim()
        const response = await callClaude({
            tenant_id: tenant_id || 'default',
            prompt: `Analise a performance desta equipe imobiliária e gere insights estratégicos:\n\n${context}`,
            system_prompt: `Você é um coach de equipes comerciais imobiliárias da IMI Intelligence.
Analise os dados e retorne JSON:
{
  "overall_health": "boa" | "média" | "preocupante",
  "top_performer": {"name": "Nome", "highlight": "Por que se destaca"},
  "needs_attention": [{"name": "Nome", "issue": "Problema", "suggestion": "Sugestão de ação"}],
  "team_insights": ["insight 1", "insight 2", "insight 3"],
  "coaching_tips": ["dica 1", "dica 2"]
}
Regras:
- Seja direto, prático e específico (use nomes reais)
- Foque em ações que gerem resultado imediato
- Máximo 3 insights, 2 coaching tips, 2 needs_attention
- Se dados são insuficientes, diga claramente`,
            temperature: 0.6,
            max_tokens: 1024,
            request_type: 'team_insights',
        })
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
        }
        return NextResponse.json({
            insights: JSON.parse(jsonMatch[0]),
            ai_request_id: response.ai_request_id,
            cost_usd: response.cost_usd,
        })
    } catch (error: unknown) {
        console.error('[AI team-insights] error:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Erro ao gerar insights. Tente novamente.' }, { status: 500 })
    }
}
