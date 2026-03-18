const BCB_BASE_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

interface BCBSeriesConfig {
  code: number
  name: string
  unit: string
  period: string
  cacheTTL: number // minutes
}

const BCB_SERIES: Record<string, BCBSeriesConfig> = {
  selic:              { code: 432,   name: 'Taxa SELIC (meta)',              unit: '% a.a.', period: 'daily',   cacheTTL: 60 },
  selic_month:        { code: 4390,  name: 'SELIC acumulada no mês',        unit: '% a.m.', period: 'monthly', cacheTTL: 360 },
  ipca:               { code: 433,   name: 'IPCA (variação mensal)',         unit: '% a.m.', period: 'monthly', cacheTTL: 1440 },
  igpm:               { code: 189,   name: 'IGP-M (variação mensal)',        unit: '% a.m.', period: 'monthly', cacheTTL: 1440 },
  cdi:                { code: 4392,  name: 'CDI acumulado no mês',           unit: '% a.m.', period: 'monthly', cacheTTL: 360 },
  tr:                 { code: 226,   name: 'Taxa Referencial',               unit: '% a.m.', period: 'monthly', cacheTTL: 1440 },
  usd_brl:            { code: 1,     name: 'Dólar (venda)',                 unit: 'R$',     period: 'daily',   cacheTTL: 60 },
  housing_credit_rate:{ code: 25497, name: 'Taxa média crédito imobiliário', unit: '% a.a.', period: 'monthly', cacheTTL: 1440 },
}

export async function fetchBCBSeries(seriesKey: string, lastN: number = 12): Promise<{ date: string; value: number }[]> {
  const config = BCB_SERIES[seriesKey]
  if (!config) throw new Error(`Unknown BCB series: ${seriesKey}`)

  const url = `${BCB_BASE_URL}.${config.code}/dados/ultimos/${lastN}?formato=json`

  const response = await fetch(url, { next: { revalidate: config.cacheTTL * 60 } })
  if (!response.ok) throw new Error(`BCB API error: ${response.status}`)

  const data = await response.json()
  return data.map((item: { data: string; valor: string }) => ({
    date: item.data,
    value: parseFloat(item.valor),
  }))
}

export async function getCurrentSelic(): Promise<number> {
  const data = await fetchBCBSeries('selic', 1)
  return data[0]?.value || 0
}

export async function getCurrentIPCA12m(): Promise<number> {
  const data = await fetchBCBSeries('ipca', 12)
  return data.reduce((acc, item) => (1 + acc / 100) * (1 + item.value / 100) - 1, 0) * 100
}

export async function getHousingCreditRate(): Promise<number> {
  const data = await fetchBCBSeries('housing_credit_rate', 1)
  return data[0]?.value || 0
}

export async function getUsdBrl(): Promise<number> {
  const data = await fetchBCBSeries('usd_brl', 1)
  return data[0]?.value || 0
}

export async function getAllBrazilIndices() {
  const [selic, ipca, cdi, igpm, usdBrl, housingRate] = await Promise.allSettled([
    fetchBCBSeries('selic', 12),
    fetchBCBSeries('ipca', 12),
    fetchBCBSeries('cdi', 12),
    fetchBCBSeries('igpm', 12),
    fetchBCBSeries('usd_brl', 30),
    fetchBCBSeries('housing_credit_rate', 12),
  ])

  const extract = (result: PromiseSettledResult<{ date: string; value: number }[]>) =>
    result.status === 'fulfilled' ? result.value : []

  return {
    selic: extract(selic),
    ipca: extract(ipca),
    cdi: extract(cdi),
    igpm: extract(igpm),
    usdBrl: extract(usdBrl),
    housingRate: extract(housingRate),
  }
}

export { BCB_SERIES }
