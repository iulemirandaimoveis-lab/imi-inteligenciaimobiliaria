import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lotmap/negotiate
 * Marca um lote como EM NEGOCIAÇÃO com registro de corretor.
 * Requer autenticação. Qualquer usuário autenticado pode iniciar negociação.
 *
 * Body: { lotId, brokerName?, clientName?, clientPhone?, note? }
 */

function mapDbError(msg: string): { status: number; error: string } {
  if (msg.includes('NOT_AUTHORIZED'))                return { status: 403, error: 'Não autorizado.' }
  if (msg.includes('LOT_NOT_FOUND'))                 return { status: 404, error: 'Lote não encontrado.' }
  if (msg.includes('LOT_NOT_AVAILABLE_FOR_NEGOTI'))  return { status: 409, error: 'Lote não está disponível para negociação (reservado ou vendido).' }
  return { status: 500, error: 'Falha ao registrar negociação.' }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { lotId, brokerName, clientName, clientPhone, note } = body

    if (!lotId || typeof lotId !== 'string') {
      return NextResponse.json({ error: 'lotId é obrigatório.' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('negotiate_lot', {
      p_lot_id:       lotId,
      p_broker_name:  brokerName  ?? null,
      p_client_name:  clientName  ?? null,
      p_client_phone: clientPhone ?? null,
      p_note:         note        ?? null,
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
