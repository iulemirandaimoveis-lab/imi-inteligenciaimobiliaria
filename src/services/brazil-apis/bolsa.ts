export interface QuoteData {
  ticker: string
  shortName: string
  longName: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  updatedAt: string
}

export interface BolsaIndices {
  ibovespa: QuoteData
  ifix: QuoteData
  quotes: QuoteData[]
}

const BRAPI_BASE = 'https://brapi.dev/api'

const INDICES_TICKERS = ['IBOV', 'IFIX', 'BOVA11', 'KNRI11', 'HGLG11', 'VISC11']

async function fetchBrapiQuote(tickers: string[]): Promise<QuoteData[]> {
  const joined = tickers.join(',')
  const res = await fetch(`${BRAPI_BASE}/quote/${joined}?fundamental=false&dividends=false`, {
    next: { revalidate: 60 * 15 },
  })
  if (!res.ok) throw new Error('Brapi indisponível')
  const data = await res.json()

  if (!data.results) throw new Error('Resposta inválida da Brapi')

  return data.results.map((r: Record<string, unknown>) => ({
    ticker: r.symbol as string,
    shortName: r.shortName as string || r.symbol as string,
    longName: r.longName as string || r.shortName as string || r.symbol as string,
    price: r.regularMarketPrice as number || 0,
    change: r.regularMarketChange as number || 0,
    changePercent: r.regularMarketChangePercent as number || 0,
    volume: r.regularMarketVolume as number || 0,
    marketCap: r.marketCap as number || 0,
    updatedAt: new Date((r.regularMarketTime as number || 0) * 1000).toISOString(),
  }))
}

export async function getBolsaIndices(): Promise<{ quotes: QuoteData[]; fetchedAt: string }> {
  const quotes = await fetchBrapiQuote(INDICES_TICKERS)
  return { quotes, fetchedAt: new Date().toISOString() }
}

export async function getQuotes(tickers: string[]): Promise<QuoteData[]> {
  return fetchBrapiQuote(tickers)
}
