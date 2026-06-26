import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { ProposalForm } from '@/features/users/proposals/ProposalForm'

export const dynamic = 'force-dynamic'

export default async function NewProposalPage() {
  // Criar proposta requer proposals.manage (corretor).
  const session = await requirePermission(PERMISSIONS.PROPOSALS_MANAGE)
  const projects = session.projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <ProposalForm projects={projects} />
    </ImiSessionProvider>
  )
}
