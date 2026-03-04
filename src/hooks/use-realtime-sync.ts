'use client'
// hooks/use-realtime-sync.ts
// Sistema de sincronização real-time com Supabase

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

export interface RealtimeEvent<T = any> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: T
    old: T
    table: string
}

export interface UseRealtimeOptions<T> {
    table: string
    filter?: string // Ex: "status=eq.published"
    schema?: string
    onInsert?: (record: T) => void
    onUpdate?: (record: T, old: T) => void
    onDelete?: (record: T) => void
    onError?: (error: Error) => void
}

/**
 * Hook para sincronização real-time de uma tabela
 */
export function useRealtimeTable<T = any>(
    options: UseRealtimeOptions<T>
) {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Refs para callbacks para evitar re-subscrição quando eles mudam
    const onInsertRef = useRef(options.onInsert)
    const onUpdateRef = useRef(options.onUpdate)
    const onDeleteRef = useRef(options.onDelete)
    const onErrorRef = useRef(options.onError)

    useEffect(() => {
        onInsertRef.current = options.onInsert
        onUpdateRef.current = options.onUpdate
        onDeleteRef.current = options.onDelete
        onErrorRef.current = options.onError
    }, [options.onInsert, options.onUpdate, options.onDelete, options.onError])

    useEffect(() => {
        // Criar canal de subscrição
        const channelName = `realtime:${options.table}:${options.filter || 'all'}`

        const channel = supabase.channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: options.schema || 'public',
                    table: options.table,
                    filter: options.filter
                },
                (payload) => {
                    try {
                        const { eventType, new: newRecord, old: oldRecord } = payload as any

                        switch (eventType) {
                            case 'INSERT':
                                onInsertRef.current?.(newRecord as T)
                                break
                            case 'UPDATE':
                                onUpdateRef.current?.(newRecord as T, oldRecord as T)
                                break
                            case 'DELETE':
                                onDeleteRef.current?.(oldRecord as T)
                                break
                        }
                    } catch (err) {
                        const error = err instanceof Error ? err : new Error('Erro no realtime')
                        setError(error)
                        onErrorRef.current?.(error)
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setConnected(true)
                } else if (status === 'CLOSED') {
                    setConnected(false)
                } else if (status === 'CHANNEL_ERROR') {
                    setConnected(false)
                    const err = new Error('Erro na conexão com canal realtime')
                    setError(err)
                    onErrorRef.current?.(err)
                }
            })

        setChannel(channel)

        // Cleanup
        return () => {
            supabase.removeChannel(channel)
            setConnected(false)
        }
    }, [options.table, options.filter, options.schema])

    return {
        connected,
        error,
        channel
    }
}

/**
 * Hook específico para developments (empreendimentos)
 */
export function useRealtimeDevelopments(
    onUpdate?: (development: any) => void
) {
    return useRealtimeTable({
        table: 'developments',
        onInsert: (dev) => {
            onUpdate?.(dev)
        },
        onUpdate: (dev, old) => {
            onUpdate?.(dev)
        },
        onDelete: (dev) => {
            onUpdate?.(dev)
        }
    })
}

/**
 * Hook específico para leads
 */
export function useRealtimeLeads(
    onUpdate?: (lead: any) => void
) {
    return useRealtimeTable({
        table: 'leads',
        onInsert: (lead) => {
            onUpdate?.(lead)

            // Notificação toast (opcional)
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification('Novo Lead!', {
                        body: `${lead.name} - ${lead.source}`,
                        icon: '/favicon.ico'
                    })
                }
            }
        },
        onUpdate: (lead) => {
            onUpdate?.(lead)
        }
    })
}

/**
 * Hook para notificações real-time
 */
export function useRealtimeNotifications(userId?: string) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    // Fetch inicial (seria bom ter, mas o hook foca no realtime. Deixando para componente pai ou expandindo)
    // Por enquanto, apenas realtime

    useRealtimeTable({
        table: 'notifications',
        filter: userId ? `user_id=eq.${userId}` : undefined,
        onInsert: (notification) => {
            setNotifications((prev) => [notification, ...prev])
            if (!notification.read) {
                setUnreadCount((prev) => prev + 1)
                // Som de notificação (opcional)
                playNotificationSound()
            }
        },
        onUpdate: (notification) => {
            setNotifications((prev) =>
                prev.map(n => n.id === notification.id ? notification : n)
            )
            // Recalcular unread count seria ideal com fetch completo, aqui é aproximado
        }
    })

    // Funcões auxiliares (mockadas por enquanto ou implementadas basicas)
    const markAsRead = useCallback(async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)

        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }, [])

    const markAllAsRead = useCallback(async () => {
        if (!userId) return

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false)

        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read: true }))
        )
        setUnreadCount(0)
    }, [userId])

    return {
        notifications,
        unreadCount,
        setNotifications, // Expor para carregar dados iniciais
        setUnreadCount,
        markAsRead,
        markAllAsRead
    }
}

/**
 * Função auxiliar para tocar som de notificação
 */
function playNotificationSound() {
    if (typeof window === 'undefined') return
    try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {
            // Ignorar erro se não conseguir tocar (autoplay police)
        })
    } catch {
        // Ignorar erro
    }
}

/**
 * Hook para presença online (quem está online no backoffice)
 */
export function useOnlinePresence(roomName: string = 'online-users') {
    const [onlineUsers, setOnlineUsers] = useState<any[]>([])
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)

    useEffect(() => {
        const presenceChannel = supabase.channel(roomName, {
            config: {
                presence: {
                    key: 'user_id',
                },
            },
        })

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState()
                // Flatten presence state
                const users = Object.values(newState).flat()
                setOnlineUsers(users)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Obter user ID atual
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        await presenceChannel.track({
                            user_id: user.id,
                            email: user.email,
                            online_at: new Date().toISOString()
                        })
                    }
                }
            })

        setChannel(presenceChannel)

        return () => {
            supabase.removeChannel(presenceChannel)
        }
    }, [roomName])

    return {
        onlineUsers,
        channel
    }
}

/**
 * Solicitar permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('Browser não suporta notificações')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

/**
 * Enviar notificação local
 */
export function sendLocalNotification(title: string, options?: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        })
    }
}
