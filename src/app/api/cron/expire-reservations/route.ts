import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/expire-reservations
 * Parte 2.1 — libera automaticamente reservas de lote vencidas (janela de 48h).
 * Vercel cron: diário (plano Hobby só permite cron diário). Protegido por CRON_SECRET.
 * Rede de segurança adicional: reserve_lot já expira a reserva vencida do próprio
 * lote no momento de uma nova tentativa de reserva (não depende só do cron).
 *
 * Chama a função `expire_lot_reservations()` (SECURITY DEFINER), que marca as
 * reservas 'ativa' com expires_at < now() como 'expirada' e devolve os lotes
 * para 'disponivel' no mapa.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Contexto confiável (protegido por CRON_SECRET) → usa service_role.
    const { data, error } = await supabaseAdmin.rpc('expire_lot_reservations')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, released: data ?? 0, ts: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    )
  }
}
