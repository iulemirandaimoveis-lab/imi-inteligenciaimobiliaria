import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { IntelligenceView } from '@/features/users/intelligence/IntelligenceView'
import { getIntelligence } from '@/lib/imi-intelligence/service'

export const dynamic = 'force-dynamic'

export default async function IntelligencePage() {
  // Requires metrics.read — brokers without it are redirected to the dashboard.
  const session = await requirePermission(PERMISSIONS.METRICS_READ)
  const model = await getIntelligence(session)

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={model.projectName} />
      <IntelligenceView model={model} />
    </ImiSessionProvider>
  )
}
