import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/lotmap/dashboard/[developmentId]
 * Returns executive stats for a development: counts by status, VGV breakdown,
 * top negotiators, expiring reservations. Requires manager role.
 */

interface Props {
  params: Promise<{ developmentId: string }>
}

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { developmentId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin','manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso restrito a gestores.' }, { status: 403 })
    }

    // Lots stats
    const { data: lots } = await supabase
      .from('subdivision_lots')
      .select('id, status, price, quadra, lot_number')
      .eq('development_id', developmentId)

    if (!lots || lots.length === 0) {
      return NextResponse.json({
        total: 0, byStatus: {}, vgv: { total: 0, sold: 0, available: 0, negotiation: 0 },
        topQuadras: [], expiring: [], lotsByBroker: [],
      })
    }

    // Status distribution
    const byStatus: Record<string, number> = {}
    let vgvTotal = 0, vgvSold = 0, vgvAvail = 0, vgvNeg = 0

    for (const l of lots) {
      const s = String(l.status ?? '').toUpperCase()
      byStatus[s] = (byStatus[s] ?? 0) + 1
      const p = Number(l.price ?? 0)
      vgvTotal += p
      if (s === 'VENDIDO')    vgvSold += p
      if (s === 'DISPONIVEL') vgvAvail += p
      if (s === 'NEGOCIACAO') vgvNeg  += p
    }

    // Quadra distribution (top 5 by negotiation count)
    const quadraMap: Record<string, { negotiation: number; available: number; sold: number }> = {}
    for (const l of lots) {
      const q = l.quadra ?? '?'
      if (!quadraMap[q]) quadraMap[q] = { negotiation: 0, available: 0, sold: 0 }
      const s = String(l.status ?? '').toUpperCase()
      if (s === 'NEGOCIACAO')   quadraMap[q].negotiation++
      if (s === 'DISPONIVEL')   quadraMap[q].available++
      if (s === 'VENDIDO')      quadraMap[q].sold++
    }
    const topQuadras = Object.entries(quadraMap)
      .sort(([,a],[,b]) => b.negotiation - a.negotiation)
      .slice(0, 8)
      .map(([quadra, stats]) => ({ quadra, ...stats }))

    // Expiring reservations (next 48h)
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { data: reservations } = await supabase
      .from('lot_reservations')
      .select('id, lot_id, client_name, broker_name, reserved_at, expires_at, status')
      .eq('development_id', developmentId)
      .eq('status', 'ativa')
      .lte('expires_at', in48h.toISOString())
      .order('expires_at', { ascending: true })
      .limit(20)

    // Broker activity from lot_status_history (last 30 days)
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { data: history } = await supabase
      .from('lot_status_history')
      .select('metadata, new_status, changed_at')
      .eq('development_id', developmentId)
      .gte('changed_at', since30d.toISOString())
      .in('new_status', ['NEGOCIACAO','RESERVADO','VENDIDO'])

    const brokerMap: Record<string, { negotiation: number; reservation: number; sale: number }> = {}
    for (const h of history ?? []) {
      const bname = (h.metadata as Record<string, string> | null)?.broker_name
      if (!bname || bname === 'corretor_nao_informado') continue
      if (!brokerMap[bname]) brokerMap[bname] = { negotiation: 0, reservation: 0, sale: 0 }
      const s = String(h.new_status ?? '').toUpperCase()
      if (s === 'NEGOCIACAO') brokerMap[bname].negotiation++
      if (s === 'RESERVADO')  brokerMap[bname].reservation++
      if (s === 'VENDIDO')    brokerMap[bname].sale++
    }
    const lotsByBroker = Object.entries(brokerMap)
      .sort(([,a],[,b]) => (b.sale + b.reservation + b.negotiation) - (a.sale + a.reservation + a.negotiation))
      .slice(0, 10)
      .map(([name, stats]) => ({ name, ...stats }))

    return NextResponse.json({
      total: lots.length,
      byStatus,
      vgv: {
        total:       vgvTotal,
        sold:        vgvSold,
        available:   vgvAvail,
        negotiation: vgvNeg,
        reserved:    vgvTotal - vgvSold - vgvAvail - vgvNeg,
      },
      topQuadras,
      expiring:    reservations ?? [],
      lotsByBroker,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro inesperado.' },
      { status: 500 },
    )
  }
}
