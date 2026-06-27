import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { AdminView } from '@/features/users/admin/AdminView'
import { getAdminData } from '@/features/users/admin/data'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Master / Backoffice: gestão de usuários requer users.manage.
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE)
  const data = await getAdminData(session)

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <AdminView
        users={data.users}
        projects={data.projects}
        canManageUsers={data.canManageUsers}
        canManageRoles={data.canManageRoles}
        isSuper={session.user.isSuper}
      />
    </ImiSessionProvider>
  )
}
