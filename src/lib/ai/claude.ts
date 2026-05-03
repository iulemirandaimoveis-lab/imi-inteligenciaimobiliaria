import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { AIRequest, AIProvider } from '@/types/commercial-system';
import { getRelevantBookContext } from '@/lib/ai/books-context';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

// Pricing per 1M tokens (May 2026)
const MODEL_PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
    'claude-sonnet-4-6':          { input: 3.0,  output: 15.0,  cacheWrite: 3.75,   cacheRead: 0.30  },
    'claude-haiku-4-5-20251001':  { input: 0.25, output: 1.25,  cacheWrite: 0.3125, cacheRead: 0.025 },
    'claude-opus-4-7':            { input: 15.0, output: 75.0,  cacheWrite: 18.75,  cacheRead: 1.50  },
};

function getPricing(model: string) {
    return MODEL_PRICING[model] ?? MODEL_PRICING['claude-sonnet-4-6'];
}

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
    /** Enable Anthropic prompt caching — cuts repeated system-prompt costs ~90% */
    use_cache?: boolean;
}

export interface ClaudeResponse {
    content: string;
    ai_request_id: string;
    tokens_input: number;
    tokens_output: number;
    cost_usd: number;
}

/**
 * Safe JSON extractor for AI responses.
 * Tries direct parse → markdown code block → first JSON object → first JSON array.
 * Throws with context on total failure.
 */
export function parseJsonFromAI<T = unknown>(text: string): T {
    // 1. Direct parse (model returned clean JSON)
    try { return JSON.parse(text.trim()) as T; } catch {}

    // 2. Strip markdown fences  ```json ... ```
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1].trim()) as T; } catch {} }

    // 3. Extract first {...} object (most common case)
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) { try { return JSON.parse(objMatch[0]) as T; } catch {} }

    // 4. Extract first [...] array
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) { try { return JSON.parse(arrMatch[0]) as T; } catch {} }

    throw new Error(`parseJsonFromAI: could not extract JSON from response (first 300 chars): ${text.substring(0, 300)}`);
}

/**
 * Central Claude API caller.
 * Logs every request (success or error) to ai_requests table.
 * Supports prompt caching via use_cache flag.
 */
export async function callClaude(params: ClaudeRequestParams): Promise<ClaudeResponse> {
    const startTime = Date.now();
    const supabase = await createClient();
    const model = params.model || 'claude-sonnet-4-6';
    const temperature = params.temperature ?? 0.7;
    const max_tokens = params.max_tokens || 4096;
    const pricing = getPricing(model);

    let response: Anthropic.Message;
    let status: 'success' | 'error' | 'timeout' = 'success';
    let error_message: string | null = null;

    try {
        // Build system param — use array format with cache_control when caching is requested
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const systemParam: any = params.use_cache && params.system_prompt
            ? [{ type: 'text', text: params.system_prompt, cache_control: { type: 'ephemeral' } }]
            : params.system_prompt;

        const requestOptions = params.use_cache
            ? { headers: { 'anthropic-beta': 'prompt-caching-2024-07-31' } }
            : undefined;

        response = await anthropic.messages.create(
            {
                model,
                max_tokens,
                temperature,
                system: systemParam,
                messages: [{ role: 'user', content: params.prompt }],
            },
            requestOptions
        );
    } catch (error: unknown) {
        status = 'error';
        error_message = error instanceof Error ? error.message : 'Unknown error';

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

    const latency_ms = Date.now() - startTime;

    const textContent = response.content.find((block) => block.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    const tokens_input = response.usage.input_tokens;
    const tokens_output = response.usage.output_tokens;
    const tokens_total = tokens_input + tokens_output;

    // Extended cache usage fields (present when caching is enabled)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = response.usage as any;
    const cache_creation_tokens: number = usage.cache_creation_input_tokens ?? 0;
    const cache_read_tokens: number = usage.cache_read_input_tokens ?? 0;

    const cost_usd =
        (tokens_input       / 1_000_000) * pricing.input +
        (tokens_output      / 1_000_000) * pricing.output +
        (cache_creation_tokens / 1_000_000) * pricing.cacheWrite +
        (cache_read_tokens  / 1_000_000) * pricing.cacheRead;

    const { data: aiRequest } = await supabase
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

    if (!tenant) throw new Error('Tenant not found');

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
 * Gerar planejamento mensal de conteúdo
 */
export async function generateContentCalendar(params: {
    tenant_id: string;
    month: number;
    year: number;
    objectives: string[];
    offers: { title: string; date: string; description?: string }[];
    strategic_dates: { date: string; event: string }[];
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
        use_cache: true,
    });

    const aiPlan = parseJsonFromAI(response.content);
    return { ai_plan: aiPlan, ai_request_id: response.ai_request_id, cost_usd: response.cost_usd };
}

/**
 * Gerar conteúdo de post individual
 */
export async function generatePostContent(params: {
    tenant_id: string;
    topic: string;
    content_type: string;
    platforms: string[];
    additional_context?: string;
    requested_by?: string;
}) {
    const baseSystemPrompt = await buildSystemPrompt(params.tenant_id, params.additional_context);

    const bookContext = await getRelevantBookContext(params.topic || '');
    const systemPrompt = bookContext
        ? `${baseSystemPrompt}\n\nUse o seguinte conhecimento especializado dos livros IMI como base:\n${bookContext}`
        : baseSystemPrompt;

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
        use_cache: true,
    });

    interface PostData {
        base_copy: string;
        base_cta: string;
        hashtags: string[];
        tone: string;
        image_prompt: string;
    }
    const postData = parseJsonFromAI<PostData>(response.content);
    return { ...postData, ai_request_id: response.ai_request_id, cost_usd: response.cost_usd };
}
