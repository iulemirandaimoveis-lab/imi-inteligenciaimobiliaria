import { createClient } from '@/lib/supabase/server'
import ImoveisClient from './ImoveisClient'
import { mapDbPropertyToDevelopment } from '@/modules/imoveis/utils/propertyMapper'

// Forçamos dinâmico para garantir que os dados do banco venham frescos
export const dynamic = 'force-dynamic'

export default async function BackofficeImoveisPage() {
  const supabase = await createClient()

  // Buscando empreendimentos que já existem na plataforma pública
  const { data, error } = await supabase
    .from('developments')
    .select(`
          *,
          developers (
              name,
              logo_url
          )
      `)
    .order('is_highlighted', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Falha ao buscar imóveis:', error.message)
  }

  // Mapeamos os dados usando o mesmo utilitário do website
  const developments = (data || []).map(mapDbPropertyToDevelopment)

  return (
    <ImoveisClient developments={developments} />
  )
}
