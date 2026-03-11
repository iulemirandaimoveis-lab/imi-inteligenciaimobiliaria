/**
 * Agno — Proxy de Streaming SSE
 * ================================
 * Faz proxy do streaming SSE do serviço Python Agno para o cliente Next.js.
 *
 * POST /api/agno/stream?agent_id=lead-qualifier
 * POST /api/agno/stream?agent_id=team
 *
 * Body: { message: string, session_id?: string, context?: Record<string, string> }
 *
 * Resposta (SSE):
 *   data: {"content": "...", "done": false}
 *   data: {"content": "último trecho", "done": true}
 *   data: {"error": "mensagem", "done": true}
 *
 * Docs: https://docs.agno.com/agents/introduction
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || 'http://localhost:8001'

const RequestSchema = z.object({
  message: z.string().min(1).max(10000),
  session_id: z.string().optional(),
  user_id: z.string().optional(),
  context: z.record(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agent_id') || 'team'

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Dados inválidos', details: parsed.error.flatten() }),
      { status: 400 }
    )
  }

  // Determina o endpoint de streaming no serviço Python
  const upstreamUrl =
    agentId === 'team'
      ? `${AGNO_SERVICE_URL}/team/stream`
      : `${AGNO_SERVICE_URL}/agents/${agentId}/stream`

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      // Sem AbortSignal.timeout — streaming pode ser longo
    })

    if (!upstreamRes.ok) {
      const err = await upstreamRes.json().catch(() => ({ detail: 'Erro no Agno service' }))
      return new Response(
        `data: ${JSON.stringify({ error: err.detail || 'Erro no agente', done: true })}\n\n`,
        {
          status: 200, // mantém 200 para o EventSource não fechar
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        }
      )
    }

    // Proxy do stream diretamente para o cliente
    return new Response(upstreamRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    const isOffline = message.includes('ECONNREFUSED') || message.includes('fetch failed')

    const errorPayload = isOffline
      ? { error: 'Agno service offline. Execute: cd agno && uvicorn main:app --reload --port 8001', done: true }
      : { error: message, done: true }

    return new Response(`data: ${JSON.stringify(errorPayload)}\n\n`, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  }
}
