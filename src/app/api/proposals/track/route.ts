// src/app/api/proposals/track/route.ts
// Endpoint público de tracking da proposta (public.proposals).
// F-09/F-10: autoriza pelo token secreto (não pelo proposal_id). Ver SECURITY_AUDIT.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  token: z.string().min(16, 'token inválido'),
  event_type: z.string().min(1).max(64),
  metadata: z.record(z.unknown()).optional(),
  time_on_page_seconds: z.number().nonnegative().optional(),
  device_type: z.string().max(32).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req)
    // Tracking é alto volume porém barato: 60/min por IP
    const rl = await rateLimit(`proposal-track:${ip}`, { limit: 60, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    const { token, event_type, metadata, time_on_page_seconds, device_type } = parsed.data

    // Autorização por token (segredo)
    const { data: proposal } = await supabaseAdmin
      .from('proposals')
      .select('id, status')
      .eq('token', token)
      .single()

    if (!proposal) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await supabaseAdmin.from('proposal_events').insert({
      proposal_id: proposal.id,
      event_type,
      metadata: metadata ?? {},
      time_on_page_seconds: time_on_page_seconds ?? null,
      device_type: device_type ?? null,
      ip_address: ip,
      user_agent: req.headers.get('user-agent') ?? null,
    })

    // Avança sent → viewed na primeira abertura
    if (event_type === 'proposal_opened' && proposal.status === 'sent') {
      await supabaseAdmin.from('proposals').update({ status: 'viewed' }).eq('id', proposal.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
