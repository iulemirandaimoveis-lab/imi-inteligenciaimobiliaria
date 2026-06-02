import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePTAMHtml } from '@/lib/valuation/generate-ptam-html'
import { AVALIADOR } from '@/config/avaliador'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Fetch avaliação
    const { data: avaliacao, error: avError } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (avError || !avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Fetch evaluator profile
    const evaluatorId = avaliacao.avaliador_id || user.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, phone, creci, company, job_title')
      .eq('id', evaluatorId)
      .single()

    // Fetch development if linked
    let development: Record<string, unknown> | null = null
    if (avaliacao.development_id) {
      const { data: dev } = await supabase
        .from('developments')
        .select('name, address, location, neighborhood, city, state')
        .eq('id', avaliacao.development_id)
        .single()
      if (dev) development = dev as Record<string, unknown>
    }

    // Build evaluator display info (prefer profile data, fallback to AVALIADOR config)
    const evaluatorName = profile?.name || AVALIADOR.nome
    const evaluatorCRECI = profile?.creci || AVALIADOR.creci
    const evaluatorPhone = profile?.phone || AVALIADOR.telefone
    const evaluatorEmail = profile?.email || AVALIADOR.email
    const evaluatorCompany = profile?.company || AVALIADOR.empresa

    // Parse comparáveis from JSONB column
    const rawComps = avaliacao.comparaveis
    const comparables: Record<string, unknown>[] = Array.isArray(rawComps) ? rawComps : []

    // Build result object from stored values
    const area = Number(avaliacao.area_privativa || avaliacao.area_total || 100)
    const avgM2 = Number(avaliacao.valor_m2 || avaliacao.valor_unitario || 0)
    const estimatedValue = Number(avaliacao.valor_estimado || 0)
    const valorMin = Number(avaliacao.valor_minimo || estimatedValue * 0.85)
    const valorMax = Number(avaliacao.valor_maximo || estimatedValue * 1.15)

    // Rebuild result from stored motor result or calculate from comparables
    let result = avaliacao.resultado_motor as Record<string, unknown> | null
    if (!result && comparables.length > 0) {
      const values = comparables.map((c: Record<string, unknown>) =>
        Number(c.homogenized_price_per_sqm || 0)
      ).filter(v => v > 0)
      if (values.length > 0) {
        const avg2 = values.reduce((a: number, b: number) => a + b, 0) / values.length
        const sorted = [...values].sort((a: number, b: number) => a - b)
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        const variance = values.reduce((s: number, v: number) => s + (v - avg2) ** 2, 0) / Math.max(values.length - 1, 1)
        const std = Math.sqrt(variance)
        const cv = avg2 > 0 ? (std / avg2) * 100 : 0
        let grade: 'I' | 'II' | 'III' = 'I'
        if (comparables.length >= 5 && cv <= 30) grade = 'II'
        if (comparables.length >= 6 && cv <= 25) grade = 'III'
        result = {
          average_price_per_sqm: avg2,
          median_price_per_sqm: median,
          std_deviation: std,
          coefficient_of_variation: cv,
          estimated_value: avg2 * area,
          confidence_grade: grade,
          comparables: comparables.map((c: Record<string, unknown>) => ({
            ...c,
            homogenized_price_per_sqm: Number(c.homogenized_price_per_sqm || 0),
          })),
        }
      }
    }

    if (!result) {
      result = {
        average_price_per_sqm: avgM2,
        median_price_per_sqm: avgM2,
        std_deviation: 0,
        coefficient_of_variation: 0,
        estimated_value: estimatedValue,
        confidence_grade: (avaliacao.grau_fundamentacao || 'I') as 'I' | 'II' | 'III',
        comparables: [],
        valor_minimo: valorMin,
        valor_maximo: valorMax,
      }
    }

    // Photos from fotos_laudo or fotos
    const rawPhotos = avaliacao.fotos_laudo || avaliacao.fotos
    const photos: { url: string; name?: string; caption?: string }[] = Array.isArray(rawPhotos)
      ? rawPhotos.filter((p: unknown) => {
          if (typeof p === 'string') return true
          if (typeof p === 'object' && p !== null && 'url' in p) return true
          return false
        }).map((p: unknown) => {
          if (typeof p === 'string') return { url: p }
          return p as { url: string; name?: string; caption?: string }
        })
      : []

    const html = generatePTAMHtml({
      valuation: {
        ...avaliacao,
        subject_area_sqm: area,
        purpose: avaliacao.finalidade,
        method: avaliacao.metodologia || 'Comparativo Direto de Dados de Mercado',
        requester_name: avaliacao.cliente_nome || avaliacao.solicitante_nome,
        protocolo: avaliacao.protocolo || `AVL-${(avaliacao.id as string).slice(0, 8).toUpperCase()}`,
      } as Record<string, unknown>,
      development: development || {
        name: avaliacao.endereco,
        address: [avaliacao.bairro, avaliacao.cidade, avaliacao.estado].filter(Boolean).join(', '),
      },
      comparables,
      result: result as unknown as Parameters<typeof generatePTAMHtml>[0]['result'],
      evaluatorName,
      evaluatorCRECI,
      evaluatorPhone,
      evaluatorEmail,
      evaluatorCompany,
      photos,
      valorMinimo: valorMin,
      valorMaximo: valorMax,
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="PTAM-${avaliacao.protocolo || params.id.slice(0, 8)}.html"`,
      },
    })
  } catch (err) {
    console.error('[AVALIACOES_EXPORT]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
