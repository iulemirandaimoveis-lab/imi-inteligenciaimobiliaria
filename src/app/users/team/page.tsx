import { requirePermission } from '@/lib/imi-auth/server'
import { PERMISSIONS, ROLES } from '@/lib/imi-auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { TeamAdminView, type TeamMemberRow } from '@/features/users/team/TeamAdminView'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  // Requires teams.read — brokers without it are redirected to the dashboard.
  const session = await requirePermission(PERMISSIONS.TEAMS_READ)

  // Password reset is allowed for super admins, backoffice admins and team
  // managers. PROJECT_OWNER (Catel) can view but not manage.
  const canManage =
    session.user.isSuper ||
    session.roleKeys.includes(ROLES.BACKOFFICE_ADMIN) ||
    session.roleKeys.includes(ROLES.TEAM_MANAGER)

  const supabase = await createClient()
  const imi = supabase.schema('imi')

  // Teams within the user's projects.
  const projectIds = session.projects.map((p) => p.id)
  const { data: teamRows } = await imi.from('teams').select('id, name, project_id').in('project_id', projectIds.length ? projectIds : ['00000000-0000-0000-0000-000000000000'])
  const teams = teamRows ?? []
  const teamName = teams[0]?.name ?? 'Equipe'

  let members: TeamMemberRow[] = []
  if (teams.length) {
    const { data: memberRows } = await imi
      .from('team_members')
      .select('team_id, team_role, users ( id, full_name, email, status )')
      .in('team_id', teams.map((t) => t.id))

    members = (memberRows ?? [])
      .map((row: any) => {
        const u = row.users
        if (!u) return null
        return {
          userId: u.id,
          name: u.full_name,
          email: u.email,
          status: u.status,
          teamRole: row.team_role,
          teamName: teams.find((t) => t.id === row.team_id)?.name ?? '',
          roles: [],
        } as TeamMemberRow
      })
      .filter(Boolean) as TeamMemberRow[]

    // Managers and owners first, then members alphabetically.
    const order: Record<string, number> = { owner: 0, manager: 1, member: 2, viewer: 3 }
    members.sort((a, b) => (order[a.teamRole] ?? 9) - (order[b.teamRole] ?? 9) || a.name.localeCompare(b.name))
  }

  return (
    <ImiSessionProvider session={session}>
      <DashboardTopbar projectName={session.projects[0]?.name ?? 'Alto Bellevue'} />
      <TeamAdminView members={members} canManage={canManage} teamName={teamName} />
    </ImiSessionProvider>
  )
}
