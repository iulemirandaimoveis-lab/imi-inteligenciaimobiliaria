'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown, X, TrendingUp, Users, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Mock notifications ──────────────────────────────────────
const notifications = [
    {
        id: 1,
        type: 'lead',
        icon: Users,
        color: '#3B82F6',
        bg: '#EFF6FF',
        title: 'Novo lead qualificado',
        description: 'Maria Santos — Boa Viagem, 3Q',
        time: '8 min atrás',
        unread: true,
    },
    {
        id: 2,
        type: 'avaliacao',
        icon: FileText,
        color: '#10B981',
        bg: '#F0FDF4',
        title: 'Avaliação aprovada',
        description: 'Reserva Atlantis — Laudo NBR enviado',
        time: '2h atrás',
        unread: true,
    },
    {
        id: 3,
        type: 'meta',
        icon: TrendingUp,
        color: '#D4AF37',
        bg: '#FFF9E6',
        title: 'Meta mensal atingida',
        description: 'Pipeline Q1 superou R$ 2.4M',
        time: '1d atrás',
        unread: false,
    },
]

// ── Search Bar ────────────────────────────────────────────────
function SearchBar() {
    const [focused, setFocused] = useState(false)

    const triggerPalette = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    }

    return (
        <motion.button
            onClick={triggerPalette}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            animate={{ scale: focused ? 1.01 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center gap-3 h-10 px-4 w-full max-w-[320px] text-left rounded-xl transition-all duration-200"
            style={{
                background: focused ? 'white' : '#F8F9FA',
                border: `1px solid ${focused ? 'rgba(212,175,55,0.4)' : '#E9ECEF'}`,
                boxShadow: focused ? '0 0 0 3px rgba(212,175,55,0.10), 0 2px 8px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.04)',
            }}
        >
            <Search size={15} style={{ color: focused ? 'var(--accent-600)' : '#ADB5BD' }} className="flex-shrink-0 transition-colors duration-150" />
            <span className="text-sm flex-1" style={{ color: '#ADB5BD' }}>
                Buscar no sistema...
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
                <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-5 text-[10px] font-semibold rounded-md"
                    style={{ background: '#E9ECEF', color: '#6C757D', border: '1px solid #DEE2E6' }}>
                    ⌘
                </kbd>
                <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-md"
                    style={{ background: '#E9ECEF', color: '#6C757D', border: '1px solid #DEE2E6' }}>
                    K
                </kbd>
            </div>
        </motion.button>
    )
}

// ── Notification Bell ─────────────────────────────────────────
function NotificationBell() {
    const [open, setOpen] = useState(false)
    const unreadCount = notifications.filter(n => n.unread).length
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150"
                style={{
                    background: open ? '#F8F9FA' : 'transparent',
                    border: open ? '1px solid #E9ECEF' : '1px solid transparent',
                    color: open ? '#343A40' : '#6C757D',
                }}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white rounded-full"
                        style={{ background: '#EF4444', boxShadow: '0 0 0 2px white' }}
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-10"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute right-0 top-12 w-80 rounded-2xl z-20 overflow-hidden"
                            style={{
                                background: 'white',
                                border: '1px solid #E9ECEF',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4"
                                style={{ borderBottom: '1px solid #F1F3F5' }}>
                                <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                                    Notificações
                                </span>
                                <span className="text-xs font-medium" style={{ color: 'var(--accent-600)' }}>
                                    Marcar todas como lidas
                                </span>
                            </div>

                            {/* Items */}
                            <div className="divide-y" style={{ borderColor: '#F8F9FA' }}>
                                {notifications.map((n, i) => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors duration-120"
                                        style={{ background: n.unread ? 'rgba(212,175,55,0.03)' : 'transparent' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
                                        onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'rgba(212,175,55,0.03)' : 'transparent')}
                                    >
                                        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ background: n.bg }}>
                                            <n.icon size={16} style={{ color: n.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs mt-0.5 truncate" style={{ color: '#6C757D' }}>
                                                {n.description}
                                            </p>
                                            <p className="text-[10px] mt-1" style={{ color: '#ADB5BD' }}>{n.time}</p>
                                        </div>
                                        {n.unread && (
                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                                style={{ background: 'var(--accent-500)' }} />
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid #F1F3F5' }}>
                                <span className="text-xs font-medium cursor-pointer" style={{ color: 'var(--accent-600)' }}>
                                    Ver todas as notificações →
                                </span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── User Menu ─────────────────────────────────────────────────
function UserMenu({ onSignOut }: { onSignOut: () => void }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 h-10 px-3 rounded-xl transition-all duration-150"
                style={{
                    background: open ? 'white' : '#F8F9FA',
                    border: `1px solid ${open ? 'rgba(212,175,55,0.3)' : '#E9ECEF'}`,
                    boxShadow: open ? '0 4px 12px rgba(212,175,55,0.1)' : 'none',
                }}
            >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}>
                    IM
                </div>
                <span className="hidden sm:block text-sm font-medium" style={{ color: '#343A40' }}>
                    Iule Miranda
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} style={{ color: '#ADB5BD' }} />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-10"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute right-0 top-12 w-60 rounded-2xl z-20 overflow-hidden"
                            style={{
                                background: 'white',
                                border: '1px solid #E9ECEF',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
                            }}
                        >
                            {/* User info */}
                            <div className="px-4 py-4" style={{ borderBottom: '1px solid #F1F3F5' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}>
                                        IM
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Iule Miranda</p>
                                        <p className="text-xs" style={{ color: '#6C757D' }}>iulemirandaimoveis@gmail.com</p>
                                        <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--accent-600)' }}>
                                            CRECI 17933 · Admin
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-2">
                                <MenuAction
                                    icon={Settings}
                                    label="Configurações"
                                    onClick={() => { setOpen(false); router.push('/backoffice/settings') }}
                                />
                                <div className="h-px my-1.5" style={{ background: '#F1F3F5' }} />
                                <MenuAction
                                    icon={LogOut}
                                    label="Sair da conta"
                                    danger
                                    onClick={() => { setOpen(false); onSignOut() }}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function MenuAction({ icon: Icon, label, danger, onClick }: {
    icon: any; label: string; danger?: boolean; onClick: () => void
}) {
    return (
        <motion.button
            whileHover={{ x: 2 }}
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-120"
            style={{ color: danger ? '#DC2626' : '#495057' }}
            onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FEF2F2' : '#F8F9FA')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <Icon size={15} />
            {label}
        </motion.button>
    )
}

// ── Main Header ───────────────────────────────────────────────
export default function DesktopHeader() {
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header
            className="hidden lg:flex lg:fixed lg:top-0 lg:right-0 lg:left-60 lg:z-30 lg:h-16 items-center"
            style={{
                background: 'rgba(248,249,250,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(233,236,239,0.8)',
            }}
        >
            <div className="w-full h-full px-6 flex items-center justify-between gap-4">
                {/* Left */}
                <SearchBar />

                {/* Right */}
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <div className="w-px h-6 mx-1" style={{ background: '#E9ECEF' }} />
                    <UserMenu onSignOut={handleSignOut} />
                </div>
            </div>
        </header>
    )
}
