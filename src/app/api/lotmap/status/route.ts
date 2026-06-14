import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lotmap/status
 * Altera o status de um lote. Requer role admin/manager.
 *
 * Body: { lotId, newStatus, reason?, brokerName? }
 * newStatus: DISPONIVEL | NEGOCIACAO | RESERVADO | DOCUMENTACAO | VENDIDO | BLOQUEADO
 */

const VALID_STATUSES = new Set([
  'DISPONIVEL','NEGOCIACAO','RESERVADO','DOCUMENTACAO','VENDIDO','BLOQUEADO','PROPRIETARIO',
])

function mapDbError(msg: string): { status: number; error: string } {
  if (msg.includes('NOT_AUTHORIZED'))  return { status: 403, error: 'Apenas gestores podem alterar o status.' }
  if (msg.includes('LOT_NOT_FOUND'))   return { status: 404, error: 'Lote não encontrado.' }
  if (msg.includes('INVALID_STATUS'))  return { status: 400, error: 'Status inválido.' }
  return { status: 500, error: 'Falha ao alterar status.' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { lotId, newStatus, reason, brokerName } = body

    if (!lotId || typeof lotId !== 'string') {
      return NextResponse.json({ error: 'lotId é obrigatório.' }, { status: 400 })
    }
    if (!newStatus || !VALID_STATUSES.has(String(newStatus).toUpperCase())) {
      return NextResponse.json({ error: 'newStatus inválido.' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('change_lot_status', {
      p_lot_id:      lotId,
      p_new_status:  String(newStatus).toUpperCase(),
      p_reason:      reason     ?? null,
      p_broker_name: brokerName ?? null,
    })

    if (error) {
      const m = mapDbError(error.message)
      return NextResponse.json({ error: m.error }, { status: m.status })
    }

    return NextResponse.json({ ok: true, lot: data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro inesperado.' },
      { status: 500 },
    )
  }
}
