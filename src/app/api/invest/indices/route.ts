import { NextResponse } from 'next/server'
import { getAllBrazilIndices } from '@/lib/invest/data/providers/bcb'

export const revalidate = 3600 // 1 hour ISR cache

export async function GET() {
  try {
    const data = await getAllBrazilIndices()

    const format = (series: { date: string; value: number }[], name: string, unit: string) => {
      const latest = series[series.length - 1]
      const prev = series[series.length - 2]
      return {
        name,
        value: latest?.value || 0,
        unit,
        change: latest && prev ? latest.value - prev.value : 0,
        history: series.slice(-12),
        updatedAt: latest?.date || '',
      }
    }

    const indices = {
      selic: format(data.selic, 'SELIC', '% a.a.'),
      ipca: format(data.ipca, 'IPCA', '% a.m.'),
      cdi: format(data.cdi, 'CDI', '% a.m.'),
      igpm: format(data.igpm, 'IGP-M', '% a.m.'),
      usdBrl: format(data.usdBrl, 'USD/BRL', 'R$'),
      housingRate: format(data.housingRate, 'Crédito Imobiliário', '% a.a.'),
    }

    // IPCA acumulado 12 meses
    const ipca12m = data.ipca.reduce((acc, item) => (1 + acc / 100) * (1 + item.value / 100) - 1, 0) * 100

    return NextResponse.json({ indices, ipca12m, source: 'Banco Central do Brasil (BCB)', fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Indices fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar índices', indices: {} }, { status: 500 })
  }
}
