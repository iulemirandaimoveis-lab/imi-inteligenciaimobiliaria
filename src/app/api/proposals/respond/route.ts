// src/app/api/proposals/respond/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/proposals/respond — resposta PÚBLICA do cliente (aceitar / contrapor).
 *
 * F-09 (IDOR): a autorização é feita pelo **token** secreto da proposta (16 bytes,
 * `gen_random_bytes`), validado server-side, NÃO pelo `proposal_id` (UUID não-secreto).
 * A escrita usa `supabaseAdmin` porque o token já provou a posse do link — mesmo
 * padrão de `propostas/[token]/track` (KNOWN_PATTERNS P15). Ver docs/SECURITY_AUDIT F-09.
 */
const Schema = z.object({
  token: z.string().min(16, 'token inválido'),
  action: z.enum(['accepted', 'countered']),
  counter: z
    .object({
      value: z.number().nullable().optional(),
      conditions: z.string().max(2000).optional(),
    })
    .optional(),
})

// Estados a partir dos quais o cliente ainda pode responder.
const RESPONDABLE = new Set(['draft', 'sent', 'viewed', 'negotiating', 'countered'])

export async function POST(req: NextRequest) {
  try {
    // Rota pública que muta estado de proposta: 10 req/min por IP
    const ip = getClientIP(req)
    const rl = await rateLimit(`proposal-respond:${ip}`, { limit: 10, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { token, action, counter } = parsed.data

    if (action === 'countered' && !counter) {
      return NextResponse.json({ error: 'Contraproposta sem dados' }, { status: 400 })
    }

    // Autorização por token (segredo). proposal_id nunca é aceito do cliente.
    const { data: proposal } = await supabaseAdmin
      .from('proposals')
      .select('id, status, expires_at, validity_until')
      .eq('token', token)
      .single()

    if (!proposal) {
      // Token inválido/adulterado/inexistente → 403 (não vaza existência por id)
      return NextResponse.json({ error: 'Proposta não encontrada ou acesso negado' }, { status: 403 })
    }

    // Expiração
    const expiry = proposal.validity_until || proposal.expires_at
    if (expiry && new Date(expiry) < new Date()) {
      if (proposal.status !== 'expired') {
        await supabaseAdmin.from('proposals').update({ status: 'expired' }).eq('id', proposal.id)
      }
      return NextResponse.json({ error: 'Proposta expirada' }, { status: 410 })
    }

    // Integridade de estado (não reprocessa aceita/rejeitada/expirada)
    if (!RESPONDABLE.has(proposal.status)) {
      return NextResponse.json({ error: `Proposta não pode ser respondida no estado "${proposal.status}"` }, { status: 409 })
    }

    if (action === 'accepted') {
      await supabaseAdmin.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id)
      await supabaseAdmin.from('proposal_events').insert({
        proposal_id: proposal.id,
        event_type: 'proposal_accepted',
        metadata: {},
        ip_address: getClientIP(req),
      })
    } else {
      await supabaseAdmin
        .from('proposals')
        .update({
          status: 'countered',
          counter_proposal: { ...counter, created_at: new Date().toISOString() },
        })
        .eq('id', proposal.id)
      await supabaseAdmin.from('proposal_events').insert({
        proposal_id: proposal.id,
        event_type: 'counter_submitted',
        metadata: counter ?? {},
        ip_address: getClientIP(req),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
