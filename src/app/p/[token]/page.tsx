import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import PropostaPublicaClient from './PropostaPublicaClient'

export const dynamic = 'force-dynamic'

interface Props { params: { token: string } }

// F-09: a proposta pública é autorizada pelo TOKEN secreto (não pelo id). Uma vez
// que a RLS de public.proposals é restrita a `authenticated`, a leitura/escrita
// desta rota pública usa `supabaseAdmin` após validar o token — padrão P15.
export default async function PropostaPublicaPage({ params }: Props) {
  const { data: proposal } = await supabaseAdmin
    .from('proposals')
    .select('*')
    .eq('token', params.token)
    .single()

  if (!proposal) notFound()

  // Fetch development data if linked
  let development = null
  if (proposal.development_id) {
    const { data: dev } = await supabaseAdmin
      .from('developments')
      .select('name, description, neighborhood, city, state, images, gallery_images, image, area_from, bedrooms, bathrooms, parking_spaces')
      .eq('id', proposal.development_id)
      .single()
    development = dev
  }

  // Mark as viewed (server-side on first open)
  if (proposal.status === 'sent') {
    await supabaseAdmin
      .from('proposals')
      .update({ status: 'viewed' })
      .eq('id', proposal.id)
  }

  return <PropostaPublicaClient proposal={{ ...proposal, token: params.token, development, status: proposal.status === 'sent' ? 'viewed' : proposal.status }} />
}
