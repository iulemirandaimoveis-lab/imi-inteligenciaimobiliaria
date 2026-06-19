import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  generateQrHash,
  buildVerificacaoUrl,
  generateQrSvg,
  generateQrDataUrl,
} from '@/lib/avaliacoes/qr-laudo'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: av, error: avError } = await supabase
    .from('avaliacoes')
    .select('id, numero_laudo, qr_hash, qr_verificacao_url, endereco, created_at')
    .eq('id', params.id)
    .single()

  if (avError || !av) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
  }

  let { numero_laudo, qr_hash, qr_verificacao_url } = av

  // Lazy-generate if not yet created
  if (!numero_laudo || !qr_hash) {
    if (!numero_laudo) {
      const { data: numData, error: numError } = await supabase.rpc(
        'generate_numero_laudo'
      )
      if (numError || !numData) {
        return NextResponse.json(
          { error: 'Erro ao gerar número do laudo' },
          { status: 500 }
        )
      }
      numero_laudo = numData as string
    }

    qr_hash = generateQrHash({
      id: av.id,
      numero_laudo,
      endereco: av.endereco || '',
      created_at: av.created_at,
    })

    qr_verificacao_url = buildVerificacaoUrl(qr_hash)

    await supabaseAdmin
      .from('avaliacoes')
      .update({ numero_laudo, qr_hash, qr_verificacao_url })
      .eq('id', params.id)
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  if (format === 'svg') {
    const svg = await generateQrSvg(qr_verificacao_url!)
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  }

  const [svg, dataUrl] = await Promise.all([
    generateQrSvg(qr_verificacao_url!),
    generateQrDataUrl(qr_verificacao_url!),
  ])

  return NextResponse.json({
    numero_laudo,
    qr_hash,
    qr_verificacao_url,
    svg,
    data_url: dataUrl,
  })
}
