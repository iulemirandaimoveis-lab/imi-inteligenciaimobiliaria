'use client'

/**
 * useRealtimeNotifications — subscribes to Supabase Realtime for new leads
 * and notifications, showing a toast with a "Ver" action link.
 *
 * Usage: call in a layout component that stays mounted across navigation.
 * Only mounts once per session due to the empty dep array.
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export function useRealtimeNotifications() {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        // Avoid double-mounting in React Strict Mode
        if (channelRef.current) return

        const channel = supabase
            .channel('imi-realtime-notifications')
            // New lead captured
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'leads' },
                (payload) => {
                    const lead = payload.new as { id?: string; name?: string; source?: string }
                    const name = lead?.name || 'Novo lead'
                    const source = lead?.source ? ` (${lead.source})` : ''
                    toast.success(`${name}${source}`, {
                        description: 'Novo lead capturado',
                        action: lead?.id
                            ? { label: 'Ver', onClick: () => window.location.assign(`/backoffice/leads/${lead.id}`) }
                            : undefined,
                        duration: 8000,
                    })
                }
            )
            // New system notification
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const notif = payload.new as { id?: string; title?: string; message?: string; type?: string }
                    if (!notif?.title) return
                    const toastFn = notif.type === 'error' ? toast.error
                        : notif.type === 'warning' ? toast.warning
                        : toast.info
                    toastFn(notif.title, {
                        description: notif.message,
                        duration: 6000,
                    })
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [])
}
