'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, X, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

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
    '/backoffice/conteudos': 'Conteúdos',
    '/backoffice/agenda': 'Agenda',
}

function getPageTitle(pathname: string): string {
    // Exact match first
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
    // Closest parent match
    const segments = pathname.split('/')
    while (segments.length > 2) {
        segments.pop()
        const parent = segments.join('/')
        if (PAGE_TITLES[parent]) return PAGE_TITLES[parent]
    }
    return 'Backoffice'
}

function timeAgo(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d`
}

export default function MobileHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const [notifOpen, setNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const panelRef = useRef<HTMLDivElement>(null)

    const title = getPageTitle(pathname)

    // Sub-page detection: ['backoffice', 'leads', '123'] → length 3 → sub-page
    const segments = pathname?.split('/').filter(Boolean) || []
    const isSubPage = segments.length > 2

    // Fetch notifications
    useEffect(() => {
        fetch('/api/notifications')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setNotifications(data.slice(0, 20))
                    setUnreadCount(data.filter((n: Notification) => !n.read).length)
                }
            })
            .catch(() => { })
    }, [pathname])

    // Close panel on outside click
    useEffect(() => {
        if (!notifOpen) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [notifOpen])

    // Close on route change
    useEffect(() => { setNotifOpen(false) }, [pathname])

    const triggerSearch = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    }

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_all: true }),
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch { }
    }

    return (
        <>
            {/* ── Mobile Top Bar ── */}
            <div
                className="lg:hidden fixed top-0 inset-x-0 z-40"
                style={{
                    background: 'var(--header-bg)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--bo-border)',
                }}
            >
                <div className="relative flex items-center h-14 px-2">
                    {/* Left: back button or app icon */}
                    <div className="w-12 flex items-center justify-center flex-shrink-0">
                        {isSubPage ? (
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => router.back()}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={{ background: 'var(--bo-elevated)' }}
                            >
                                <ChevronLeft size={20} style={{ color: 'var(--bo-text)' }} />
                            </motion.button>
                        ) : (
                            <Link
                                href="/backoffice/hoje"
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={{ background: 'var(--bo-elevated)' }}
                            >
                                <span
                                    className="text-base font-bold"
                                    style={{ color: 'var(--nav-active)', fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    ◆
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* Center: page title — absolute so it's truly centered */}
                    <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={title}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.18 }}
                                className="text-[15px] font-semibold tracking-[-0.01em]"
                                style={{ color: 'var(--bo-text)' }}
                            >
                                {title}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    {/* Right: Actions — apenas Bell + ThemeToggle, search fica no drawer Mais */}
                    <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                        {/* Theme Toggle */}
                        <ThemeToggle size="sm" />

                        {/* Notifications */}
                        <button
                            onClick={() => setNotifOpen(!notifOpen)}
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: notifOpen ? 'var(--bo-elevated)' : 'transparent' }}
                        >
                            <Bell size={18} style={{ color: notifOpen ? 'var(--bo-accent)' : 'var(--bo-text-muted)' }} />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center"
                                    style={{ background: 'var(--bo-accent)', boxShadow: '0 0 0 2px var(--bo-surface)' }}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Notification Panel ── */}
            <AnimatePresence>
                {notifOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50"
                            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setNotifOpen(false)}
                        />
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="lg:hidden fixed top-14 inset-x-3 z-50 rounded-2xl overflow-hidden"
                            style={{
                                background: 'var(--bo-elevated)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                                maxHeight: '70vh',
                            }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: '1px solid var(--bo-border)' }}
                            >
                                <span className="text-sm font-bold" style={{ color: 'var(--bo-text)' }}>
                                    Notificações
                                </span>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-[11px] font-semibold"
                                            style={{ color: 'var(--bo-accent)' }}
                                        >
                                            Marcar lidas
                                        </button>
                                    )}
                                    <button onClick={() => setNotifOpen(false)}>
                                        <X size={16} style={{ color: 'var(--bo-text-muted)' }} />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 52px)' }}>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className="flex gap-3 px-4 py-3 transition-all"
                                        style={{
                                            background: n.read ? 'transparent' : 'var(--bo-hover)',
                                            borderBottom: '1px solid var(--bo-border)',
                                        }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                            style={{ background: n.read ? 'transparent' : 'var(--bo-accent)' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold" style={{ color: 'var(--bo-text)' }}>
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--bo-text-muted)' }}>
                                                    {n.message}
                                                </p>
                                            )}
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--bo-text-muted)' }}>
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center">
                                        <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--bo-text-muted)', opacity: 0.3 }} />
                                        <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>
                                            Nenhuma notificação
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div
                                className="px-4 py-3 text-center"
                                style={{ borderTop: '1px solid var(--bo-border)' }}
                            >
                                <button
                                    onClick={() => { setNotifOpen(false); router.push('/backoffice/notificacoes') }}
                                    className="text-xs font-semibold flex items-center justify-center gap-1 mx-auto"
                                    style={{ color: 'var(--bo-accent)' }}
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
