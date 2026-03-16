import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { LeadQualification, LeadInteraction, LeadFollowUp } from '@/types/commercial-system';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface QualifyLeadParams {
    lead_id: string;
    lead_data: any;
    interactions?: LeadInteraction[];
    requested_by: string;
}

interface QualifyLeadResult {
    qualification: LeadQualification;
    follow_ups: Partial<LeadFollowUp>[];
    ai_request_id: string;
    cost_usd: number;
}

export async function qualifyLeadWithClaude(
    params: QualifyLeadParams
): Promise<QualifyLeadResult> {
    const supabase = await createClient();
    const { lead_id, lead_data, interactions = [], requested_by } = params;

    // Constrói histórico de interações
    const interactionHistory = interactions
        .map(
            (i) =>
                `[${i.created_at}] ${i.interaction_type} (${i.direction}): ${i.notes || i.subject || 'Sem notas'}`
        )
        .join('\n');

    const prompt = `Você é um especialista em qualificação de leads para o mercado imobiliário brasileiro.

Analise este lead e forneça uma qualificação completa:

DADOS DO LEAD:
Nome: ${lead_data.name}
Email: ${lead_data.email || 'Não informado'}
Telefone: ${lead_data.phone || 'Não informado'}
Origem: ${lead_data.source || 'Não informada'}
Interesse: ${lead_data.interest || 'Não especificado'}
Budget: ${lead_data.budget ? `R$ ${lead_data.budget.toLocaleString('pt-BR')}` : 'Não informado'}
Localização desejada: ${lead_data.preferred_location || 'Não informada'}
Tipo de imóvel: ${lead_data.property_type || 'Não informado'}
Prazo de compra: ${lead_data.timeline || 'Não informado'}

HISTÓRICO DE INTERAÇÕES (${interactions.length} interações):
${interactionHistory || 'Nenhuma interação registrada'}

CONTEXTO:
- Lead criado em: ${lead_data.created_at}
- Última atualização: ${lead_data.updated_at || lead_data.created_at}
- Dias desde criação: ${Math.floor((Date.now() - new Date(lead_data.created_at).getTime()) / (1000 * 60 * 60 * 24))}

TAREFA:
Analise e retorne um JSON com a seguinte estrutura:

{
  "score": <número 0-100>,
  "priority": "critical" | "high" | "medium" | "low",
  "summary": "Resumo executivo da qualificação (2-3 frases)",
  "strengths": [
    "Ponto forte 1",
    "Ponto forte 2"
  ],
  "concerns": [
    "Preocupação ou risco 1",
    "Preocupação ou risco 2"
  ],
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2",
    "Recomendação específica 3"
  ],
  "next_action": "Ação específica a tomar (ex: 'Ligar para agendar visita ao empreendimento X')",
  "next_action_deadline": "2026-02-10T15:00:00Z",
  "confidence": <número 0.0-1.0>,
  "follow_ups": [
    {
      "suggested_action": "Descrição da ação",
      "suggested_message": "Template de mensagem (se aplicável)",
      "suggested_channel": "call" | "email" | "whatsapp" | "meeting",
      "scheduled_for": "2026-02-10T10:00:00Z",
      "ai_rationale": "Por que essa ação é importante",
      "ai_confidence": <0.0-1.0>
    }
  ]
}

CRITÉRIOS DE SCORING:
- 80-100: Lead quente (budget definido + prazo curto + múltiplas interações positivas)
- 60-79: Lead morno (interesse claro + alguns dados faltando)
- 40-59: Lead frio (poucos dados + sem interações recentes)
- 0-39: Lead muito frio (dados incompletos + sem engajamento)

PRIORIZAÇÃO:
- critical: Lead pronto para fechar OU risco de perder em 24-48h
- high: Lead bem qualificado, requer ação em 2-3 dias
- medium: Lead interessante, follow-up em 1 semana
- low: Lead para nutrir a longo prazo

Seja específico, prescritivo e focado em ações práticas.`;

    const startTime = Date.now();

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        temperature: 0.4,
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
    let analysis: any;
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
        // Fallback se parsing falhar
        analysis = {
            score: 50,
            priority: 'medium',
            summary: responseText.substring(0, 200),
            strengths: [],
            concerns: [],
            recommendations: ['Revisar dados do lead', 'Fazer contato inicial'],
            next_action: 'Ligar para qualificar interesse',
            next_action_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: 0.5,
            follow_ups: [],
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
            tenant_id: lead_data.tenant_id || lead_data.user_id,
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
            request_type: 'qualify_lead',
            related_entity_type: 'lead',
            related_entity_id: lead_id,
            requested_by,
        })
        .select('id')
        .single();

    const qualification: LeadQualification = {
        score: analysis.score,
        priority: analysis.priority,
        summary: analysis.summary,
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        recommendations: analysis.recommendations || [],
        next_action: analysis.next_action,
        next_action_deadline: analysis.next_action_deadline,
        confidence: analysis.confidence,
    };

    // Atualiza o lead com a qualificação
    await supabase
        .from('leads')
        .update({
            ai_qualification: qualification,
            ai_score: qualification.score,
            ai_priority: qualification.priority,
            ai_recommendations: qualification.recommendations,
            ai_next_action: qualification.next_action,
            ai_next_action_deadline: qualification.next_action_deadline,
            last_ai_analysis_at: new Date().toISOString(),
            ai_request_id: aiRequest?.id,
        })
        .eq('id', lead_id);

    // Cria follow-ups sugeridos
    const followUps: Partial<LeadFollowUp>[] = [];
    for (const fu of analysis.follow_ups || []) {
        const { data: followUp } = await supabase
            .from('lead_follow_ups')
            .insert({
                lead_id,
                suggested_action: fu.suggested_action,
                suggested_message: fu.suggested_message,
                suggested_channel: fu.suggested_channel,
                scheduled_for: fu.scheduled_for,
                ai_rationale: fu.ai_rationale,
                ai_confidence: fu.ai_confidence,
                ai_request_id: aiRequest?.id,
                status: 'pending',
            })
            .select()
            .single();

        if (followUp) {
            followUps.push(followUp);
        }
    }

    return {
        qualification,
        follow_ups: followUps,
        ai_request_id: aiRequest?.id || '',
        cost_usd: costUsd,
    };
}
