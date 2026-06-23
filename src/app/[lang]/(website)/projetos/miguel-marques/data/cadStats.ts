import fs from 'node:fs'
import path from 'node:path'

import { ALL_LOTS } from './lotsData'

/**
 * Fonte ÚNICA de verdade dos números do Miguel Marques.
 *
 * Deriva os totais da MESMA geometria CAD real que o mapa renderiza
 * (`public/maps/miguel-marques-cad-lots.json`, extraída de R07 PLANTA LOTEADA.dxf),
 * eliminando a divergência histórica entre hero (800+/23), metadados SEO (529) e
 * mapa (≈1254) — ver docs/governance/03-SPRINT-0-AUDITORIA.md §3.
 *
 * Lido no servidor (build/SSG) via fs. Se o arquivo faltar, cai no `lotsData.ts`
 * para nunca quebrar a página.
 */

export interface MiguelMarquesStats {
  /** Total de lotes (universo do mapa). */
  total: number
  /** Lotes com status `disponivel` no dataset-base do CAD. */
  disponivel: number
  /** Quantidade de quadras distintas. */
  quadras: number
}

type CadLot = { quadra?: string | number; status?: string }

function fromCadJson(): MiguelMarquesStats | null {
  try {
    const file = path.join(process.cwd(), 'public/maps/miguel-marques-cad-lots.json')
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { lots?: CadLot[] }
    const lots = raw.lots ?? []
    if (lots.length === 0) return null
    const quadras = new Set(lots.map(l => String(l.quadra ?? '')).filter(Boolean))
    const disponivel = lots.filter(l => String(l.status ?? 'disponivel') === 'disponivel').length
    return { total: lots.length, disponivel, quadras: quadras.size }
  } catch {
    return null
  }
}

function fromLotsData(): MiguelMarquesStats {
  const quadras = new Set(ALL_LOTS.map(l => l.quadra))
  return {
    total: ALL_LOTS.length,
    disponivel: ALL_LOTS.filter(l => l.status === 'disponivel').length,
    quadras: quadras.size,
  }
}

export const MIGUEL_MARQUES_STATS: MiguelMarquesStats = fromCadJson() ?? fromLotsData()
