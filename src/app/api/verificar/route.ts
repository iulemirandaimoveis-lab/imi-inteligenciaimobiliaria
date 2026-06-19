import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AVALIADOR } from '@/config/avaliador'

export const dynamic = 'force-dynamic'

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0) + '***'
  return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0) + '.').join(' ')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hash = searchParams.get('hash')
  const numero = searchParams.get('laudo')

  if (!hash && !numero) {
    return NextResponse.json(
      { valid: false, error: 'Informe hash ou número do laudo' },
      { status: 400 }
    )
  }

  let query = supabaseAdmin
    .from('avaliacoes')
    .select(
      'numero_laudo, qr_hash, qr_verificacao_url, created_at, updated_at, ' +
      'endereco, bairro, cidade, estado, tipo_imovel, cliente_nome, ' +
      'valor_estimado, finalidade, metodologia, status, grau_fundamentacao, tipo_laudo'
    )

  if (hash) {
    query = query.eq('qr_hash', hash)
  } else {
    query = query.eq('numero_laudo', numero!)
  }

  const { data: rawData, error } = await query.single()

  if (error || !rawData) {
    return NextResponse.json(
      { valid: false, error: 'Laudo não encontrado no sistema IMI' },
      { status: 404 }
    )
  }

  const data = rawData as Record<string, unknown>

  return NextResponse.json({
    valid: true,
    laudo: {
      numero_laudo: data.numero_laudo as string | null,
      qr_hash: data.qr_hash as string | null,
      emitido_em: data.created_at as string | null,
      atualizado_em: data.updated_at as string | null,
      endereco: data.endereco as string | null,
      bairro: data.bairro as string | null,
      cidade: data.cidade as string | null,
      estado: data.estado as string | null,
      tipo_imovel: data.tipo_imovel as string | null,
      solicitante: data.cliente_nome ? maskName(data.cliente_nome as string) : null,
      valor_estimado: data.valor_estimado as number | null,
      finalidade: data.finalidade as string | null,
      metodologia: data.metodologia as string | null,
      status: data.status as string | null,
      grau_fundamentacao: data.grau_fundamentacao as string | null,
      tipo_laudo: data.tipo_laudo as string | null,
    },
    avaliador: {
      nome: AVALIADOR.nome,
      creci: AVALIADOR.creci,
      cnai: AVALIADOR.cnai,
      empresa: AVALIADOR.empresa,
      site: AVALIADOR.site,
    },
  })
}
