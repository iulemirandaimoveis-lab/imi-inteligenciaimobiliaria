import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  extractAvailabilityFromCsv,
  type MiguelMarquesStatus,
} from '@/lib/lots/miguel-marques-availability'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/sync-miguel-marques-availability
 *
 * Sincroniza a disponibilidade dos lotes do Loteamento Miguel Marques a partir da
 * planilha "Mi Gestão" (Google Sheets, CSV publicado em `MM_AVAILABILITY_CSV_URL`)
 * para `subdivision_lots`, que o mapa do site já lê. Protegido por CRON_SECRET.
 *
 * Atualiza apenas o `status` de lotes já existentes (casados por quadra+lote) —
 * não cria linhas (evita exigir area_m2). Agendado no vercel.json.
 *
 * Cadência: o cron da Vercel roda 1x/dia no plano atual. Para atualização mais
 * frequente, agende via Supabase (pg_cron) ou aumente a frequência no plano Pro.
 */

const MM_DEV_ID = '8b9f6835-1bd0-4850-80b0-aaef2223300d'

// status do parser (minúsculo) → enum armazenado em subdivision_lots (MAIÚSCULO).
const DB_STATUS: Record<MiguelMarquesStatus, string> = {
  disponivel: 'DISPONIVEL',
  vendido: 'VENDIDO',
  negociacao: 'NEGOCIACAO',
  proprietario: 'PROPRIETARIO',
  igreja: 'IGREJA',
}

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.MM_AVAILABILITY_CSV_URL
  if (!url) {
    return NextResponse.json({ skipped: true, reason: 'MM_AVAILABILITY_CSV_URL não definida' })
  }

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ error: `fetch CSV ${res.status}` }, { status: 502 })
    }
    const availability = extractAvailabilityFromCsv(await res.text())

    // Agrupa por (quadra → status → [lote]) para fazer poucos UPDATEs em lote.
    const groups = new Map<string, { quadra: string; status: string; lotes: number[] }>()
    for (const [id, status] of Object.entries(availability)) {
      const dash = id.lastIndexOf('-')
      const quadra = id.slice(0, dash)
      const lote = parseInt(id.slice(dash + 1), 10)
      if (!quadra || Number.isNaN(lote)) continue
      const dbStatus = DB_STATUS[status]
      const key = `${quadra}|${dbStatus}`
      const g = groups.get(key) ?? { quadra, status: dbStatus, lotes: [] }
      g.lotes.push(lote)
      groups.set(key, g)
    }

    const now = new Date().toISOString()
    let updated = 0
    const errors: string[] = []
    for (const { quadra, status, lotes } of groups.values()) {
      const { error, count } = await supabaseAdmin
        .from('subdivision_lots')
        .update({ status, updated_at: now }, { count: 'exact' })
        .eq('development_id', MM_DEV_ID)
        .eq('quadra', quadra)
        .in('lot_number', lotes)
      if (error) errors.push(`${quadra}/${status}: ${error.message}`)
      else updated += count ?? 0
    }

    return NextResponse.json({
      success: errors.length === 0,
      parsed: Object.keys(availability).length,
      updated,
      errors: errors.slice(0, 10),
      ts: now,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    )
  }
}
