import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ProposalDocument } from '@/features/users/proposals/ProposalDocument'
import { getProposal } from '@/features/users/proposals/data'

export const dynamic = 'force-dynamic'

export default async function ProposalDocumentPage({ params }: { params: { id: string } }) {
  await requirePermission(PERMISSIONS.PROPOSALS_READ)
  const proposal = await getProposal(params.id)
  if (!proposal) notFound()

  return <ProposalDocument proposal={proposal} />
}
