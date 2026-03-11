/**
 * Agno Service — Proxy Root
 * =========================
 * Lista agentes disponíveis e status do serviço.
 *
 * GET /api/agno         → lista agentes
 * GET /api/agno/health  → status do serviço
 *
 * Docs: https://docs.agno.com
 */

import { NextResponse } from 'next/server'

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || 'http://localhost:8001'

export async function GET() {
  try {
    const [healthRes, agentsRes] = await Promise.all([
      fetch(`${AGNO_SERVICE_URL}/health`, { next: { revalidate: 0 } }),
      fetch(`${AGNO_SERVICE_URL}/agents`, { next: { revalidate: 60 } }),
    ])

    if (!healthRes.ok) {
      return NextResponse.json(
        {
          error: 'Agno service indisponível',
          hint: 'Inicie o serviço: cd agno && uvicorn main:app --reload --port 8001',
          service_url: AGNO_SERVICE_URL,
        },
        { status: 503 }
      )
    }

    const [health, agents] = await Promise.all([healthRes.json(), agentsRes.json()])

    return NextResponse.json({ health, ...agents })
  } catch {
    return NextResponse.json(
      {
        error: 'Não foi possível conectar ao Agno service',
        service_url: AGNO_SERVICE_URL,
        hint: 'Verifique se AGNO_SERVICE_URL está configurada e o serviço está rodando',
      },
      { status: 503 }
    )
  }
}
