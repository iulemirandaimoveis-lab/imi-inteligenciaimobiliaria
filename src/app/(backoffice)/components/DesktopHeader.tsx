'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Notification {
    id: string
    type: string
    title: string
    message?: string
    read: boolean
    created_at: string
}

function timeAgo(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d`
}

function SearchBar() {
    const [focused, setFocused] = useState(false)

    const trigger = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    }

    return (
        <motion.button
            onClick={trigger}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            animate={{ scale: focused ? 1.01 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center gap-3 h-9 px-4 w-full max-w-[280px] rounded-xl transition-all duration-200"
            style={{
                background: 'var(--bo-surface)',
                border: `1px solid ${focused ? 'var(--bo-border-gold)' : 'var(--bo-border)'}`,
                boxShadow: focused ? '0 0 0 3px rgba(26,26,46,0.08)' : 'none',
            }}
        >
            <Search size={14} style={{ color: focused ? 'var(--accent-500)' : 'var(--bo-text-muted)' }} className="flex-shrink-0 transition-colors" />
            <span className="text-sm flex-1 text-left" style={{ color: 'var(--bo-text-muted)' }}>
                Buscar...
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-4 text-[9px] font-semibold rounded"
                    style={{ background: 'var(--bo-elevated)', color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)' }}>
                    ⌘
                </kbd>
                <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold rounded"
                    style={{ background: 'var(--bo-elevated)', color: 'var(--bo-text-muted)', border: '1px solid var(--bo-border)' }}>
                    K
                </kbd>
            </div>
        </motion.button>
    )
}

function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unread, setUnread] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        fetch('/api/notifications')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setNotifications(data.slice(0, 10))
                    setUnread(data.filter((n: Notification) => !n.read).length)
                }
            })
            .catch(() => {})
    }, [pathname])

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_all: true }),
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnread(0)
        } catch (err) {
            console.error('Failed to mark notifications as read:', err)
        }
    }

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{
                    background: open ? 'var(--bo-elevated)' : 'transparent',
                    border: `1px solid ${open ? 'var(--bo-border-gold)' : 'transparent'}`,
                    color: open ? 'var(--accent-500)' : 'var(--bo-text-muted)',
                }}
            >
                <Bell size={16} />
                {unread > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[8px] font-bold text-white rounded-full flex items-center justify-center"
                        style={{ background: 'var(--accent-500)', boxShadow: '0 0 0 2px var(--bo-surface)' }}
                    >
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute right-0 top-11 w-80 rounded-2xl z-20 overflow-hidden"
                            style={{
                                background: 'var(--bo-elevated)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: 'var(--bo-shadow-elevated)',
                                maxHeight: '70vh',
                            }}
                        >
                            <div className="flex items-center justify-between px-4 py-3.5"
                                style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                <span className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Notificações</span>
                                {unread > 0 && (
                                    <button onClick={markAllRead} className="text-xs cursor-pointer" style={{ color: 'var(--accent-500)' }}>
                                        Marcar lidas
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                                {notifications.length > 0 ? notifications.map((n, i) => (
                                    <motion.div key={n.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover-card flex gap-3 px-4 py-3 cursor-pointer transition-all"
                                        style={{
                                            background: !n.read ? 'var(--bo-active-bg)' : 'transparent',
                                            borderBottom: '1px solid var(--bo-border)',
                                        }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                            style={{ background: n.read ? 'transparent' : 'var(--accent-500)' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-tight" style={{ color: 'var(--bo-text)' }}>{n.title}</p>
                                            {n.message && (
                                                <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: 'var(--bo-text-muted)' }}>{n.message}</p>
                                            )}
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--bo-text-muted)' }}>{timeAgo(n.created_at)}</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-8 text-center">
                                        <Bell size={20} className="mx-auto mb-2" style={{ color: 'var(--bo-text-muted)', opacity: 0.3 }} />
                                        <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Nenhuma notificação</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--bo-border)' }}>
                                <button
                                    onClick={() => { setOpen(false); router.push('/backoffice/notificacoes') }}
                                    className="text-xs cursor-pointer"
                                    style={{ color: 'var(--accent-500)' }}
                                >
                                    Ver todas →
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 h-9 px-2.5 rounded-xl transition-all"
                style={{
                    background: open ? 'var(--bo-elevated)' : 'transparent',
                    border: `1px solid ${open ? 'var(--bo-border-gold)' : 'transparent'}`,
                }}
            >
                <div className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}>
                    IM
                </div>
                <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--bo-text)' }}>Iule</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={12} style={{ color: 'var(--bo-text-muted)' }} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute right-0 top-11 w-56 rounded-2xl z-20 overflow-hidden"
                            style={{
                                background: 'var(--bo-elevated)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: 'var(--bo-shadow-elevated)',
                            }}
                        >
                            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full text-sm font-bold text-white flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}>
                                        IM
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>Iule Miranda</p>
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--accent-500)' }}>CRECI 17933 · Admin</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-1.5">
                                {[
                                    { icon: Settings, label: 'Configurações', action: () => { setOpen(false); router.push('/backoffice/settings') } },
                                ].map(({ icon: Icon, label, action }) => (
                                    <button key={label} onClick={action}
                                        className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                                        style={{ color: 'var(--bo-text-muted)' }}
                                    >
                                        <Icon size={14} />{label}
                                    </button>
                                ))}
                                <div className="h-px my-1" style={{ background: 'var(--bo-border)' }} />
                                <button onClick={() => { setOpen(false); onSignOut() }}
                                    className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                                    style={{ color: 'var(--s-cancel)' }}
                                >
                                    <LogOut size={14} />Sair
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function DesktopHeader() {
    const router = useRouter()
    const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }

    return (
        <header
            className="hidden lg:flex lg:fixed lg:top-0 lg:right-0 lg:left-60 lg:z-30 lg:h-16 items-center"
            style={{
                background: 'var(--header-bg, rgba(255,255,255,0.85))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--bo-border)',
            }}
        >
            <div className="w-full h-full px-6 flex items-center justify-between gap-4">
                <SearchBar />
                <div className="flex items-center gap-1.5">
                    <NotificationBell />
                    <div className="w-px h-5 mx-1" style={{ background: 'var(--bo-border)' }} />
                    <UserMenu onSignOut={handleSignOut} />
                </div>
            </div>
        </header>
    )
}
