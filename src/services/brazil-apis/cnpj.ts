export interface CnpjData {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacao: string
  ativo: boolean
  naturezaJuridica: string
  porte: string
  capitalSocial: number
  abertura: string
  atividadePrincipal: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
}

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

async function fetchBrasilApiCnpj(cnpj: string): Promise<CnpjData> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    next: { revalidate: 60 * 60 * 6 },
  })
  if (!res.ok) throw new Error('BrasilAPI CNPJ indisponível')
  const d = await res.json()

  const atividadePrincipal =
    Array.isArray(d.cnae_fiscal_descricao)
      ? d.cnae_fiscal_descricao
      : d.cnae_fiscal_descricao || ''

  return {
    cnpj: d.cnpj,
    razaoSocial: d.razao_social || '',
    nomeFantasia: d.nome_fantasia || '',
    situacao: d.descricao_situacao_cadastral || '',
    ativo: d.descricao_situacao_cadastral === 'ATIVA',
    naturezaJuridica: d.natureza_juridica || '',
    porte: d.porte || '',
    capitalSocial: d.capital_social || 0,
    abertura: d.data_inicio_atividade || '',
    atividadePrincipal: typeof atividadePrincipal === 'string' ? atividadePrincipal : '',
    logradouro: d.logradouro || '',
    numero: d.numero || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    municipio: d.municipio || '',
    uf: d.uf || '',
    cep: d.cep?.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2') || '',
    telefone: d.ddd_telefone_1 || '',
    email: d.email || '',
  }
}

async function fetchReceitaWsCnpj(cnpj: string): Promise<CnpjData> {
  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
    next: { revalidate: 60 * 60 * 6 },
  })
  if (!res.ok) throw new Error('ReceitaWS indisponível')
  const d = await res.json()
  if (d.status === 'ERROR') throw new Error(d.message || 'CNPJ inválido')

  return {
    cnpj: d.cnpj,
    razaoSocial: d.nome || '',
    nomeFantasia: d.fantasia || '',
    situacao: d.situacao || '',
    ativo: d.situacao === 'ATIVA',
    naturezaJuridica: d.natureza_juridica || '',
    porte: d.porte || '',
    capitalSocial: parseFloat(String(d.capital_social || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
    abertura: d.abertura || '',
    atividadePrincipal: d.atividade_principal?.[0]?.text || '',
    logradouro: d.logradouro || '',
    numero: d.numero || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    municipio: d.municipio || '',
    uf: d.uf || '',
    cep: d.cep || '',
    telefone: d.telefone || '',
    email: d.email || '',
  }
}

export async function lookupCnpj(rawCnpj: string): Promise<CnpjData> {
  const cnpj = normalizeCnpj(rawCnpj)
  if (cnpj.length !== 14) throw new Error('CNPJ deve ter 14 dígitos')

  try {
    return await fetchBrasilApiCnpj(cnpj)
  } catch {
    return await fetchReceitaWsCnpj(cnpj)
  }
}
