import { requireImiSession } from '@/lib/imi-auth/server'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { DashboardView } from '@/features/users/dashboard/DashboardView'
import { getAltoBellevueDashboard } from '@/features/users/dashboard/data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireImiSession()
  const data = await getAltoBellevueDashboard(session)

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={data.projectName} />
      <DashboardView data={data} />
    </ImiSessionProvider>
  )
}
