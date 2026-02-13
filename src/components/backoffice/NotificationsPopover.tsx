'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, Heart, MessageSquare, AlertCircle, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
    id: string
    title: string
    message: string
    type: 'lead' | 'system' | 'message' | 'alert'
    read: boolean
    time: string
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'Novo Lead Qualificado',
        message: 'Roberto Silva demonstrou interesse no Setai Beach Resort.',
        type: 'lead',
        read: false,
        time: 'há 2 min'
    },
    {
        id: '2',
        title: 'Atualização do Sistema',
        message: 'O módulo de IA foi atualizado com novos prompts de venda.',
        type: 'system',
        read: false,
        time: 'há 1h'
    },
    {
        id: '3',
        title: 'Nova Mensagem',
        message: 'Carla (Corretora): Preciso da tabela atualizada do Mondo.',
        type: 'message',
        read: true,
        time: 'há 3h'
    }
]

export default function NotificationsPopover() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const handleClearAll = () => {
        setNotifications([])
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'lead': return <Heart size={16} className="text-pink-500" fill="currentColor" />
            case 'system': return <AlertCircle size={16} className="text-blue-500" />
            case 'message': return <MessageSquare size={16} className="text-green-500" />
            case 'alert': return <AlertCircle size={16} className="text-red-500" />
            default: return <Bell size={16} className="text-gray-500" />
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 shadow-sm active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-background-dark animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-card-dark rounded-3xl shadow-soft-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 origin-top-right"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount} novas
                                    </span>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    Limpar tudo
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50 dark:divide-white/5">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative group ${!notification.read ? 'bg-primary/[0.02]' : ''}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border ${!notification.read ? 'bg-white shadow-soft dark:bg-white/10 border-gray-100 dark:border-white/10' : 'bg-gray-100 dark:bg-white/5 border-transparent opacity-60'}`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`text-sm font-medium leading-tight ${!notification.read ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{notification.time}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleMarkAsRead(notification.id)
                                                    }}
                                                    className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 bg-white dark:bg-card-dark rounded-full shadow-md flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                    title="Marcar como lida"
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="text-gray-300 dark:text-gray-600" size={24} />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma notificação por enquanto.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-center">
                                <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                                    Ver todas as notificações
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
