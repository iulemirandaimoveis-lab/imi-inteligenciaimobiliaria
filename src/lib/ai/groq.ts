import Groq from 'groq-sdk'

// Groq client — Llama 3.3-70b-versatile (ultrarrápido, gratuito no free tier)
// Ideal para: hashtags, temas, legendas rápidas, imagem_prompt, fallback geral
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface GroqRequest {
    prompt: string
    system_prompt?: string
    model?: string
    temperature?: number
    max_tokens?: number
}

export interface GroqResponse {
    content: string
    tokens_input: number
    tokens_output: number
    cost_usd: number
    model: string
}

export async function callGroq(params: GroqRequest): Promise<GroqResponse> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY não configurada')
    }

    const model = params.model || 'llama-3.3-70b-versatile'
    const temperature = params.temperature ?? 0.7
    const max_tokens = params.max_tokens || 2048

    const messages: Groq.Chat.ChatCompletionMessageParam[] = []

    if (params.system_prompt) {
        messages.push({ role: 'system', content: params.system_prompt })
    }
    messages.push({ role: 'user', content: params.prompt })

    const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
    })

    const content = completion.choices[0]?.message?.content || ''
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0

    // Groq Llama 3.3-70b: $0.59/$0.79 por 1M tokens (tier pago)
    const cost_usd = (inputTokens * 0.59 + outputTokens * 0.79) / 1_000_000

    return { content, tokens_input: inputTokens, tokens_output: outputTokens, cost_usd, model }
}
