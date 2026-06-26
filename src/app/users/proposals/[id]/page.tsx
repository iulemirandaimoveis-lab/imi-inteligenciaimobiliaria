import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { ProposalDetailView } from '@/features/users/proposals/ProposalDetailView'
import { getProposal, getProposalEvents } from '@/features/users/proposals/data'

export const dynamic = 'force-dynamic'

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const session = await requirePermission(PERMISSIONS.PROPOSALS_READ)
  const proposal = await getProposal(params.id)
  if (!proposal) notFound()

  const events = await getProposalEvents(params.id)

  const canApprove =
    session.user.isSuper || session.permissions.includes(PERMISSIONS.PROPOSALS_APPROVE)
  const canManage =
    session.user.isSuper || session.permissions.includes(PERMISSIONS.PROPOSALS_MANAGE)
  const isOwner = proposal.brokerId === session.user.id

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={proposal.projectName ?? session.projects[0]?.name ?? 'Alto Bellevue'} />
      <ProposalDetailView
        proposal={proposal}
        events={events}
        canApprove={canApprove}
        isOwner={isOwner}
        canManage={canManage}
      />
    </ImiSessionProvider>
  )
}
