import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lots/proposal/status?token=<token> — status PÚBLICO e minimalista de
 * uma proposta originada do carrinho de lotes, para a página /carrinho.
 *
 * Autorização por token secreto (mesmo padrão de /api/proposals/respond, P15) —
 * nunca aceita o id da proposta. Devolve só os campos de status; nada de PII do
 * cliente (nome/telefone/documentos ficam em `metadata`, não expostos aqui).
 */
export async function GET(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = await rateLimit(`lot-proposal-status:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 })
  }

  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 400 })
  }

  const { data: proposal } = await supabaseAdmin
    .from('proposals')
    .select('status, signature_status, valor_proposta, valor_entrada, pdf_url, signed_pdf_url, created_at, updated_at')
    .eq('token', token)
    .single()

  if (!proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ proposal })
}
