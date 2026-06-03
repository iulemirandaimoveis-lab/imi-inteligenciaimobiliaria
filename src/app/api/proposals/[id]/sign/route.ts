import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveSignatureProvider, SignatureNotConfiguredError, SignerInput, SignatureProviderId } from '@/features/proposals/signature'

export const dynamic = 'force-dynamic'

/**
 * POST /api/proposals/[id]/sign
 * Parte 2.3 — envia a proposta para assinatura eletrônica (Clicksign/DocuSign).
 * Auth: corretor/gestor. Body opcional: { provider?, signers?: [{name,email,phone}] }.
 * A proposta precisa ter `pdf_url`. Persiste envelope_id e link de assinatura.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Apenas corretores/gestores podem enviar para assinatura.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const providerId = body.provider as SignatureProviderId | undefined

    const { data: proposal, error: pErr } = await supabase
      .from('proposals')
      .select('id, title, pdf_url, lead_id, signature_status')
      .eq('id', id)
      .single()
    if (pErr || !proposal) return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
    if (!proposal.pdf_url) {
      return NextResponse.json({ error: 'Gere o PDF da proposta antes de enviar para assinatura.' }, { status: 422 })
    }
    if (proposal.signature_status === 'assinada') {
      return NextResponse.json({ error: 'Proposta já assinada.' }, { status: 409 })
    }

    // Monta signatários: do body, ou a partir do lead vinculado.
    let signers: SignerInput[] = Array.isArray(body.signers) ? body.signers : []
    if (signers.length === 0 && proposal.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('name, email, phone')
        .eq('id', proposal.lead_id)
        .single()
      if (lead?.email) signers = [{ name: lead.name ?? 'Cliente', email: lead.email, phone: lead.phone ?? undefined }]
    }
    if (signers.length === 0) {
      return NextResponse.json({ error: 'Informe ao menos um signatário (nome + e-mail).' }, { status: 422 })
    }

    const provider = await resolveSignatureProvider(providerId)
    const result = await provider.createEnvelope({
      documentName: proposal.title ?? `Proposta ${proposal.id}`,
      pdfUrl: proposal.pdf_url,
      signers,
      metadata: { proposalId: proposal.id },
    })

    const { error: uErr } = await supabase
      .from('proposals')
      .update({
        signature_provider: provider.id,
        signature_envelope_id: result.envelopeId,
        signature_request_url: result.signUrl ?? null,
        signature_status: 'enviada',
        signature_sent_at: new Date().toISOString(),
        signers,
      })
      .eq('id', proposal.id)
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      provider: provider.id,
      envelopeId: result.envelopeId,
      signUrl: result.signUrl ?? null,
    })
  } catch (e) {
    if (e instanceof SignatureNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, { status: 500 })
  }
}
