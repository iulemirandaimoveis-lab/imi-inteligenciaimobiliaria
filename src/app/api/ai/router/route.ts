// ============================================
// SCRIPT 0 — API ROUTE: AI ROUTER UNIFICADO
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/api/ai/router/route.ts
 *
 * Central de roteamento multi-modelo.
 * Suporta: Claude (Anthropic), GPT (OpenAI), Gemini (Google), Kling (video)
 * Cada task_type é mapeado para o modelo ideal com fallback automático.
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AIModel =
    | 'claude-sonnet'
    | 'claude-haiku'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'gemini-pro'
    | 'gemini-flash'
    | 'kling'

export type TaskType =
    | 'tema'           // Geração de tema/pauta
    | 'roteiro'        // Roteiro longo, copywriting
    | 'legenda'        // Caption redes sociais
    | 'descricao'      // Descrição de imóvel
    | 'hashtags'       // Hashtags relevantes
    | 'email'          // Texto de email marketing
    | 'imagem_prompt'  // Prompt otimizado para geração de imagem
    | 'imagem'         // Geração de imagem (Gemini/DALL-E)
    | 'video'          // Geração de vídeo curto (Kling)
    | 'analise_lead'   // Qualificação de lead
    | 'custom'         // Qualquer prompt personalizado

export interface AIRouterRequest {
    task_type: TaskType
    prompt: string
    context?: string
    model_override?: AIModel
    temperature?: number
    max_tokens?: number
    aspect_ratio?: '1:1' | '4:5' | '9:16' | '16:9'
    platform?: 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'email' | 'blog'
    tenant_id?: string
}

export interface AIRouterResponse {
    success: boolean
    result: string
    model_used: AIModel
    task_type: TaskType
    tokens_input?: number
    tokens_output?: number
    cost_usd?: number
    image_url?: string
    fallback_used?: boolean
    error?: string
}

// ─── Mapeamento de modelo por task ─────────────────────────────────────────

const MODEL_ROUTING: Record<TaskType, { primary: AIModel; fallback: AIModel }> = {
    tema: { primary: 'claude-haiku', fallback: 'gemini-flash' },
    roteiro: { primary: 'claude-sonnet', fallback: 'gpt-4o' },
    legenda: { primary: 'gemini-flash', fallback: 'claude-haiku' },
    descricao: { primary: 'claude-haiku', fallback: 'gemini-flash' },
    hashtags: { primary: 'gemini-flash', fallback: 'claude-haiku' },
    email: { primary: 'claude-sonnet', fallback: 'gpt-4o' },
    imagem_prompt: { primary: 'claude-haiku', fallback: 'gemini-flash' },
    imagem: { primary: 'gemini-pro', fallback: 'gpt-4o' },
    video: { primary: 'kling', fallback: 'kling' },
    analise_lead: { primary: 'claude-sonnet', fallback: 'gpt-4o' },
    custom: { primary: 'claude-sonnet', fallback: 'gpt-4o' },
}

// ─── System prompts por task ────────────────────────────────────────────────

function buildSystemPrompt(task_type: TaskType, platform?: string): string {
    const base = `Você é um especialista em marketing imobiliário de alto padrão para o mercado de Recife/Pernambuco, Brasil.
A empresa é IMI — Iule Miranda Imóveis, focada em imóveis premium (R$ 400k–R$ 5M+) nos bairros Boa Viagem, Pina, Piedade, Setúbal e Candeias.
Tom: institucional, sofisticado, sem exageros. Nunca use clichês como "seu sonho" ou "o lar perfeito".`

    const taskInstructions: Record<TaskType, string> = {
        tema: 'Gere pautas estratégicas e relevantes para o público-alvo (investidores, família de alta renda, compradores internacionais). Responda em JSON com: {titulo, objetivo, publico_alvo, formato_sugerido, palavras_chave}',
        roteiro: 'Crie roteiros de conteúdo detalhados, com estrutura clara: gancho, desenvolvimento, CTA. Adapte ao contexto fornecido.',
        legenda: `Escreva legendas para ${platform || 'redes sociais'}. Máximo 300 caracteres para Instagram, 600 para LinkedIn. Inclua CTA sutil.`,
        descricao: 'Escreva descrições técnicas e elegantes de imóveis. Destaque localização, diferenciais construtivos e potencial de valorização.',
        hashtags: 'Gere até 25 hashtags relevantes em PT-BR. Misture: alta relevância (#imoveis), nicho (#BoaViagem), específicas (#IMI). Responda apenas com as hashtags separadas por espaço.',
        email: 'Escreva emails de marketing imobiliário com subject line impactante, abertura personalizada e CTA direto.',
        imagem_prompt: 'Otimize o prompt fornecido para geração de imagem fotorrealista de imóvel premium em Recife. Use termos técnicos de fotografia e arquitetura. Responda apenas com o prompt otimizado.',
        imagem: 'Gere uma imagem de alta qualidade para marketing imobiliário.',
        video: 'Processe a geração de vídeo curto.',
        analise_lead: 'Analise o perfil do lead e retorne JSON com: {score (0-100), perfil, necessidades, imovel_ideal, proximo_passo, urgencia}',
        custom: 'Execute a tarefa conforme o prompt fornecido.',
    }

    return `${base}\n\n${taskInstructions[task_type]}`
}

// ─── Chamada Claude ─────────────────────────────────────────────────────────

async function callClaude(
    prompt: string,
    systemPrompt: string,
    model: 'claude-sonnet' | 'claude-haiku',
    temperature: number,
    max_tokens: number
): Promise<{ result: string; tokens_input: number; tokens_output: number; cost_usd: number }> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

    const modelId = model === 'claude-sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens,
            temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Claude API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0

    // Custo estimado (Sonnet: $3/$15 por M tokens; Haiku: $0.25/$1.25)
    const costPer1M = model === 'claude-sonnet'
        ? { input: 3, output: 15 }
        : { input: 0.25, output: 1.25 }

    const cost_usd = (inputTokens * costPer1M.input + outputTokens * costPer1M.output) / 1_000_000

    return {
        result: data.content?.[0]?.text || '',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd,
    }
}

// ─── Chamada GPT ─────────────────────────────────────────────────────────────

async function callGPT(
    prompt: string,
    systemPrompt: string,
    model: 'gpt-4o' | 'gpt-4o-mini',
    temperature: number,
    max_tokens: number
): Promise<{ result: string; tokens_input: number; tokens_output: number; cost_usd: number }> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

    const modelId = model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o-mini'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens,
            temperature,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
        }),
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`OpenAI API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    const inputTokens = data.usage?.prompt_tokens || 0
    const outputTokens = data.usage?.completion_tokens || 0

    // Custo estimado (gpt-4o: $2.50/$10; mini: $0.15/$0.60)
    const costPer1M = model === 'gpt-4o'
        ? { input: 2.5, output: 10 }
        : { input: 0.15, output: 0.60 }

    const cost_usd = (inputTokens * costPer1M.input + outputTokens * costPer1M.output) / 1_000_000

    return {
        result: data.choices?.[0]?.message?.content || '',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd,
    }
}

// ─── Chamada Gemini ──────────────────────────────────────────────────────────

async function callGemini(
    prompt: string,
    systemPrompt: string,
    model: 'gemini-pro' | 'gemini-flash',
    temperature: number,
    max_tokens: number
): Promise<{ result: string; tokens_input: number; tokens_output: number; cost_usd: number }> {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY não configurada')

    const modelId = model === 'gemini-pro' ? 'gemini-2.0-pro' : 'gemini-2.0-flash'

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: max_tokens,
                },
            }),
        }
    )

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Gemini API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    const inputTokens = data.usageMetadata?.promptTokenCount || 0
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0

    // Gemini Flash é praticamente gratuito; Pro: ~$0.07/$0.30 por 1M tokens
    const costPer1M = model === 'gemini-pro'
        ? { input: 0.07, output: 0.30 }
        : { input: 0.00, output: 0.00 }

    const cost_usd = (inputTokens * costPer1M.input + outputTokens * costPer1M.output) / 1_000_000

    return {
        result: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd,
    }
}

// ─── Stub Kling (video) ──────────────────────────────────────────────────────

async function callKling(prompt: string): Promise<{ result: string; cost_usd: number }> {
    // TODO: Integrar Kling API quando disponível
    // https://klingai.com/api (aguardando acesso)
    console.warn('Kling API não configurada — retornando stub')
    return {
        result: JSON.stringify({
            status: 'queued',
            job_id: `kling_${Date.now()}`,
            estimated_seconds: 120,
            prompt_received: prompt,
            message: 'Geração de vídeo será processada quando Kling API for configurada.',
        }),
        cost_usd: 0,
    }
}

// ─── Handler principal ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body: AIRouterRequest = await request.json()

        if (!body.task_type || !body.prompt) {
            return NextResponse.json({ error: 'task_type e prompt são obrigatórios' }, { status: 400 })
        }

        const routing = MODEL_ROUTING[body.task_type]
        const model = body.model_override || routing.primary
        const temperature = body.temperature ?? 0.7
        const max_tokens = body.max_tokens || 2048
        const systemPrompt = buildSystemPrompt(body.task_type, body.platform)

        const fullPrompt = body.context
            ? `${body.context}\n\n---\n\n${body.prompt}`
            : body.prompt

        let result: AIRouterResponse
        let fallback_used = false

        async function executeWithFallback(primaryModel: AIModel): Promise<{
            result: string
            tokens_input?: number
            tokens_output?: number
            cost_usd?: number
            image_url?: string
            model_used: AIModel
        }> {
            const tryModel = async (m: AIModel) => {
                if (m === 'claude-sonnet' || m === 'claude-haiku') {
                    return { ...(await callClaude(fullPrompt, systemPrompt, m, temperature, max_tokens)), model_used: m }
                }
                if (m === 'gpt-4o' || m === 'gpt-4o-mini') {
                    return { ...(await callGPT(fullPrompt, systemPrompt, m, temperature, max_tokens)), model_used: m }
                }
                if (m === 'gemini-pro' || m === 'gemini-flash') {
                    return { ...(await callGemini(fullPrompt, systemPrompt, m, temperature, max_tokens)), model_used: m }
                }
                if (m === 'kling') {
                    const r = await callKling(fullPrompt)
                    return { result: r.result, cost_usd: r.cost_usd, model_used: m }
                }
                throw new Error(`Modelo desconhecido: ${m}`)
            }

            try {
                return await tryModel(primaryModel)
            } catch (primaryErr) {
                console.error(`Primary model ${primaryModel} failed:`, primaryErr)
                const fallbackModel = routing.fallback
                if (fallbackModel !== primaryModel) {
                    fallback_used = true
                    console.warn(`Falling back to ${fallbackModel}`)
                    return await tryModel(fallbackModel)
                }
                throw primaryErr
            }
        }

        const execution = await executeWithFallback(model)

        result = {
            success: true,
            result: execution.result,
            model_used: execution.model_used,
            task_type: body.task_type,
            tokens_input: execution.tokens_input,
            tokens_output: execution.tokens_output,
            cost_usd: execution.cost_usd,
            image_url: execution.image_url,
            fallback_used,
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('AI Router error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Erro interno no AI Router',
                result: '',
                model_used: 'claude-sonnet' as AIModel,
                task_type: 'custom' as TaskType,
            } as AIRouterResponse,
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        description: 'IMI AI Router — Multi-model orchestration',
        models_available: ['claude-sonnet', 'claude-haiku', 'gpt-4o', 'gpt-4o-mini', 'gemini-pro', 'gemini-flash', 'kling'],
        task_types: Object.keys(MODEL_ROUTING),
        routing: MODEL_ROUTING,
    })
}
