import { createClient } from '@/lib/supabase/server'
import EquipeClient from './EquipeClient'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

export default async function EquipePage() {
    const supabase = await createClient()

    // Query team_members directly — columns: id, name, email, phone, role, status, etc.
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, name, email, phone, avatar_url, role, status, total_leads, total_sales, total_revenue, joined_at, last_active_at, updated_at')
        .order('name', { ascending: true })

    const activeTeam = (teamMembers || []).map(member => ({
        id: member.id,
        name: member.name || 'Sem nome',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'viewer',
        status: member.status || 'pending',
        joinedAt: member.joined_at,
        lastActive: member.last_active_at || member.updated_at || member.joined_at,
        stats: {
            leads: member.total_leads || 0,
            sales: member.total_sales || 0,
            revenue: Number(member.total_revenue) || 0,
        }
    }))

    return <EquipeClient initialTeam={activeTeam} />
}
