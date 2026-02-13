'use client'

import { useState, useEffect } from 'react'
import {
    Bell,
    X,
    Users,
    Building2,
    FileText,
    MessageSquare,
    AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

const supabase = createClient()

interface Notification {
    id: string
    user_id: string
    type: 'lead' | 'development' | 'evaluation' | 'consultation' | 'system' | 'comment'
    title: string
    message: string | null
    data: any
    read: boolean
    read_at: string | null
    created_at: string
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadNotifications()
        const unsubscribe = subscribeToNotifications()
        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    const loadNotifications = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error

            setNotifications(data || [])
            setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0)

        } catch (error) {
            console.error('Erro ao carregar notificações:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToNotifications = () => {
        const subscription = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const newNotification = payload.new as Notification

                    setNotifications(prev => [newNotification, ...prev])
                    setUnreadCount(prev => prev + 1)

                    // Toast notification
                    toast(newNotification.title, {
                        description: newNotification.message,
                        action: {
                            label: 'Ver',
                            onClick: () => handleNotificationClick(newNotification)
                        }
                    })

                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(newNotification.title, {
                            body: newNotification.message || undefined,
                            icon: '/icon-192.png',
                            badge: '/icon-192.png'
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId)

            if (error) throw error

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))

        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('read', false)

            if (error) throw error

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
            toast.success('Todas notificações marcadas como lidas')

        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            if (error) throw error

            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            toast.success('Notificação removida')

        } catch (error) {
            console.error('Erro ao deletar notificação:', error)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id)
        setIsOpen(false)

        // Navigate based on type
        if (notification.data?.url) {
            window.location.href = notification.data.url
        }
    }

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, any> = {
            lead: Users,
            development: Building2,
            evaluation: FileText,
            consultation: MessageSquare,
            system: AlertCircle,
            comment: MessageSquare
        }
        return icons[type] || Bell
    }

    const getNotificationColor = (type: string) => {
        const colors: Record<string, string> = {
            lead: 'bg-purple-50 text-purple-600',
            development: 'bg-blue-50 text-blue-600',
            evaluation: 'bg-pink-50 text-pink-600',
            consultation: 'bg-orange-50 text-orange-600',
            system: 'bg-gray-50 text-gray-600',
            comment: 'bg-green-50 text-green-600'
        }
        return colors[type] || 'bg-gray-50 text-gray-600'
    }

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                toast.success('Notificações ativadas!')
            }
        }
    }

    // Handle permission request on mount only once? 
    // User code had this separate useEffect.
    useEffect(() => {
        requestNotificationPermission()
    }, [])

    return (
        <>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-xl hover:bg-imi-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            >
                <Bell size={20} className="text-imi-700" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute top-12 right-0 md:fixed md:top-20 md:right-4 w-96 max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-imi-100 z-50 flex flex-col animate-in slide-in-from-top-4 duration-200 origin-top-right">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-imi-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-imi-900 text-lg">Notificações</h3>
                                {unreadCount > 0 && (
                                    <p className="text-xs text-imi-500 mt-0.5 font-medium">
                                        {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                                    </p>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm font-medium text-accent-600 hover:text-accent-700 px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors"
                                >
                                    Marcar todas
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-imi-600 text-sm">Carregando...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-imi-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell size={24} className="text-imi-300" />
                                    </div>
                                    <p className="font-medium text-imi-900 mb-1">Nenhuma notificação</p>
                                    <p className="text-sm text-imi-500">Você está em dia!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-imi-50">
                                    {notifications.map((notification) => {
                                        const Icon = getNotificationIcon(notification.type)
                                        const colorClass = getNotificationColor(notification.type)

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-imi-50 transition-colors cursor-pointer group relative ${!notification.read ? 'bg-accent-50/20' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                        <Icon size={18} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                                            <h4 className={`font-medium text-sm ${!notification.read ? 'text-imi-900' : 'text-imi-700'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>

                                                        {notification.message && (
                                                            <p className="text-sm text-imi-600 line-clamp-2 mb-2 leading-relaxed">
                                                                {notification.message}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-imi-400 font-medium">
                                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                                    addSuffix: true,
                                                                    locale: ptBR
                                                                })}
                                                            </span>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    deleteNotification(notification.id)
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all hover:text-red-700"
                                                                title="Remover notificação"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-4 border-t border-imi-100 bg-imi-50 rounded-b-2xl">
                                <Link
                                    href="/backoffice/notificacoes"
                                    onClick={() => setIsOpen(false)}
                                    className="block text-center text-sm font-medium text-accent-600 hover:text-accent-700 hover:underline"
                                >
                                    Ver todas notificações →
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
