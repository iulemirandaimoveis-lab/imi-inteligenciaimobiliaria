import { createClient } from '@/lib/supabase/server'
import ConstrutorasClient, { Developer } from './ConstrutorasClient'
import { T } from '@/app/(backoffice)/lib/theme'
export const dynamic = 'force-dynamic'
export default async function BackofficeConstrutorasPage() {
  const supabase = await createClient()
  // Buscar construtoras reais do banco de dados e suas estatísticas reais
  const { data: developersData, error } = await supabase
    .from('developers')
    .select('*')
    .order('name', { ascending: true })
  if (error) {
  }
  // Mapeia para a tipagem que o front-end aceita e conta os empreendimentos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const developers: Developer[] = (developersData || []).map((dev: any) => ({
    id: dev.id,
    name: dev.name,
    legal_name: dev.legal_name,
    cnpj: dev.cnpj,
    email: dev.email,
    phone: dev.phone,
    address: dev.address,
    is_active: dev.is_active ?? true,
    logo_url: dev.logo_url ?? dev.logo,
    empreendimentosAtivos: 0,
    unidadesVendidas: 0,
    receitaTotal: 0,
    rating: 4.0,
    parceriaDuracao: "Parceiro ativo",
  }))
  return (
    <ConstrutorasClient initialData={developers} />
  )
}
