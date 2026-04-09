'use client'
// Client-side wrapper that subscribes to realtime events and shows toast + browser push notifications
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/** Plays a short synthetic notification tone using Web Audio API */
function playNotificationSound() {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.35)
        osc.onended = () => ctx.close()
    } catch {
        // Audio not supported or blocked — silent fail
    }
}

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
        // Listen for push notification sound messages from Service Worker
        function onSwMessage(event: MessageEvent) {
            if (event.data?.type === 'IMI_PLAY_SOUND') {
                playNotificationSound()
            }
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', onSwMessage)
        }

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
                    playNotificationSound()
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

            // Track seen notification IDs to prevent double-fire from multiple channels
        const seenNotifIds = new Set<string>()

        function handleNotifInsert(payload: { new: Record<string, unknown> }, isForUser: boolean) {
            const notif = payload.new as { id?: string; title?: string; message?: string; type?: string }
            if (!notif.title) return
            // Deduplicate: if we already handled this notification ID, skip
            if (notif.id && seenNotifIds.has(notif.id)) return
            if (notif.id) seenNotifIds.add(notif.id)

            if (isForUser) {
                const toastFn =
                    notif.type === 'error' ? toast.error :
                    notif.type === 'success' ? toast.success :
                    notif.type === 'warning' ? toast.warning :
                    toast.info
                toastFn(notif.title, { description: notif.message, duration: 6000 })
            } else {
                toast.info(notif.title, { description: notif.message, duration: 6000 })
            }
            playNotificationSound()
            showBrowserNotification(notif.title, notif.message || undefined)
            // Dispatch custom event so SmartNotifications panel can update without its own realtime subscription
            window.dispatchEvent(new CustomEvent('imi-notification', { detail: payload.new }))
        }

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
                (payload) => handleNotifInsert(payload as { new: Record<string, unknown> }, true)
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
                (payload) => handleNotifInsert(payload as { new: Record<string, unknown> }, false)
            )
            .subscribe()
        channelsRef.current.push(broadcastChannel)
        })

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', onSwMessage)
            }
            channelsRef.current.forEach(ch => supabase.removeChannel(ch))
            channelsRef.current = []
        }
    }, [])

    return <>{children}</>
}
