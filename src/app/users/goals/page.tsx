import { requireImiSession } from '@/lib/imi-auth/server'
import { createClient } from '@/lib/supabase/server'
import { ImiSessionProvider } from '@/features/users/session-context'
import { DashboardTopbar } from '@/features/users/dashboard/DashboardChrome'
import { GoalsView } from '@/features/users/goals/GoalsView'
import { getGoalsData } from '@/features/users/goals/data'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  // Qualquer usuário do console acessa: corretor vê sua meta; gestor gere todas.
  const session = await requireImiSession()
  const data = await getGoalsData(session)

  // Opções para o formulário do gestor (somente quando pode gerir).
  let teams: { id: string; name: string }[] = []
  let members: { id: string; name: string }[] = []
  if (data.canManage) {
    const supabase = await createClient()
    const imi = supabase.schema('imi')
    const projectIds = session.projects.map((p) => p.id)
    const fallback = ['00000000-0000-0000-0000-000000000000']
    const { data: teamRows } = await imi
      .from('teams')
      .select('id, name')
      .in('project_id', projectIds.length ? projectIds : fallback)
    teams = (teamRows ?? []).map((t: any) => ({ id: t.id, name: t.name }))

    const { data: memberRows } = await imi
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
      <GoalsView
        teamGoals={data.teamGoals}
        individualGoals={data.individualGoals}
        ranking={data.ranking}
        canManage={data.canManage}
        projects={projects}
        teams={teams}
        members={members}
      />
    </ImiSessionProvider>
  )
}
