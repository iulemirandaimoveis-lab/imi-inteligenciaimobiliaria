import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { CommissionsView } from '@/features/users/commissions/CommissionsView'
import { getCommissionsData } from '@/features/users/commissions/data'

export const dynamic = 'force-dynamic'

export default async function CommissionsPage() {
  const session = await requirePermission(PERMISSIONS.COMMISSIONS_READ)
  const data = await getCommissionsData(session)

  let members: { id: string; name: string }[] = []
  if (data.canManage) {
    const supabase = await createClient()
    const projectIds = session.projects.map((p) => p.id)
    const fallback = ['00000000-0000-0000-0000-000000000000']
    const { data: memberRows } = await supabase
      .schema('imi')
      .from('project_users')
      .select('users ( id, full_name )')
      .in('project_id', projectIds.length ? projectIds : fallback)
    const seen = new Set<string>()
    members = (memberRows ?? [])
      .map((r: any) => r.users)
      .filter((u: any) => u && !seen.has(u.id) && seen.add(u.id))
      .map((u: any) => ({ id: u.id, name: u.full_name }))
  }

  const projects = session.projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <CommissionsView data={data} projects={projects} members={members} />
    </ImiSessionProvider>
  )
}
