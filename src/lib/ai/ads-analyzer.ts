import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { AdsCampaign, AdsMetrics } from '@/types/commercial-system';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
});

interface AnalyzeCampaignParams {
    tenant_id: string;
    campaign: AdsCampaign;
    metrics: AdsMetrics[];
    requested_by: string;
}

interface AnalyzeCampaignResult {
    insights: Record<string, unknown>[];
    ai_analysis: Record<string, unknown>;
    recommendations: string[];
    ai_request_id: string;
    cost_usd: number;
}

export async function analyzeCampaignWithClaude(
    params: AnalyzeCampaignParams
): Promise<AnalyzeCampaignResult> {
    const supabase = await createClient();
    const { campaign, metrics, tenant_id, requested_by } = params;

    // Calcula métricas agregadas
    const totalMetrics = metrics.reduce(
        (acc, m) => ({
            impressions: acc.impressions + m.impressions,
            clicks: acc.clicks + m.clicks,
            conversions: acc.conversions + m.conversions,
            spend: acc.spend + m.spend,
            revenue: acc.revenue + m.revenue,
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );

    const avgCTR = (totalMetrics.clicks / totalMetrics.impressions) * 100;
    const avgCPA = totalMetrics.conversions > 0 ? totalMetrics.spend / totalMetrics.conversions : 0;
    const roas = totalMetrics.spend > 0 ? totalMetrics.revenue / totalMetrics.spend : 0;

    // Benchmarks do mercado imobiliário
    const benchmarks = {
        ctr: 2.5,
        cpa: 85,
        roas: 3.0,
        conversion_rate: 3.5,
    };

    const prompt = `Você é um especialista em marketing digital para o mercado imobiliário brasileiro.

Analise esta campanha de anúncios e identifique problemas, desperdícios e oportunidades:

CAMPANHA: ${campaign.campaign_name}
PLATAFORMA: ${campaign.platform.replace('_', ' ').toUpperCase()}
PERÍODO: ${metrics.length} dias
OBJETIVO: ${campaign.objective || 'Geração de leads/conversões'}

MÉTRICAS CONSOLIDADAS:
- Impressões: ${totalMetrics.impressions.toLocaleString('pt-BR')}
- Cliques: ${totalMetrics.clicks.toLocaleString('pt-BR')}
- CTR: ${avgCTR.toFixed(2)}% (benchmark: ${benchmarks.ctr}%)
- Conversões: ${totalMetrics.conversions}
- Taxa de Conversão: ${((totalMetrics.conversions / totalMetrics.clicks) * 100).toFixed(2)}% (benchmark: ${benchmarks.conversion_rate}%)
- Investimento: R$ ${totalMetrics.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- CPA: R$ ${avgCPA.toFixed(2)} (benchmark: R$ ${benchmarks.cpa})
- Receita: R$ ${totalMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ROAS: ${roas.toFixed(2)}x (benchmark: ${benchmarks.roas}x)

MÉTRICAS DIÁRIAS (últimos ${Math.min(7, metrics.length)} dias):
${metrics
            .slice(-7)
            .map(
                (m) =>
                    `${m.date}: ${m.impressions} imp, ${m.clicks} cliques, ${m.conversions} conv, R$ ${m.spend.toFixed(2)}`
            )
            .join('\n')}

TAREFA:
Analise a performance e retorne um JSON com a seguinte estrutura:

{
  "summary": "Resumo executivo da análise (2-3 frases)",
  "performance_score": <número 0-100>,
  "issues": [
    {
      "type": "high_cpa" | "low_conversion" | "budget_waste" | "audience_fatigue" | "creative_decline" | "bid_optimization",
      "severity": "critical" | "high" | "medium" | "low",
      "title": "Título curto do problema",
      "description": "Descrição detalhada",
      "estimated_impact": <economia em reais>,
      "current_value": <valor atual da métrica>,
      "benchmark_value": <valor ideal da métrica>
    }
  ],
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2",
    "Recomendação específica 3"
  ],
  "opportunities": [
    "Oportunidade de crescimento 1",
    "Oportunidade de crescimento 2"
  ]
}

Seja específico, prescritivo e focado em ações práticas. Use dados reais dos benchmarks do mercado imobiliário.`;

    const startTime = Date.now();

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });

    const latencyMs = Date.now() - startTime;

    const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON da resposta
    let analysis;
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
        analysis = {
            summary: responseText.substring(0, 200),
            performance_score: 50,
            issues: [],
            recommendations: [],
            opportunities: [],
        };
    }

    // Calcula custo
    const costPer1MTokens = {
        input: 3.0,
        output: 15.0,
    };

    const costUsd =
        (message.usage.input_tokens / 1_000_000) * costPer1MTokens.input +
        (message.usage.output_tokens / 1_000_000) * costPer1MTokens.output;

    // Salva log da requisição
    const { data: aiRequest } = await supabase
        .from('ai_requests')
        .insert({
            tenant_id,
            provider: 'anthropic',
            model: 'claude-sonnet-4-6',
            prompt,
            response: responseText,
            raw_response: message,
            tokens_input: message.usage.input_tokens,
            tokens_output: message.usage.output_tokens,
            tokens_total: message.usage.input_tokens + message.usage.output_tokens,
            cost_usd: costUsd,
            latency_ms: latencyMs,
            status: 'success',
            request_type: 'analyze_campaign',
            related_entity_type: 'ads_campaign',
            related_entity_id: campaign.id,
            requested_by,
        })
        .select('id')
        .single();

    // Cria insights individuais no banco
    const insights = [];
    for (const issue of analysis.issues || []) {
        const { data: insight } = await supabase
            .from('ads_insights')
            .insert({
                tenant_id,
                campaign_id: campaign.id,
                insight_type: issue.type,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                ai_analysis: responseText,
                recommendations: analysis.recommendations || [],
                estimated_impact: issue.estimated_impact,
                current_metric_value: issue.current_value,
                benchmark_metric_value: issue.benchmark_value,
                metric_name: issue.type.includes('cpa') ? 'CPA' : issue.type.includes('conversion') ? 'Conversion Rate' : 'Other',
                status: 'open',
                analysis_start_date: metrics[0]?.date,
                analysis_end_date: metrics[metrics.length - 1]?.date,
                ai_request_id: aiRequest?.id,
            })
            .select()
            .single();

        if (insight) {
            insights.push(insight);
        }
    }

    // Atualiza campanha com análise
    await supabase
        .from('ads_campaigns')
        .update({
            ai_analysis: analysis,
            ai_recommendations: analysis.recommendations || [],
            last_analyzed_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

    return {
        insights,
        ai_analysis: analysis,
        recommendations: analysis.recommendations || [],
        ai_request_id: aiRequest?.id || '',
        cost_usd: costUsd,
    };
}
