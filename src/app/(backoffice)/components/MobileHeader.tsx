'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, ChevronRight, ChevronLeft, Settings, LogOut, Sun, User, Camera } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/format'

interface Notification {
    id: string
    type: string
    title: string
    message?: string
    read: boolean
    created_at: string
}

const PAGE_TITLES: Record<string, string> = {
    '/backoffice/hoje': 'Hoje',
    '/backoffice/dashboard': 'Dashboard',
    '/backoffice/imoveis': 'Imóveis',
    '/backoffice/imoveis/novo': 'Novo Imóvel',
    '/backoffice/leads': 'Leads',
    '/backoffice/leads/novo': 'Novo Lead',
    '/backoffice/leads/pipeline': 'Pipeline',
    '/backoffice/avaliacoes': 'Avaliações',
    '/backoffice/avaliacoes/nova': 'Nova Avaliação',
    '/backoffice/construtoras': 'Construtoras',
    '/backoffice/contratos': 'Contratos',
    '/backoffice/contratos/novo': 'Novo Contrato',
    '/backoffice/financeiro': 'Financeiro',
    '/backoffice/financeiro/metas': 'Metas',
    '/backoffice/financeiro/receber': 'A Receber',
    '/backoffice/financeiro/pagar': 'A Pagar',
    '/backoffice/tracking': 'Tracking',
    '/backoffice/tracking/qr': 'QR Tracking',
    '/backoffice/equipe': 'Equipe',
    '/backoffice/ranking': 'Ranking',
    '/backoffice/settings': 'Configurações',
    '/backoffice/relatorios': 'Relatórios',
    '/backoffice/notificacoes': 'Notificações',
    '/backoffice/whatsapp': 'WhatsApp',
    '/backoffice/omnichannel': 'Omni Channel',
    '/backoffice/projetos': 'Projetos',
    '/backoffice/automacoes': 'Automações',
    '/backoffice/integracoes': 'Integrações',
    '/backoffice/campanhas': 'Campanhas',
    '/backoffice/playbooks': 'Playbooks',
    '/backoffice/credito': 'Crédito',
    '/backoffice/credito/simulador': 'Simulador',
    '/backoffice/consultorias': 'Consultorias',
    '/backoffice/conteudo': 'Conteúdos',
    '/backoffice/agenda': 'Agenda',
    '/backoffice/perfil': 'Meu Perfil',
    '/backoffice/parcerias': 'Parcerias',
    '/backoffice/connect': 'Chat Equipe',
    '/backoffice/rentals': 'Rentals',
    '/backoffice/rentals/calendar': 'Calendário Rentals',
    '/backoffice/bpo': 'BPO Financeiro',
    '/backoffice/bpo/dre': 'DRE',
    '/backoffice/bpo/conciliacao': 'Conciliação',
}

function getPageTitle(pathname: string): string {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
    const segments = pathname.split('/')
    while (segments.length > 2) {
        segments.pop()
        const parent = segments.join('/')
        if (PAGE_TITLES[parent]) return PAGE_TITLES[parent]
    }
    return 'Backoffice'
}


// ── Avatar button — reusable ───────────────────────────────────────
function AvatarButton({
    avatarUrl,
    userInfo,
    accountOpen,
    onClick,
    size = 34,
}: {
    avatarUrl: string | null
    userInfo: { name: string; email: string; initials: string; role?: string } | null
    accountOpen: boolean
    onClick: () => void
    size?: number
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClick}
            className="flex items-center justify-center flex-shrink-0"
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size,
                aspectRatio: '1/1',
                borderRadius: '50%',
                overflow: 'hidden',
                outline: accountOpen
                    ? '2px solid var(--platinum-400)'
                    : '2px solid var(--border-gold, rgba(193,163,104,0.45))',
                outlineOffset: 1,
                background: avatarUrl ? 'transparent' : 'var(--accent-400)',
                transition: 'outline-color 0.2s',
                flexShrink: 0,
            }}
        >
            {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={avatarUrl}
                    alt={userInfo?.name ?? 'Avatar'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 15%',
                        display: 'block',
                    }}
                />
            ) : (
                <span
                    className="font-bold text-white select-none"
                    style={{ fontSize: size > 32 ? 12 : 11 }}
                >
                    {userInfo?.initials ?? <User size={size > 32 ? 14 : 12} />}
                </span>
            )}
        </motion.button>
    )
}

export default function MobileHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const [notifOpen, setNotifOpen] = useState(false)
    const [accountOpen, setAccountOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [userInfo, setUserInfo] = useState<{ name: string; email: string; initials: string; role?: string } | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const accountPanelRef = useRef<HTMLDivElement>(null)

    const title = getPageTitle(pathname)

    // Sub-page: segments like ['backoffice', 'leads', '123'] → length 3 → sub-page
    const segments = pathname?.split('/').filter(Boolean) || []
    const isSubPage = segments.length > 2

    // Load Supabase user info and avatar (check brokers + profiles + auth metadata)
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'
                const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

                // Try brokers table first (source of truth), then profiles, then auth metadata
                let avatar: string | null = null
                let role: string | undefined
                try {
                    const { data: broker } = await supabase
                        .from('brokers')
                        .select('avatar_url')
                        .eq('user_id', user.id)
                        .maybeSingle()
                    if (broker?.avatar_url) avatar = broker.avatar_url
                } catch {}
                if (!avatar) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role, avatar_url')
                            .eq('id', user.id)
                            .maybeSingle()
                        if (profile?.avatar_url) avatar = profile.avatar_url
                        role = profile?.role as string | undefined
                    } catch {}
                }
                if (!avatar) avatar = user.user_metadata?.avatar_url || null

                // If we didn't get role yet, fetch it
                if (!role) {
                    try {
                        const { data: dbUser } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .maybeSingle()
                        role = dbUser?.role as string | undefined
                    } catch {}
                }

                setAvatarUrl(avatar)
                setUserInfo({ name, email: user.email || '', initials, role })
            }
        })
    }, [])

    // Fetch notifications (on mount, route change, and every 30s)
    useEffect(() => {
        const fetchNotifications = () => {
            fetch('/api/notifications?limit=50')
                .then(r => r.json())
                .then(json => {
                    const items: Notification[] = Array.isArray(json) ? json : (json.data || [])
                    setNotifications(items.slice(0, 20))
                    setUnreadCount(items.filter((n: Notification) => !n.read).length)
                })
                .catch(() => {})
        }
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30_000)
        return () => clearInterval(interval)
    }, [pathname])

    // Close panels on outside click
    useEffect(() => {
        if (!notifOpen) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [notifOpen])

    useEffect(() => {
        if (!accountOpen) return
        const handler = (e: MouseEvent) => {
            if (accountPanelRef.current && !accountPanelRef.current.contains(e.target as Node)) setAccountOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [accountOpen])

    useEffect(() => { setNotifOpen(false); setAccountOpen(false) }, [pathname])

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_all: true }),
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch {}
    }

    const handleSignOut = async () => {
        setAccountOpen(false)
        const supabase = createClient()
        await supabase.auth.signOut({ scope: 'global' })
        document.cookie.split(';').forEach(c => {
            const name = c.split('=')[0].trim()
            if (name.startsWith('sb-')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
            }
        })
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-')) localStorage.removeItem(k)
        })
        window.location.href = '/login'
    }

    return (
        <>
            {/* ── Mobile Top Bar ── */}
            <div
                className="lg:hidden fixed top-0 inset-x-0 z-30"
                style={{
                    background: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-xs)',
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                }}
            >
                <div className="flex items-center h-14 px-4 gap-3">

                    {/* ── LEFT SLOT ─────────────────────────────────── */}
                    <div className="flex items-center flex-shrink-0">
                        <AnimatePresence mode="wait">
                            {isSubPage ? (
                                /* Back button on sub-pages */
                                <motion.button
                                    key="back"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.16 }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => router.back()}
                                    className="flex items-center justify-center"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 'var(--r-md)',
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
                                </motion.button>
                            ) : (
                                /* IMI Brand Logo on root pages */
                                <motion.div
                                    key="brand"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex items-center gap-2"
                                >
                                    {/* IMI monogram — Playfair Display 700 · Brand Identity v1.1 DARK */}
                                    <span style={{
                                        fontFamily: "'Playfair Display', Georgia, serif",
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#FFFFFF',
                                        letterSpacing: '2px',
                                        lineHeight: 1,
                                    }}>
                                        IMI
                                    </span>
                                    {/* Gold divider · 1px · Brand Identity v1.1 DARK */}
                                    <div style={{
                                        width: 1,
                                        height: 28,
                                        background: '#C8A44A',
                                        flexShrink: 0,
                                    }} />
                                    {/* Tagline · Brand Identity v1.1 DARK — gold on dark bg */}
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#C8A44A',
                                        letterSpacing: '2.5px',
                                        textTransform: 'uppercase',
                                        lineHeight: 1.45,
                                    }}>
                                        INTELIGÊNCIA<br />IMOBILIÁRIA
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── CENTER — Page title on sub-pages (absolute so truly centered) ── */}
                    {isSubPage && (
                        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={title}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-[15px] font-semibold tracking-[-0.01em]"
                                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                                >
                                    {title}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    )}

                    {/* ── RIGHT SLOT — Bell + Avatar ────────────────── */}
                    <div className="ml-auto flex items-center gap-1 flex-shrink-0">

                        {/* Notification Bell */}
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setNotifOpen(!notifOpen)}
                            className="relative flex items-center justify-center"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 'var(--r-md)',
                                background: notifOpen ? 'var(--bg-elevated)' : 'transparent',
                                border: notifOpen ? '1px solid var(--border-default)' : '1px solid transparent',
                                transition: 'background 0.15s, border-color 0.15s',
                            }}
                        >
                            <Bell
                                size={18}
                                style={{ color: notifOpen ? 'var(--accent-400)' : 'var(--text-tertiary)' }}
                            />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute top-[5px] right-[5px] min-w-[14px] h-[14px] px-0.5 text-[9px] font-bold text-white rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'var(--accent-400)',
                                        boxShadow: '0 0 0 2px var(--bg-surface)',
                                    }}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Avatar — always on right, after bell */}
                        <AvatarButton
                            avatarUrl={avatarUrl}
                            userInfo={userInfo}
                            accountOpen={accountOpen}
                            onClick={() => setAccountOpen(v => !v)}
                            size={36}
                        />
                    </div>
                </div>
            </div>

            {/* ── Account Drawer ── */}
            <AnimatePresence>
                {accountOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setAccountOpen(false)}
                        />
                        <motion.div
                            ref={accountPanelRef}
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                            className="lg:hidden fixed top-[60px] right-3 z-60 overflow-hidden"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--r-xl)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                                minWidth: 228,
                            }}
                        >
                            {/* User info header */}
                            <div
                                className="flex items-center gap-3 px-4 py-4"
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            >
                                <div
                                    className="rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                    style={{
                                        width: 40, height: 40, minWidth: 40, minHeight: 40, aspectRatio: '1/1',
                                        background: avatarUrl ? 'transparent' : 'var(--accent-400)',
                                        border: '1.5px solid var(--border-gold, rgba(193,163,104,0.45))',
                                    }}
                                >
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={avatarUrl}
                                            alt={userInfo?.name ?? 'Avatar'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                                        />
                                    ) : (
                                        userInfo?.initials ?? <User size={16} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                                        {userInfo?.name ?? 'Carregando...'}
                                    </p>
                                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                                        {userInfo?.email ?? ''}
                                    </p>
                                    {userInfo?.role && (
                                        <span
                                            className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                            style={{
                                                background: 'rgba(193,163,104,0.12)',
                                                color: 'var(--accent-400)',
                                                borderRadius: 'var(--r-sm)',
                                                fontFamily: 'var(--font-mono)',
                                            }}
                                        >
                                            {userInfo.role}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Menu rows */}
                            <div className="p-1.5">
                                {/* Appearance row with theme toggle */}
                                <div
                                    className="flex items-center gap-3 px-3 py-2.5"
                                    style={{ borderRadius: 'var(--r-md)', color: 'var(--text-secondary)' }}
                                >
                                    <Sun size={14} className="flex-shrink-0" />
                                    <span className="text-sm flex-1" style={{ fontFamily: 'var(--font-sans)' }}>Aparência</span>
                                    <ThemeToggle size="sm" />
                                </div>

                                <Link
                                    href="/backoffice/perfil"
                                    onClick={() => setAccountOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                                    style={{
                                        borderRadius: 'var(--r-md)',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-sans)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <User size={14} className="flex-shrink-0" />
                                    Meu Perfil
                                </Link>

                                <Link
                                    href="/backoffice/settings"
                                    onClick={() => setAccountOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                                    style={{
                                        borderRadius: 'var(--r-md)',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-sans)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <Settings size={14} className="flex-shrink-0" />
                                    Configurações
                                </Link>

                                <div className="my-1" style={{ height: 1, background: 'var(--border-subtle)' }} />

                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                                    style={{
                                        borderRadius: 'var(--r-md)',
                                        color: 'var(--error)',
                                        fontFamily: 'var(--font-sans)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <LogOut size={14} className="flex-shrink-0" />
                                    Sair
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Notification Panel ── */}
            <AnimatePresence>
                {notifOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setNotifOpen(false)}
                        />
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="lg:hidden fixed top-[60px] inset-x-3 z-60 overflow-hidden"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--r-xl)',
                                boxShadow: 'var(--shadow-xl)',
                                maxHeight: '70vh',
                            }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            >
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                                >
                                    Notificações
                                </span>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[11px] font-semibold"
                                            style={{ color: 'var(--accent-400)', fontFamily: 'var(--font-sans)' }}
                                        >
                                            Marcar lidas
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setNotifOpen(false)}
                                        className="flex items-center justify-center"
                                        style={{ width: 24, height: 24, borderRadius: 'var(--r-sm)', background: 'var(--bg-hover)' }}
                                    >
                                        <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification list */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 52px - 48px)' }}>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className="flex gap-3 px-4 py-3 transition-all"
                                        style={{
                                            background: n.read ? 'transparent' : 'var(--bg-hover)',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        <div
                                            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                                            style={{ background: n.read ? 'transparent' : 'var(--accent-400)' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-xs font-semibold"
                                                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                                            >
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p
                                                    className="text-[11px] mt-0.5 truncate"
                                                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}
                                                >
                                                    {n.message}
                                                </p>
                                            )}
                                            <p
                                                className="text-[10px] mt-1"
                                                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                                            >
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center">
                                        <Bell size={22} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                                            Nenhuma notificação
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div
                                className="px-4 py-3 text-center"
                                style={{ borderTop: '1px solid var(--border-subtle)' }}
                            >
                                <button
                                    onClick={() => { setNotifOpen(false); router.push('/backoffice/notificacoes') }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold mx-auto"
                                    style={{ color: 'var(--accent-400)', fontFamily: 'var(--font-sans)' }}
                                >
                                    Ver todas <ChevronRight size={12} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
