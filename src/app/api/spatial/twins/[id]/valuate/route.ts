import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const anthropic = new Anthropic()

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: twin, error: twinErr } = await supabase
    .from('property_twins')
    .select('*, twin_rooms(*)')
    .eq('id', params.id)
    .single()

  if (twinErr || !twin) {
    return NextResponse.json({ error: 'Twin não encontrado' }, { status: 404 })
  }

  const { data: property } = await supabase
    .from('imi_properties')
    .select('code, title, bedrooms, suites, bathrooms, parking_spaces, private_area_m2, total_area_m2, tower, floor')
    .eq('id', twin.property_id)
    .single()

  const rooms: Array<{ name: string; kind: string; area_m2?: number }> = twin.twin_rooms ?? []
  const measurements = twin.measurements as Record<string, number | undefined> ?? {}

  const prompt = `Você é um avaliador imobiliário especialista no mercado brasileiro.
Com base nos dados espaciais do imóvel abaixo, gere uma pré-avaliação técnica.

## Dados do imóvel
${property ? `- Código: ${property.code}
- Dormitórios: ${property.bedrooms ?? '?'} (${property.suites ?? 0} suítes)
- Banheiros: ${property.bathrooms ?? '?'}
- Vagas: ${property.parking_spaces ?? '?'}
- Área privativa: ${property.private_area_m2 ?? '?'} m²
- Área total: ${property.total_area_m2 ?? '?'} m²
${property.tower ? `- Torre: ${property.tower}, Andar: ${property.floor}` : ''}` : '(sem dados cadastrais)'}

## Dados espaciais capturados
- Provedor: ${twin.provider}
- Total de ambientes detectados: ${rooms.length}
${rooms.length > 0 ? rooms.map(r => `  - ${r.name} (${r.kind})${r.area_m2 ? `: ${r.area_m2} m²` : ''}`).join('\n') : '  (nenhum)'}

## Medições
${Object.keys(measurements).length > 0
  ? Object.entries(measurements).map(([k, v]) => `- ${k}: ${v}`).join('\n')
  : '(sem medições)'}

## Responda em JSON com exatamente esta estrutura:
{
  "marketValue": <número em BRL>,
  "rentalValue": <número em BRL ou null>,
  "confidence": <0.0 a 1.0>,
  "detectedFeatures": ["feature1", "feature2", ...],
  "notes": "justificativa técnica em 2-3 frases"
}

Regras:
- marketValue deve ser realista para o mercado brasileiro atual
- confidence reduz se dados forem incompletos
- detectedFeatures lista atributos positivos e negativos detectados
- Responda APENAS o JSON, sem markdown`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  let parsed: {
    marketValue: number
    rentalValue: number | null
    confidence: number
    detectedFeatures: string[]
    notes: string
  }

  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json(
      { error: 'Falha ao interpretar resposta da IA', raw },
      { status: 502 }
    )
  }

  const { data: valuation, error: valErr } = await supabase
    .from('spatial_valuations')
    .insert({
      property_id: twin.property_id,
      twin_id: twin.id,
      market_value: parsed.marketValue,
      rental_value: parsed.rentalValue ?? null,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      currency: 'BRL',
      method: 'ai_spatial',
      detected_features: parsed.detectedFeatures ?? [],
      comparable_ids: [],
      notes: parsed.notes ?? null,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (valErr || !valuation) {
    return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 })
  }

  return NextResponse.json({ data: valuation }, { status: 201 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spatial_valuations')
    .select('*')
    .eq('twin_id', params.id)
    .order('generated_at', { ascending: false })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
