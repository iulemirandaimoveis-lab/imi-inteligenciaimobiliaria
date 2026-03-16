import { createClient } from '@/lib/supabase/server'
import ConstrutorasClient, { Developer } from './ConstrutorasClient'
import { T } from '@/app/(backoffice)/lib/theme'

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
    // Contagem real de empreendimentos
    empreendimentosAtivos: Array.isArray(dev.developments) ? dev.developments.length : 0,
    // Unidades vendidas e receita serão calculadas quando módulo de vendas estiver ativo
    unidadesVendidas: 0,
    receitaTotal: 0,
    // Rating baseado na quantidade de projetos no portfólio
    rating: Math.min(5.0, 3.5 + (Array.isArray(dev.developments) ? dev.developments.length : 0) * 0.3),
    // Duração da parceria calculada
    parceriaDuracao: "Parceiro ativo",
  }))

  return (
    <ConstrutorasClient initialData={developers} />
  )
}
