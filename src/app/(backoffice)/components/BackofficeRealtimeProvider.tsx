'use client'
// Client-side wrapper that subscribes to realtime events and shows toast + browser push notifications
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function requestBrowserNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
    }
}

function showBrowserNotification(title: string, body?: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
        new Notification(title, {
            body,
            icon: '/logo-imi-gold.png',
            badge: '/logo-imi-gold.png',
            tag: `imi-${Date.now()}`,
        })
    } catch {
        // Safari/iOS may not support Notification constructor
    }
}

export function BackofficeRealtimeProvider({ children }: { children: React.ReactNode }) {
    const channelsRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']>[]>([])

    useEffect(() => {
        const supabase = createClient()

        // Request browser notification permission on mount
        requestBrowserNotificationPermission()

        // Subscribe to new leads — real-time toast alert
        const leadsChannel = supabase
            .channel('backoffice-leads-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'leads' },
                (payload) => {
                    const lead = payload.new as { id?: string; name?: string; source?: string }
                    const title = `Novo lead: ${lead.name || 'Sem nome'}`
                    const desc = lead.source ? `Via ${lead.source}` : undefined
                    toast.info(title, {
                        description: desc,
                        duration: 8000,
                        action: lead.id ? {
                            label: 'Ver',
                            onClick: () => { window.location.href = `/backoffice/leads/${lead.id}` }
                        } : undefined,
                    })
                    showBrowserNotification(title, desc)
                }
            )
            .subscribe()
        channelsRef.current.push(leadsChannel)

        // Subscribe to link_events — tracking click notifications
        const trackingChannel = supabase
            .channel('backoffice-tracking-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'link_events', filter: 'event_type=eq.click' },
                (payload) => {
                    const evt = payload.new as {
                        device_type?: string; browser?: string;
                        metadata?: { city?: string; country?: string }
                    }
                    const city = evt.metadata?.city || 'local desconhecido'
                    const device = evt.device_type || 'desktop'
                    toast('📲 Link acessado', {
                        description: `Acesso de ${city} (${device}, ${evt.browser || '?'})`,
                        duration: 5000,
                    })
                    showBrowserNotification('📲 Link acessado', `De ${city} · ${device}`)
                }
            )
            .subscribe()
        channelsRef.current.push(trackingChannel)

        // Subscribe to notifications — filtered by current user
        supabase.auth.getUser().then(({ data }) => {
            const userId = data.user?.id
            if (!userId) return

            const notificationsChannel = supabase
                .channel('backoffice-notifications-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
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
                            showBrowserNotification(notif.title, notif.message || undefined)
                        }
                    }
                )
                .subscribe()
            channelsRef.current.push(notificationsChannel)

            // Also subscribe to notifications with null user_id (broadcast to all)
            const broadcastChannel = supabase
                .channel('backoffice-notifications-broadcast')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: 'user_id=is.null',
                    },
                    (payload) => {
                        const notif = payload.new as { title?: string; message?: string; type?: string }
                        if (notif.title) {
                            toast.info(notif.title, {
                                description: notif.message,
                                duration: 6000,
                            })
                            showBrowserNotification(notif.title, notif.message || undefined)
                        }
                    }
                )
                .subscribe()
            channelsRef.current.push(broadcastChannel)
        })

        return () => {
            channelsRef.current.forEach(ch => supabase.removeChannel(ch))
            channelsRef.current = []
        }
    }, [])

    return <>{children}</>
}
