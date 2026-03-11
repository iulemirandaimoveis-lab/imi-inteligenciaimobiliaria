import { createClient } from '@/lib/supabase/server'
import ConstrutorasClient, { Developer } from './ConstrutorasClient'

export const dynamic = 'force-dynamic'

export default async function BackofficeConstrutorasPage() {
  const supabase = await createClient()

  // Busca construtoras sem join relacional (evita erro de schema cache em produção)
  const { data: developersData, error } = await supabase
    .from('developers')
    .select('id, name, legal_name, cnpj, email, phone, address, is_active, logo_url, city, state, description, rating, years_in_market, created_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Falha ao buscar construtoras do banco:', error.message)
  }

  // Contagem de empreendimentos por construtora — query separada para não quebrar se FK não existir
  const countMap: Record<string, number> = {}
  try {
    const { data: devCounts } = await supabase
      .from('developments')
      .select('developer_id')
      .not('developer_id', 'is', null)
    devCounts?.forEach((d: { developer_id: string }) => {
      if (d.developer_id) countMap[d.developer_id] = (countMap[d.developer_id] || 0) + 1
    })
  } catch (_) { /* silencia se developments não tiver FK */ }

  const developers: Developer[] = (developersData || []).map((dev) => ({
    id: dev.id,
    name: dev.name,
    legal_name: dev.legal_name,
    cnpj: dev.cnpj,
    email: dev.email,
    phone: dev.phone,
    address: dev.address,
    is_active: dev.is_active,
    logo_url: dev.logo_url,
    empreendimentosAtivos: countMap[dev.id] || 0,
    unidadesVendidas: 0,
    receitaTotal: 0,
    rating: dev.rating || 4.8,
    parceriaDuracao: dev.years_in_market ? `${dev.years_in_market} anos` : 'Nova',
  }))

  return (
    <ConstrutorasClient initialData={developers} />
  )
}
