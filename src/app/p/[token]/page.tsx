import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PropostaPublicaClient from './PropostaPublicaClient'

export const dynamic = 'force-dynamic'

interface Props { params: { token: string } }

export default async function PropostaPublicaPage({ params }: Props) {
  const supabase = await createClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('token', params.token)
    .single()

  if (!proposal) notFound()

  // Fetch development data if linked
  let development = null
  if (proposal.development_id) {
    const { data: dev } = await supabase
      .from('developments')
      .select('name, description, neighborhood, city, state, images, gallery_images, image, area_min, area_from, bedrooms, bathrooms, parking_spaces')
      .eq('id', proposal.development_id)
      .single()
    development = dev
  }

  // Mark as viewed (server-side on first open)
  if (proposal.status === 'sent') {
    await supabase
      .from('proposals')
      .update({ status: 'viewed' })
      .eq('id', proposal.id)
  }

  return <PropostaPublicaClient proposal={{ ...proposal, development, status: proposal.status === 'sent' ? 'viewed' : proposal.status }} />
}
