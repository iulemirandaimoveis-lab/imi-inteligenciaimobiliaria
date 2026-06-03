import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lots/reserve
 * Parte 2.1 — Reserva de lote com lock transacional (anti-conflito).
 *
 * Body: { unitId: string, action?: 'reserve' | 'release',
 *         clientName?, clientPhone?, note?, hours? }
 *
 * Auth: somente corretor/gestor (a checagem de role roda dentro da RPC
 * SECURITY DEFINER `reserve_lot` / `release_lot`). O lock de concorrência é
 * garantido por SELECT ... FOR UPDATE no Postgres — dois cliques simultâneos
 * nunca reservam o mesmo lote.
 */

// Mapeia ERRCODE/mensagem do Postgres para HTTP + mensagem amigável.
function mapDbError(message: string): { status: number; error: string } {
  if (message.includes('NOT_AUTHORIZED'))
    return { status: 403, error: 'Apenas corretores/gestores podem reservar lotes.' }
  if (message.includes('LOT_NOT_FOUND'))
    return { status: 404, error: 'Lote não encontrado.' }
  if (message.includes('LOT_ALREADY_RESERVED') || message.includes('LOT_NOT_AVAILABLE'))
    return { status: 409, error: 'Este lote já foi reservado ou não está disponível.' }
  if (message.includes('uniq_active_reservation_per_unit'))
    return { status: 409, error: 'Este lote já possui uma reserva ativa.' }
  return { status: 500, error: 'Falha ao processar a reserva.' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { unitId, action = 'reserve', clientName, clientPhone, note, hours } = body
    if (!unitId || typeof unitId !== 'string') {
      return NextResponse.json({ error: 'unitId é obrigatório.' }, { status: 400 })
    }

    if (action === 'release') {
      const { data, error } = await supabase.rpc('release_lot', {
        p_lot_id: unitId,
        p_reason: note ?? null,
      })
      if (error) {
        const m = mapDbError(error.message)
        return NextResponse.json({ error: m.error }, { status: m.status })
      }
      return NextResponse.json({ ok: true, unit: data })
    }

    const { data, error } = await supabase.rpc('reserve_lot', {
      p_lot_id: unitId,
      p_client_name: clientName ?? null,
      p_client_phone: clientPhone ?? null,
      p_note: note ?? null,
      p_hours: typeof hours === 'number' ? hours : 48,
    })
    if (error) {
      const m = mapDbError(error.message)
      return NextResponse.json({ error: m.error }, { status: m.status })
    }
    return NextResponse.json({ ok: true, reservation: data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro inesperado.' },
      { status: 500 },
    )
  }
}
