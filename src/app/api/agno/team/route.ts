/**
 * Agno Team — Proxy para o time completo com auto-routing
 * =========================================================
 * POST /api/agno/team
 *
 * O team leader decide automaticamente qual agente usar.
 * Ideal para o chat geral do backoffice.
 *
 * Body:
 *   { message: string, session_id?: string, context?: Record<string, string> }
 *
 * Docs: https://docs.agno.com/teams/introduction
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
    const res = await fetch(`${AGNO_SERVICE_URL}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(90_000), // 90s — time pode demorar mais
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
        { error: 'O time demorou muito para responder (timeout 90s)' },
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
