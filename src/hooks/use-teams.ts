import useSWR from 'swr'

export interface TeamMember {
    id: string
    user_id: string | null
    name: string
    email: string
    phone: string | null
    role: 'broker' | 'broker_manager' | 'admin'
    status: 'active' | 'inactive'
    avatar_url: string | null
    creci: string | null
    commission_rate: number | null
    last_login_at: string | null
    created_at: string
    team_id: string | null
}

export interface Team {
    id: string
    name: string
    description: string | null
    leader_id: string | null
    leader_name: string | null
    avatar_url: string | null
    color: string
    status: 'active' | 'inactive' | 'archived'
    is_active: boolean
    region: string | null
    specialty: string | null
    commission_rules: Record<string, unknown> | null
    member_count: number
    active_listings: number
    monthly_volume: number
    members: TeamMember[]
    created_at: string
    updated_at: string
}

export function useTeams(search?: string) {
    const key = ['teams', search || '']
    const { data, error, mutate } = useSWR(key, async () => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const res = await fetch(`/api/teams?${params.toString()}`)
        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            throw new Error(json.error || 'Falha ao carregar equipes')
        }
        const json = await res.json()
        return { data: (json.data ?? []) as Team[], count: (json.count ?? 0) as number }
    })

    return {
        teams: data?.data || [],
        total: data?.count || 0,
        isLoading: !error && !data,
        isError: !!error,
        error,
        mutate,
    }
}

export async function createTeam(payload: {
    name: string
    description?: string
    region?: string
    specialty?: string
    leader_id?: string | null
    color?: string
}) {
    const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao criar equipe')
    return json.data as Team
}

export async function updateTeam(id: string, payload: Partial<Team>) {
    const res = await fetch(`/api/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao atualizar equipe')
    return json.data as Team
}

export async function deleteTeam(id: string) {
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao excluir equipe')
}

export async function addMemberToTeam(teamId: string, brokerId: string) {
    const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_id: brokerId }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao adicionar membro')
    return json.data as TeamMember
}

export async function removeMemberFromTeam(teamId: string, brokerId: string) {
    const res = await fetch(`/api/teams/${teamId}/members?broker_id=${brokerId}`, {
        method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao remover membro')
}
