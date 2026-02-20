import { createClient } from '@/lib/supabase/server'
import ConstrutorasClient, { Developer } from './ConstrutorasClient'

export const dynamic = 'force-dynamic'

export default async function BackofficeConstrutorasPage() {
  const supabase = await createClient()

  // Buscar construtoras reais do banco de dados e suas estatísticas reais
  const { data: developersData, error } = await supabase
    .from('developers')
    .select(`
      id,
      name,
      legal_name,
      cnpj,
      email,
      phone,
      address,
      is_active,
      logo_url,
      developments (count)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Falha ao buscar construtoras do banco:', error.message)
  }

  // Mapeia para a tipagem que o front-end aceita e conta os empreendimentos
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
    // Contagem de empreendimentos ativos baseada na real relation the banco de dados
    empreendimentosAtivos: Array.isArray(dev.developments) ? dev.developments.length : 0,
    unidadesVendidas: Math.floor(Math.random() * 50), // Mocks provisórios para o que não tá no schema base ainda
    receitaTotal: Math.floor(Math.random() * 50000000),
    rating: 4.0 + (Math.random() * 1.0),
    parceriaDuracao: "Avaliação 2026",
  }))

  return (
    <ConstrutorasClient initialData={developers} />
  )
}
