import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBolsaIndices, getQuotes } from '@/services/brazil-apis/bolsa'

export const revalidate = 900 // 15 min

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tickers = searchParams.get('tickers')

  try {
    if (tickers) {
      const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
      const quotes = await getQuotes(tickerList)
      return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() })
    }

    const data = await getBolsaIndices()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar dados da bolsa'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
