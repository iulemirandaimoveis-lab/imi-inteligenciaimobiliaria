import { createClient } from '@/lib/supabase/server';
import { callClaude, parseJsonFromAI } from '@/lib/ai/claude';
import { LeadQualification, LeadInteraction, LeadFollowUp, LeadPriority } from '@/types/commercial-system';

interface LeadData {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    interest?: string;
    budget?: number;
    preferred_location?: string;
    property_type?: string;
    timeline?: string;
    created_at: string;
    updated_at?: string;
    tenant_id?: string;
    user_id?: string;
}

interface QualifyLeadParams {
    lead_id: string;
    lead_data: LeadData;
    interactions?: LeadInteraction[];
    requested_by: string;
}

interface QualifyLeadResult {
    qualification: LeadQualification;
    follow_ups: Partial<LeadFollowUp>[];
    ai_request_id: string;
    cost_usd: number;
}

// Cached system prompt — stays warm across repeated calls, cutting input costs ~90%
const LEAD_SYSTEM_PROMPT = `Você é um especialista sênior em qualificação de leads para o mercado imobiliário premium de Recife/Pernambuco.

CONTEXTO DE MERCADO (Recife, maio 2026):
- Boa Viagem: R$ 8.000–16.000/m² (apartamentos frente-mar, alta liquidez)
- Pina / Setúbal: R$ 6.500–12.000/m² (expansão de Boa Viagem, valorização acelerada)
- Piedade / Candeias: R$ 5.000–9.000/m² (perfil família/investidor conservador)
- Alto padrão mínimo: R$ 400.000 | Luxo: R$ 1.5M+ | Ultra-luxo: R$ 3M+
- Financiamento: Caixa até R$ 1.5M (SBPE), acima disso capital próprio ou incorporadora
- Prazo médio de decisão: 2–6 meses (residencial), 1–3 meses (investidor)

PERFIS DE COMPRADOR:
1. INVESTIDOR PURO — pergunta sobre rentabilidade, vacância, yield; compra sem visitar; decisão rápida
2. FAMÍLIA DE ALTA RENDA — escola, condomínio, segurança; 1–4 visitas; decide em 60–120 dias
3. COMPRADOR INTERNACIONAL — remessa no exterior, procuração, documentação especial
4. UPGRADE IMOBILIÁRIO — já possui imóvel, quer financiar com equity, prazo 3–6 meses
5. PRIMEIRA COMPRA — mais sensível a preço, precisa de educação financeira

FRAMEWORK BANT IMOBILIÁRIO:
- Budget (B): valor declarado, financiamento pré-aprovado, renda estimada
- Authority (A): quem assina? cônjuge envolvido? sócio?
- Need (N): urgência real (aluguel, mudança de cidade, nascimento de filho)
- Timeline (T): prazo concreto × "estou só pesquisando"

SINAIS DE URGÊNCIA POSITIVOS: mudança de cidade, vencimento de aluguel, bebê a caminho, herança recebida, promoção profissional
SINAIS DE RISCO: sem budget definido, "só pesquisando", já visitou 10 imóveis sem fechar, mudou de interesse 3x

Retorne APENAS JSON válido, sem markdown, sem explicações.`;

export async function qualifyLeadWithClaude(params: QualifyLeadParams): Promise<QualifyLeadResult> {
    const supabase = await createClient();
    const { lead_id, lead_data, interactions = [], requested_by } = params;

    const interactionHistory = interactions
        .slice(0, 20)
        .map((i) => `[${i.created_at}] ${i.interaction_type} (${i.direction}): ${i.notes || i.subject || 'Sem notas'}`)
        .join('\n');

    const daysSinceCreation = Math.floor(
        (Date.now() - new Date(lead_data.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `Analise este lead imobiliário e retorne a qualificação completa em JSON.

DADOS DO LEAD:
Nome: ${lead_data.name}
Email: ${lead_data.email || 'Não informado'}
Telefone: ${lead_data.phone || 'Não informado'}
Origem: ${lead_data.source || 'Não informada'}
Interesse declarado: ${lead_data.interest || 'Não especificado'}
Budget declarado: ${lead_data.budget ? `R$ ${lead_data.budget.toLocaleString('pt-BR')}` : 'Não informado'}
Localização desejada: ${lead_data.preferred_location || 'Não informada'}
Tipo de imóvel: ${lead_data.property_type || 'Não informado'}
Prazo de compra declarado: ${lead_data.timeline || 'Não informado'}
Dias desde criação: ${daysSinceCreation}
Total de interações: ${interactions.length}

HISTÓRICO DAS ÚLTIMAS ${interactions.length} INTERAÇÕES:
${interactionHistory || 'Nenhuma interação registrada ainda.'}

TAREFA:
1. Classifique o perfil de comprador (INVESTIDOR / FAMÍLIA / INTERNACIONAL / UPGRADE / PRIMEIRA_COMPRA)
2. Avalie BANT: Budget (0-25pts), Authority (0-25pts), Need (0-25pts), Timeline (0-25pts)
3. Some BANT → score total 0-100
4. Defina prioridade, próxima ação e follow-ups táticos

Retorne JSON com exatamente esta estrutura:
{
  "score": <0-100>,
  "bant": { "budget": <0-25>, "authority": <0-25>, "need": <0-25>, "timeline": <0-25> },
  "buyer_profile": "INVESTIDOR|FAMÍLIA|INTERNACIONAL|UPGRADE|PRIMEIRA_COMPRA",
  "priority": "critical|high|medium|low",
  "summary": "Resumo executivo de 2-3 frases com o perfil e oportunidade",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "concerns": ["Risco ou lacuna 1", "Risco ou lacuna 2"],
  "recommendations": ["Ação específica 1", "Ação específica 2", "Ação específica 3"],
  "next_action": "Ação concreta e específica para as próximas 24-48h",
  "next_action_deadline": "<ISO 8601 datetime — próximas 24-48h>",
  "confidence": <0.0-1.0>,
  "ideal_property": "Descrição do imóvel ideal para esse perfil (tipo, bairro, faixa de preço)",
  "follow_ups": [
    {
      "suggested_action": "Descrição objetiva da ação",
      "suggested_message": "Template de mensagem pronto para usar (WhatsApp/email)",
      "suggested_channel": "call|email|whatsapp|meeting",
      "scheduled_for": "<ISO 8601 datetime>",
      "ai_rationale": "Por que essa ação converte esse perfil",
      "ai_confidence": <0.0-1.0>
    }
  ]
}

CRITÉRIOS DE PRIORIDADE:
- critical: BANT ≥ 80 OU lead perdendo oportunidade em 24-48h
- high: BANT 60-79, múltiplas interações positivas, prazo claro
- medium: BANT 40-59, interesse claro mas dados faltando
- low: BANT < 40, apenas exploratório

Seja específico, prescritivo e focado em ações que fecham venda.`;

    const response = await callClaude({
        tenant_id: lead_data.tenant_id || lead_data.user_id || 'default',
        prompt,
        system_prompt: LEAD_SYSTEM_PROMPT,
        model: 'claude-sonnet-4-6',
        temperature: 0.3,
        max_tokens: 2500,
        request_type: 'qualify_lead',
        related_entity_type: 'lead',
        related_entity_id: lead_id,
        requested_by,
        use_cache: true,
    });

    interface LeadAnalysis {
        score: number;
        bant?: { budget: number; authority: number; need: number; timeline: number };
        buyer_profile?: string;
        priority: string;
        summary: string;
        strengths: string[];
        concerns: string[];
        recommendations: string[];
        next_action: string;
        next_action_deadline: string;
        confidence: number;
        ideal_property?: string;
        follow_ups: Array<{
            suggested_action: string;
            suggested_message?: string;
            suggested_channel: string;
            scheduled_for: string;
            ai_rationale: string;
            ai_confidence: number;
        }>;
    }

    let analysis: LeadAnalysis;
    try {
        analysis = parseJsonFromAI<LeadAnalysis>(response.content);
    } catch {
        // Safe fallback — never crash the qualification flow
        analysis = {
            score: 50,
            priority: 'medium',
            summary: response.content.substring(0, 200),
            strengths: [],
            concerns: ['Não foi possível analisar automaticamente'],
            recommendations: ['Revisar dados do lead', 'Fazer contato inicial para qualificar'],
            next_action: 'Ligar para qualificar interesse e urgência',
            next_action_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: 0.3,
            follow_ups: [],
        };
    }

    const qualification: LeadQualification = {
        score: analysis.score,
        priority: analysis.priority as LeadPriority,
        summary: analysis.summary,
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        recommendations: analysis.recommendations || [],
        next_action: analysis.next_action,
        next_action_deadline: analysis.next_action_deadline,
        confidence: analysis.confidence,
    };

    await supabase
        .from('leads')
        .update({
            ai_qualification: {
                ...qualification,
                bant: analysis.bant,
                buyer_profile: analysis.buyer_profile,
                ideal_property: analysis.ideal_property,
            },
            ai_score: qualification.score,
            ai_priority: qualification.priority,
            ai_recommendations: qualification.recommendations,
            ai_next_action: qualification.next_action,
            ai_next_action_deadline: qualification.next_action_deadline,
            last_ai_analysis_at: new Date().toISOString(),
            ai_request_id: response.ai_request_id,
        })
        .eq('id', lead_id);

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
                ai_request_id: response.ai_request_id,
                status: 'pending',
            })
            .select()
            .single();

        if (followUp) followUps.push(followUp);
    }

    return {
        qualification,
        follow_ups: followUps,
        ai_request_id: response.ai_request_id,
        cost_usd: response.cost_usd,
    };
}
