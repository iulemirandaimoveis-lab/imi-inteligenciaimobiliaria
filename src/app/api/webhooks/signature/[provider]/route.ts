import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveSignatureProvider, SignatureProviderId, SignatureEventType } from '@/features/proposals/signature'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/signature/[provider]   (provider = clicksign | docusign)
 * Parte 2.3 — recebe eventos do provedor, valida assinatura do webhook, e
 * atualiza o status de assinatura da proposta. Usa service_role (bypassa RLS).
 */

const STATUS_MAP: Record<SignatureEventType, string | null> = {
  enviada: 'enviada',
  assinada: 'assinada',
  recusada: 'recusada',
  expirada: 'expirada',
  desconhecido: null,
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params
  if (providerParam !== 'clicksign' && providerParam !== 'docusign') {
    return NextResponse.json({ error: 'Provedor inválido.' }, { status: 404 })
  }

  try {
    const rawBody = await req.text()
    const headers: Record<string, string | undefined> = {}
    req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })

    const provider = await resolveSignatureProvider(providerParam as SignatureProviderId)
    if (!provider.verifyWebhook({ headers, rawBody })) {
      return NextResponse.json({ error: 'Assinatura do webhook inválida.' }, { status: 401 })
    }

    let payload: unknown
    try { payload = JSON.parse(rawBody) } catch { payload = rawBody }

    const event = provider.parseWebhook(payload)
    if (!event) return NextResponse.json({ ok: true, ignored: 'evento não reconhecido' })

    // Localiza a proposta pelo envelope_id
    const { data: proposal } = await supabaseAdmin
      .from('proposals')
      .select('id')
      .eq('signature_envelope_id', event.envelopeId)
      .maybeSingle()

    // Audita sempre (mesmo sem proposta correspondente)
    await supabaseAdmin.from('proposal_signature_events').insert({
      proposal_id: proposal?.id ?? null,
      provider: provider.id,
      event_type: event.type,
      envelope_id: event.envelopeId,
      raw: payload as object,
    })

    if (proposal) {
      const mapped = STATUS_MAP[event.type]
      if (mapped) {
        const patch: Record<string, unknown> = { signature_status: mapped }
        if (event.type === 'assinada') {
          patch.signature_signed_at = new Date().toISOString()
          if (event.signedPdfUrl) patch.signed_pdf_url = event.signedPdfUrl
          patch.status = 'accepted' // proposals.status: draft|sent|viewed|accepted|rejected|expired
        } else if (event.type === 'recusada') {
          patch.status = 'rejected'
        } else if (event.type === 'expirada') {
          patch.status = 'expired'
        }
        await supabaseAdmin.from('proposals').update(patch).eq('id', proposal.id)
      }
    }

    return NextResponse.json({ ok: true, type: event.type })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, { status: 500 })
  }
}
