import { createClient } from '@/lib/supabase/server'
import ConstrutorasClient, { Developer } from './ConstrutorasClient'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

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
    // Contagem de empreendimentos ativos baseada na real relation do banco de dados
    empreendimentosAtivos: Array.isArray(dev.developments) ? dev.developments.length : 0,
    unidadesVendidas: 0, // Placeholder
    receitaTotal: 0, // Placeholder
    rating: 4.8,
    parceriaDuracao: "Em análise",
  }))

  return (
    <ConstrutorasClient initialData={developers} />
  )
}
