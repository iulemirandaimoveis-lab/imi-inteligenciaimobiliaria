'use client'
// Client-side wrapper that subscribes to realtime events and shows toast notifications
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function BackofficeRealtimeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const supabase = createClient()

        // Subscribe to new leads — real-time toast alert
        const leadsChannel = supabase
            .channel('backoffice-leads-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'leads' },
                (payload) => {
                    const lead = payload.new as { id?: string; name?: string; source?: string }
                    toast.info(`🎯 Novo lead: ${lead.name || 'Sem nome'}`, {
                        description: lead.source ? `Via ${lead.source}` : undefined,
                        duration: 8000,
                        action: lead.id ? {
                            label: 'Ver',
                            onClick: () => { window.location.href = `/backoffice/leads/${lead.id}` }
                        } : undefined,
                    })
                }
            )
            .subscribe()

        // Subscribe to new notifications for current user
        const notificationsChannel = supabase
            .channel('backoffice-notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const notif = payload.new as { title?: string; message?: string; type?: string }
                    if (notif.title) {
                        const toastFn =
                            notif.type === 'error' ? toast.error :
                            notif.type === 'success' ? toast.success :
                            notif.type === 'warning' ? toast.warning :
                            toast.info
                        toastFn(notif.title, {
                            description: notif.message,
                            duration: 6000,
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(leadsChannel)
            supabase.removeChannel(notificationsChannel)
        }
    }, [])

    return <>{children}</>
}
