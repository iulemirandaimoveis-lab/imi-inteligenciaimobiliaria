import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PropostaPublicaClient from './PropostaPublicaClient'

export const dynamic = 'force-dynamic'

interface Props { params: { token: string } }

export default async function PropostaPublicaPage({ params }: Props) {
  const supabase = await createClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, imoveis(titulo, fotos, endereco, area_total, quartos, banheiros, vagas, descricao)')
    .eq('token', params.token)
    .single()

  if (!proposal) notFound()

  // Mark as viewed (server-side on first open)
  if (proposal.status === 'sent') {
    await supabase
      .from('proposals')
      .update({ status: 'viewed' })
      .eq('id', proposal.id)
  }

  return <PropostaPublicaClient proposal={{ ...proposal, status: proposal.status === 'sent' ? 'viewed' : proposal.status }} />
}
