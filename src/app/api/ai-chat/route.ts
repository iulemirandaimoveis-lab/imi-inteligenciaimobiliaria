import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveUserPermissions } from '@/lib/ai-chat/permissions'
import { buildContext } from '@/lib/ai-chat/context-engine'
import { estimateCost } from '@/lib/ai-chat/billing'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 2 minutes for long responses

const DEFAULT_SYSTEM_PROMPT = `Você é o assistente de inteligência artificial interno da IMI — Inteligência Imobiliária. Você ajuda corretores, gestores e administradores com informações sobre leads, imóveis, contratos, métricas e operações do dia a dia. Responda sempre em português brasileiro, de forma clara e profissional. Use os dados do sistema fornecidos no contexto para dar respostas precisas e atualizadas.`

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 })

    const { message, model, conversationId, history = [] } = await req.json()
    if (!message || !model) return new Response(JSON.stringify({ error: 'Mensagem e modelo obrigatórios' }), { status: 400 })

    // Get user role from profiles or users table
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    const userRole = profile?.role || 'corretor'

    // Resolve permissions
    const perms = await resolveUserPermissions(user.id, userRole, supabaseAdmin)
    if (!perms.chatEnabled) return new Response(JSON.stringify({ error: 'AI Chat não habilitado para sua conta' }), { status: 403 })
    if (!perms.allowedModels.includes(model)) return new Response(JSON.stringify({ error: `Modelo ${model} não permitido` }), { status: 403 })

    // Check daily usage
    const today = new Date().toISOString().split('T')[0]
    const { count: todayTokens } = await supabaseAdmin.from('ai_chat_usage_log').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00`)
    if ((todayTokens || 0) >= perms.maxConversationsPerDay) {
        return new Response(JSON.stringify({ error: 'Limite diário de conversas atingido', resetAt: `${today}T23:59:59` }), { status: 429 })
    }

    // Build context from Supabase data
    const { data: config } = await supabaseAdmin.from('ai_chat_config').select('system_prompt').single()
    const systemPrompt = config?.system_prompt || DEFAULT_SYSTEM_PROMPT
    const contextData = await buildContext(message, supabaseAdmin)

    // Build messages array
    const messages = [...history.slice(-20).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })), { role: 'user' as const, content: message }]

    // Call Anthropic API with streaming
    const startTime = Date.now()
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }), { status: 500 })

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            stream: true,
            system: [
                { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
                ...(contextData ? [{ type: 'text', text: contextData, cache_control: { type: 'ephemeral' } }] : []),
            ],
            messages,
        }),
    })

    if (!apiRes.ok) {
        const errText = await apiRes.text()
        return new Response(JSON.stringify({ error: 'Erro na API Anthropic', details: errText }), { status: apiRes.status })
    }

    // Stream SSE to frontend
    const encoder = new TextEncoder()
    let fullResponse = ''
    let inputTokens = 0
    let outputTokens = 0

    const readable = new ReadableStream({
        async start(controller) {
            const reader = apiRes.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })

                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        const data = line.slice(6)
                        if (data === '[DONE]') continue

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                fullResponse += parsed.delta.text
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
                            }
                            if (parsed.type === 'message_delta' && parsed.usage) {
                                outputTokens = parsed.usage.output_tokens || 0
                            }
                            if (parsed.type === 'message_start' && parsed.message?.usage) {
                                inputTokens = parsed.message.usage.input_tokens || 0
                            }
                        } catch {
                            /* skip unparseable lines */
                        }
                    }
                }

                const latencyMs = Date.now() - startTime
                const costUsd = estimateCost(model, inputTokens, outputTokens)

                // Save to conversation history
                const convId = conversationId || crypto.randomUUID()
                await supabaseAdmin.from('ai_chat_conversations').upsert({
                    id: convId,
                    user_id: user.id,
                    title: message.slice(0, 80),
                    model,
                    messages: [...history, { role: 'user', content: message }, { role: 'assistant', content: fullResponse }],
                    total_input_tokens: inputTokens,
                    total_output_tokens: outputTokens,
                    estimated_cost_usd: costUsd,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })

                // Log usage
                await supabaseAdmin.from('ai_chat_usage_log').insert({
                    user_id: user.id,
                    conversation_id: convId,
                    model,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    estimated_cost_usd: costUsd,
                    latency_ms: latencyMs,
                })

                // Send final metadata
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: convId, usage: { inputTokens, outputTokens, costUsd, latencyMs } })}\n\n`))
            } catch {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro no streaming' })}\n\n`))
            } finally {
                controller.close()
            }
        }
    })

    return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })
}
