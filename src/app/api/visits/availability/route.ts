import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { generateAvailability, toRecifeSlotISO } from '@/lib/scheduling/availability'

export const dynamic = 'force-dynamic'

/**
 * GET /api/visits/availability — grade de horários livres do corretor para o
 * cliente escolher a visita. Pública (o cliente ainda não está logado).
 *
 * Query:
 *   brokerPhone — telefone do corretor (identificador de conflito de horário)
 *   brokerId    — (opcional) uuid do corretor
 *   days        — (opcional) horizonte em dias (1–30)
 *
 * Os horários já ocupados vêm de public.visit_bookings (best-effort: se a
 * tabela ainda não existir, a grade sai sem exclusões — a rota nunca quebra).
 */
export async function GET(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = await rateLimit(`visit-availability:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
  }

  const url = new URL(req.url)
  const brokerPhone = (url.searchParams.get('brokerPhone') || '').replace(/\D/g, '')
  const brokerId = url.searchParams.get('brokerId')
  const daysRaw = Number(url.searchParams.get('days'))
  const horizonDays = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.trunc(daysRaw))) : undefined

  // Horários já ocupados do corretor (pendentes/confirmados, futuros).
  const booked = new Set<string>()
  try {
    let q = supabaseAdmin
      .from('visit_bookings')
      .select('scheduled_at, broker_phone, broker_id')
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())

    if (brokerPhone) {
      // Corretor identificado pelo telefone (dígitos) — compara pelo sufixo para
      // tolerar variação de DDI armazenada.
      q = q.ilike('broker_phone', `%${brokerPhone.slice(-8)}%`)
    } else if (brokerId) {
      q = q.eq('broker_id', brokerId)
    }

    const { data } = await q
    for (const row of data ?? []) {
      if (row?.scheduled_at) booked.add(toRecifeSlotISO(row.scheduled_at as string))
    }
  } catch {
    // Tabela ausente / erro → grade sem exclusões (best-effort).
  }

  const availability = generateAvailability(booked, new Date(), horizonDays ? { horizonDays } : {})
  return NextResponse.json(availability, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
