export interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
}

function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '')
}

async function fetchViaCep(cep: string): Promise<CepData> {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    next: { revalidate: 60 * 60 * 24 },
  })
  if (!res.ok) throw new Error('ViaCEP indisponível')
  const data = await res.json()
  if (data.erro) throw new Error('CEP não encontrado')
  return {
    cep: data.cep,
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    localidade: data.localidade || '',
    uf: data.uf || '',
    ibge: data.ibge,
    gia: data.gia,
    ddd: data.ddd,
    siafi: data.siafi,
  }
}

async function fetchBrasilApiCep(cep: string): Promise<CepData> {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    next: { revalidate: 60 * 60 * 24 },
  })
  if (!res.ok) throw new Error('BrasilAPI CEP indisponível')
  const data = await res.json()
  return {
    cep: data.cep,
    logradouro: data.street || '',
    complemento: '',
    bairro: data.neighborhood || '',
    localidade: data.city || '',
    uf: data.state || '',
  }
}

export async function lookupCep(rawCep: string): Promise<CepData> {
  const cep = normalizeCep(rawCep)
  if (cep.length !== 8) throw new Error('CEP deve ter 8 dígitos')

  try {
    return await fetchViaCep(cep)
  } catch {
    return await fetchBrasilApiCep(cep)
  }
}
