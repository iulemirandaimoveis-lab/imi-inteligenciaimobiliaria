'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown, TrendingUp, Users, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const notifications = [
    {
        id: 1, icon: Users, title: 'Novo lead qualificado',
        description: 'Maria Santos — Boa Viagem, 3Q',
        time: '8 min atrás', unread: true,
    },
    {
        id: 2, icon: FileText, title: 'Avaliação aprovada',
        description: 'Reserva Atlantis — Laudo NBR enviado',
        time: '2h atrás', unread: true,
    },
    {
        id: 3, icon: TrendingUp, title: 'Meta mensal atingida',
        description: 'Pipeline Q1 superou R$ 2.4M',
        time: '1d atrás', unread: false,
    },
]

const S = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    gold: '#C49D5B',
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
                background: S.surface,
                border: `1px solid ${focused ? S.borderGold : S.border}`,
                boxShadow: focused ? `0 0 0 3px rgba(196,157,91,0.08)` : 'none',
            }}
        >
            <Search size={14} style={{ color: focused ? S.gold : S.textMuted }} className="flex-shrink-0 transition-colors" />
            <span className="text-sm flex-1 text-left" style={{ color: S.textMuted }}>
                Buscar...
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-4 text-[9px] font-semibold rounded"
                    style={{ background: S.elevated, color: S.textMuted, border: `1px solid ${S.border}` }}>
                    ⌘
                </kbd>
                <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold rounded"
                    style={{ background: S.elevated, color: S.textMuted, border: `1px solid ${S.border}` }}>
                    K
                </kbd>
            </div>
        </motion.button>
    )
}

function NotificationBell() {
    const [open, setOpen] = useState(false)
    const unread = notifications.filter(n => n.unread).length
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{
                    background: open ? S.elevated : 'transparent',
                    border: `1px solid ${open ? S.borderGold : 'transparent'}`,
                    color: open ? S.gold : S.textMuted,
                }}
            >
                <Bell size={16} />
                {unread > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[8px] font-bold text-white rounded-full flex items-center justify-center"
                        style={{ background: '#C49D5B', boxShadow: `0 0 0 2px var(--bo-surface)` }}
                    >
                        {unread}
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
                            className="absolute right-0 top-11 w-72 rounded-2xl z-20 overflow-hidden"
                            style={{
                                background: S.elevated,
                                border: `1px solid ${S.border}`,
                                boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div className="flex items-center justify-between px-4 py-3.5"
                                style={{ borderBottom: `1px solid ${S.border}` }}>
                                <span className="text-sm font-semibold" style={{ color: S.text }}>Notificações</span>
                                <span className="text-xs cursor-pointer" style={{ color: S.gold }}>Marcar lidas</span>
                            </div>
                            <div>
                                {notifications.map((n, i) => (
                                    <motion.div key={n.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex gap-3 px-4 py-3.5 cursor-pointer transition-all"
                                        style={{ background: n.unread ? 'rgba(196,157,91,0.03)' : 'transparent' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bo-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'rgba(196,157,91,0.03)' : 'transparent')}
                                    >
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--bo-active-bg)' }}>
                                            <n.icon size={14} style={{ color: S.gold }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-tight" style={{ color: S.text }}>{n.title}</p>
                                            <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: S.textMuted }}>{n.description}</p>
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--bo-text-muted)' }}>{n.time}</p>
                                        </div>
                                        {n.unread && <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: S.gold }} />}
                                    </motion.div>
                                ))}
                            </div>
                            <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid var(--bo-border)` }}>
                                <span className="text-xs cursor-pointer" style={{ color: S.gold }}>Ver todas →</span>
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
                    background: open ? S.elevated : 'transparent',
                    border: `1px solid ${open ? S.borderGold : 'transparent'}`,
                }}
            >
                <div className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C49D5B, #8B5E1F)' }}>
                    IM
                </div>
                <span className="hidden sm:block text-xs font-medium" style={{ color: S.text }}>Iule</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={12} style={{ color: S.textMuted }} />
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
                                background: S.elevated,
                                border: `1px solid ${S.border}`,
                                boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div className="px-4 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full text-sm font-bold text-white flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #C49D5B, #8B5E1F)' }}>
                                        IM
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: S.text }}>Iule Miranda</p>
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: S.gold }}>CRECI 17933 · Admin</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-1.5">
                                {[
                                    { icon: Settings, label: 'Configurações', action: () => { setOpen(false); router.push('/backoffice/settings') } },
                                ].map(({ icon: Icon, label, action }) => (
                                    <button key={label} onClick={action}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                                        style={{ color: S.textMuted }}
                                        onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); (e.currentTarget.style.color = S.text) }}
                                        onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = S.textMuted) }}
                                    >
                                        <Icon size={14} />{label}
                                    </button>
                                ))}
                                <div className="h-px my-1" style={{ background: S.border }} />
                                <button onClick={() => { setOpen(false); onSignOut() }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                                    style={{ color: '#E57373' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,115,115,0.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                background: 'rgba(13,15,20,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
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
