/**
 * Agno Agents — Proxy para executar agentes específicos
 * ======================================================
 * POST /api/agno/agents?agent_id=lead-qualifier
 *
 * Body:
 *   { message: string, session_id?: string, context?: Record<string, string> }
 *
 * Docs: https://docs.agno.com/agents/introduction
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || 'http://localhost:8001'

const RequestSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória').max(10000),
  session_id: z.string().optional(),
  user_id: z.string().optional(),
  context: z.record(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agent_id')

  if (!agentId) {
    return NextResponse.json(
      { error: 'Parâmetro agent_id é obrigatório' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${AGNO_SERVICE_URL}/agents/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(60_000), // 60s timeout para agentes
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
      return NextResponse.json(
        { error: errorData.detail || 'Erro no Agno service' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json(
        { error: 'Agente demorou muito para responder (timeout 60s)' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      {
        error: 'Agno service indisponível',
        hint: 'cd agno && uvicorn main:app --reload --port 8001',
      },
      { status: 503 }
    )
  }
}
