import { createClient } from '@/lib/supabase/server'
import EquipeClient from './EquipeClient'

export default async function EquipePage() {
    const supabase = await createClient()

    const { data: teamMembers } = await supabase
        .from('team_members')
        .select(`
            id,
            user_id,
            first_name,
            last_name,
            role,
            status,
            phone,
            created_at,
            users:user_id (
                email,
                last_sign_in_at
            )
        `)

    const activeTeam = teamMembers?.map(member => {
        // Obtenha os emails de auth de alguma forma, mas team_members normalmente deve ter o básico.
        // O Supabase auth não costuma vir exposto pro user-level fácil assim no select, 
        // caso dê null em users ou email, é preferível ter um campo `email` em team_members real.
        // Simulando com o que tiver ou mock-placeholder caso a política recuse auth.users join.
        
        let email = 'email@privado.com'
        let lastActive = member.created_at

        // Safely extract from joined reference if possible
        if (member.users && Array.isArray(member.users) && member.users.length > 0) {
           email = member.users[0].email || email
           lastActive = member.users[0].last_sign_in_at || lastActive
        } else if (member.users && !Array.isArray(member.users)) {
            email = (member.users as any).email || email
            lastActive = (member.users as any).last_sign_in_at || lastActive
        }

        return {
            id: member.id,
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Usuário ' + member.id.substring(0,4),
            email: email,
            phone: member.phone || '',
            role: member.role || 'viewer',
            status: member.status || 'pending',
            joinedAt: member.created_at,
            lastActive: lastActive,
            stats: {
                leads: 0,
                sales: 0,
                revenue: 0
            }
        }
    }) || []

    return <EquipeClient initialTeam={activeTeam} />
}
