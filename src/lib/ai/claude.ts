import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { AIRequest, AIProvider } from '@/types/commercial-system';

// Configuração do cliente Claude
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClaudeRequestParams {
    tenant_id: string;
    prompt: string;
    system_prompt?: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    request_type?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    requested_by?: string;
}

export interface ClaudeResponse {
    content: string;
    ai_request_id: string;
    tokens_input: number;
    tokens_output: number;
    cost_usd: number;
}

/**
 * Função principal para chamadas à API Claude
 * Loga automaticamente todas as requests no banco
 */
export async function callClaude(params: ClaudeRequestParams): Promise<ClaudeResponse> {
    const startTime = Date.now();
    const supabase = await createClient();

    const model = params.model || 'claude-sonnet-4-6';
    const temperature = params.temperature ?? 0.7;
    const max_tokens = params.max_tokens || 4096;

    let response: Anthropic.Message;
    let status: 'success' | 'error' | 'timeout' = 'success';
    let error_message: string | null = null;

    try {
        response = await anthropic.messages.create({
            model,
            max_tokens,
            temperature,
            system: params.system_prompt,
            messages: [
                {
                    role: 'user',
                    content: params.prompt,
                },
            ],
        });
    } catch (error: any) {
        status = 'error';
        error_message = error.message;

        // Loga erro
        await supabase.from('ai_requests').insert({
            tenant_id: params.tenant_id,
            provider: 'anthropic' as AIProvider,
            model,
            prompt: params.prompt,
            system_prompt: params.system_prompt,
            temperature,
            max_tokens,
            status,
            error_message,
            request_type: params.request_type,
            related_entity_type: params.related_entity_type,
            related_entity_id: params.related_entity_id,
            requested_by: params.requested_by,
            latency_ms: Date.now() - startTime,
        });

        throw new Error(`Claude API Error: ${error_message}`);
    }

    const endTime = Date.now();
    const latency_ms = endTime - startTime;

    // Extrai texto da resposta
    const textContent = response.content.find((block) => block.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    // Calcula tokens e custo
    const tokens_input = response.usage.input_tokens;
    const tokens_output = response.usage.output_tokens;
    const tokens_total = tokens_input + tokens_output;

    // Preços Claude 3.5 Sonnet (fevereiro 2026)
    // Input: $3.00 / 1M tokens
    // Output: $15.00 / 1M tokens
    const cost_input = (tokens_input / 1_000_000) * 3.0;
    const cost_output = (tokens_output / 1_000_000) * 15.0;
    const cost_usd = cost_input + cost_output;

    // Salva log no banco
    const { data: aiRequest, error: dbError } = await supabase
        .from('ai_requests')
        .insert({
            tenant_id: params.tenant_id,
            provider: 'anthropic' as AIProvider,
            model,
            prompt: params.prompt,
            system_prompt: params.system_prompt,
            temperature,
            max_tokens,
            response: content,
            raw_response: response,
            tokens_input,
            tokens_output,
            tokens_total,
            cost_usd,
            latency_ms,
            status,
            error_message,
            request_type: params.request_type,
            related_entity_type: params.related_entity_type,
            related_entity_id: params.related_entity_id,
            requested_by: params.requested_by,
        })
        .select('id')
        .single();

    if (dbError) {
        console.error('Failed to log AI request:', dbError);
    }

    return {
        content,
        ai_request_id: aiRequest?.id || '',
        tokens_input,
        tokens_output,
        cost_usd,
    };
}

/**
 * Helper para construir system prompt com contexto do tenant
 */
export async function buildSystemPrompt(tenant_id: string, additional_context?: string): Promise<string> {
    const supabase = await createClient();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*, niche_playbooks(*)')
        .eq('id', tenant_id)
        .single();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    const playbook = tenant.niche_playbooks;

    let systemPrompt = `Você é um assistente especializado em marketing e conteúdo para o nicho de ${tenant.niche}.

CONTEXTO DO CLIENTE:
- Nome: ${tenant.name}
- Tom de voz: ${tenant.tone_of_voice}
- Público-alvo: ${tenant.target_audience.join(', ')}

IDENTIDADE VISUAL:
- Cores primárias: ${JSON.stringify(tenant.brand_colors)}
- Fontes: ${JSON.stringify(tenant.brand_fonts)}`;

    if (playbook) {
        systemPrompt += `\n
PLAYBOOK DO NICHO:
- Saudações padrão: ${JSON.stringify(playbook.default_language?.greetings || [])}
- CTAs típicos: ${JSON.stringify(playbook.default_language?.CTAs || [])}

RESTRIÇÕES LEGAIS E ÉTICAS:
${playbook.legal_restrictions || 'Nenhuma restrição específica.'}

IMPORTANTE: Sempre respeite as restrições legais. Não prometa resultados garantidos. Use linguagem ética e transparente.`;
    }

    if (additional_context) {
        systemPrompt += `\n\nCONTEXTO ADICIONAL:\n${additional_context}`;
    }

    return systemPrompt;
}

/**
 * Função específica: Gerar planejamento mensal de conteúdo
 */
export async function generateContentCalendar(params: {
    tenant_id: string;
    month: number;
    year: number;
    objectives: string[];
    offers: any[];
    strategic_dates: any[];
    custom_instructions?: string;
    requested_by?: string;
}) {
    const systemPrompt = await buildSystemPrompt(params.tenant_id);

    const prompt = `Crie um planejamento estratégico de conteúdo para ${params.month}/${params.year}.

OBJETIVOS DO MÊS:
${params.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

OFERTAS ESPECIAIS:
${params.offers.map((offer) => `- ${offer.title} (${offer.date}): ${offer.description || ''}`).join('\n')}

DATAS ESTRATÉGICAS:
${params.strategic_dates.map((date) => `- ${date.date}: ${date.event}`).join('\n')}

${params.custom_instructions ? `INSTRUÇÕES ADICIONAIS:\n${params.custom_instructions}` : ''}

Retorne um plano em JSON com esta estrutura:
{
  "summary": "Resumo executivo do plano",
  "content_pillars": ["Pilar 1", "Pilar 2", "Pilar 3"],
  "weekly_themes": [
    {"week": 1, "theme": "Tema da semana", "focus": ["Foco 1", "Foco 2"]}
  ],
  "suggested_posts": [
    {
      "date": "YYYY-MM-DD",
      "topic": "Tópico do post",
      "content_type": "post|story|video_script|carousel|reel",
      "platforms": ["instagram_feed", "facebook"],
      "priority": "low|medium|high"
    }
  ]
}

Garanta que haja pelo menos 20 posts sugeridos distribuídos ao longo do mês.`;

    const response = await callClaude({
        tenant_id: params.tenant_id,
        prompt,
        system_prompt: systemPrompt,
        temperature: 0.8,
        max_tokens: 4096,
        request_type: 'generate_calendar',
        requested_by: params.requested_by,
    });

    // Parse JSON da resposta
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
    }

    const aiPlan = JSON.parse(jsonMatch[0]);

    return {
        ai_plan: aiPlan,
        ai_request_id: response.ai_request_id,
        cost_usd: response.cost_usd,
    };
}

/**
 * Função específica: Gerar conteúdo de post individual
 */
export async function generatePostContent(params: {
    tenant_id: string;
    topic: string;
    content_type: string;
    platforms: string[];
    additional_context?: string;
    requested_by?: string;
}) {
    const systemPrompt = await buildSystemPrompt(params.tenant_id, params.additional_context);

    const prompt = `Crie um post sobre: "${params.topic}"

TIPO DE CONTEÚDO: ${params.content_type}
PLATAFORMAS: ${params.platforms.join(', ')}

Retorne em JSON:
{
  "base_copy": "Texto do post (versão base, adaptável)",
  "base_cta": "Call-to-action principal",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "tone": "tom usado (ex: educacional, inspiracional)",
  "image_prompt": "Prompt detalhado para geração de imagem (descreva cenário, estilo, cores, elementos visuais). Seja específico e inclua o contexto da marca."
}

Regras:
- Texto engajador e autêntico
- CTA claro e acionável
- 5-10 hashtags relevantes
- Image prompt deve ser em inglês, detalhado e específico para Gemini`;

    const response = await callClaude({
        tenant_id: params.tenant_id,
        prompt,
        system_prompt: systemPrompt,
        temperature: 0.9,
        max_tokens: 2048,
        request_type: 'generate_content',
        requested_by: params.requested_by,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
    }

    const postData = JSON.parse(jsonMatch[0]);

    return {
        ...postData,
        ai_request_id: response.ai_request_id,
        cost_usd: response.cost_usd,
    };
}
