import { NextRequest, NextResponse } from 'next/server'
import { apiHandler, ApiContext } from '@/lib/api-helpers'
import { calcDetailedScores } from '@/features/properties/services/score.service'
import type { IMIProperty } from '@/features/properties/types'

export const runtime = 'nodejs'

// ─── GET /api/intelligence/lots/recommend ─────────────────────────────────────
// Returns top N ranked lots for a given development, filtered by buyer profile.
// Query params:
//   development_id  — required, e.g. "alto-bellevue"
//   profile         — "investor" | "resident" | "all" (default "all")
//   limit           — 1–10 (default 3)
//
// Public endpoint — no auth required.

type Profile = 'investor' | 'resident' | 'all'

interface RankedLot {
  id: string
  quadra: string
  lot_number: number
  area_m2: number
  price: number
  status: string
  scores: {
    imiScore: number
    location: number
    liquidity: number
    rentabilidade: number
    construtora: number
  }
  rankScore: number
  reasons: string[]
}

function lotToIMIProperty(lot: Record<string, unknown>): IMIProperty {
  return {
    id: String(lot.id),
    name: `Lote ${lot.quadra}-${lot.lot_number}`,
    type: 'loteamento',
    status: String(lot.status ?? 'DISPONIVEL').toLowerCase(),
    price: Number(lot.price) || undefined,
    area: Number(lot.area_m2) || undefined,
    neighborhood: 'Centro',
    city: 'Garanhuns',
    state: 'PE',
    condition: 'pronto',
  } as IMIProperty
}

function rankScore(scores: ReturnType<typeof calcDetailedScores>, profile: Profile): number {
  if (profile === 'investor') {
    return scores.imiScore * 0.35 + scores.rentabilidade * 0.35 + scores.liquidity * 0.20 + scores.location * 0.10
  }
  if (profile === 'resident') {
    return scores.location * 0.40 + scores.liquidity * 0.30 + scores.construtora * 0.20 + scores.imiScore * 0.10
  }
  // "all" — balanced
  return scores.imiScore * 0.25 + scores.location * 0.25 + scores.liquidity * 0.25 + scores.rentabilidade * 0.25
}

function buildReasons(lot: Record<string, unknown>, scores: ReturnType<typeof calcDetailedScores>, profile: Profile): string[] {
  const reasons: string[] = []
  const area = Number(lot.area_m2)
  const price = Number(lot.price)

  if (scores.imiScore >= 75) reasons.push(`IMI Score ${scores.imiScore} — acima da média`)
  if (scores.rentabilidade >= 70) reasons.push(`Rentabilidade estimada forte`)
  if (area >= 400) reasons.push(`Lote grande (${Math.round(area)} m²)`)
  if (price > 0 && area > 0 && price / area < 650) reasons.push(`Preço/m² abaixo da média do condomínio`)
  if (String(lot.special_type) === 'ESQUINA') reasons.push('Lote de esquina — maior valorização')
  if (profile === 'investor' && scores.rentabilidade >= 65) reasons.push('Perfil ideal para investidor')
  if (profile === 'resident' && scores.location >= 65) reasons.push('Boa localização para morar')

  return reasons.slice(0, 3)
}

export const GET = apiHandler(null, async (request: NextRequest, _body: unknown, ctx: ApiContext) => {
  const { supabase } = ctx
  const { searchParams } = new URL(request.url)

  const developmentId = searchParams.get('development_id')
  if (!developmentId?.trim()) {
    return NextResponse.json({ error: 'Parâmetro "development_id" obrigatório' }, { status: 400 })
  }

  const profile = (searchParams.get('profile') ?? 'all') as Profile
  if (!['investor', 'resident', 'all'].includes(profile)) {
    return NextResponse.json({ error: 'profile deve ser "investor", "resident" ou "all"' }, { status: 400 })
  }

  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') ?? '3', 10)))

  const { data: lots, error } = await supabase
    .from('subdivision_lots')
    .select('id, quadra, lot_number, area_m2, price, status, special_type')
    .eq('development_id', developmentId)
    .eq('status', 'DISPONIVEL')
    .gt('price', 0)
    .gt('area_m2', 0)
    .order('area_m2', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!lots || lots.length === 0) {
    return NextResponse.json({ recommendations: [], total_available: 0, profile, development_id: developmentId })
  }

  const ranked: RankedLot[] = lots
    .map(lot => {
      const property = lotToIMIProperty(lot as Record<string, unknown>)
      const scores = calcDetailedScores(property)
      return {
        id: String(lot.id),
        quadra: String(lot.quadra),
        lot_number: Number(lot.lot_number),
        area_m2: Number(lot.area_m2),
        price: Number(lot.price),
        status: String(lot.status),
        scores,
        rankScore: rankScore(scores, profile),
        reasons: buildReasons(lot as Record<string, unknown>, scores, profile),
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit)

  return NextResponse.json({
    recommendations: ranked,
    total_available: lots.length,
    profile,
    development_id: developmentId,
    generated_at: new Date().toISOString(),
  })
})
