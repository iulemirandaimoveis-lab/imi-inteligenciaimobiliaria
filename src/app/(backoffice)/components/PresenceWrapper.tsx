'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PresenceProvider } from '@/features/connect/components/PresenceProvider'
import { useBackofficeSession } from '@/hooks/useBackofficeSession'

function SessionTracker() {
    useBackofficeSession()
    return null
}

export default function PresenceWrapper({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ id: string; name: string; avatar?: string | null } | null>(null)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (u) {
                setUser({
                    id: u.id,
                    name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário',
                    avatar: u.user_metadata?.avatar_url || null,
                })
            }
        })
    }, [])

    if (!user) return <>{children}</>

    return (
        <PresenceProvider userId={user.id} userName={user.name} avatarUrl={user.avatar}>
            <SessionTracker />
            {children}
        </PresenceProvider>
    )
}
