import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { ProposalsListView } from '@/features/users/proposals/ProposalsListView'
import { listProposals, computeKpis } from '@/features/users/proposals/data'

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  const session = await requirePermission(PERMISSIONS.PROPOSALS_READ)
  const rows = await listProposals(session)
  const kpis = computeKpis(rows)
  const canCreate =
    session.user.isSuper || session.permissions.includes(PERMISSIONS.PROPOSALS_MANAGE)

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <ProposalsListView rows={rows} kpis={kpis} canCreate={canCreate} />
    </ImiSessionProvider>
  )
}
