'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
    LayoutDashboard, Building2, Users, X,
    FileText, Briefcase, BookOpen, Settings,
    MessageSquare, Banknote, FolderOpen, MoreHorizontal,
    Scale, CreditCard, FileStack, Layers, Target, Zap, FileSignature, LogOut,
    Megaphone, BarChart2, Plug, TrendingUp, TrendingDown, CalendarDays,
    QrCode, Sparkles, Building, Search, Sun
} from 'lucide-react'

// ── Task-based navigation (Sprint 27) ───────────────────────────
// Corretor workflow: Hoje → plan day | Clientes → leads | Imóveis → portfolio | Agenda → schedule
const MAIN = [
    { name: 'Hoje', href: '/backoffice/hoje', icon: Sun },
    { name: 'Clientes', href: '/backoffice/leads', icon: Users },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Agenda', href: '/backoffice/agenda', icon: CalendarDays },
]

const GROUPS = [
    {
        label: 'Visão Executiva',
        items: [
            { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
            { name: 'Metas & Performance', href: '/backoffice/financeiro/metas', icon: Target },
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: FileStack },
        ],
    },
    {
        label: 'Captação',
        items: [
            { name: 'Leads', href: '/backoffice/leads', icon: Users },
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
            { name: 'QR Tracking', href: '/backoffice/tracking/qr', icon: QrCode },
            { name: 'Omni Channel', href: '/backoffice/omnichannel', icon: Layers },
            { name: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
        ],
    },
    {
        label: 'Conversão',
        items: [
            { name: 'Pipeline', href: '/backoffice/leads/pipeline', icon: TrendingUp },
            { name: 'Simulações', href: '/backoffice/credito/simulador', icon: CreditCard },
            { name: 'Agenda', href: '/backoffice/agenda', icon: CalendarDays },
        ],
    },
    {
        label: 'Portfólio',
        items: [
            { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building },
            { name: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
            { name: 'Publicações', href: '/backoffice/conteudos', icon: FileText },
        ],
    },
    {
        label: 'Operação',
        items: [
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: Scale },
            { name: 'Contratos', href: '/backoffice/contratos', icon: FileSignature },
            { name: 'Consultoria', href: '/backoffice/consultorias', icon: Briefcase },
            { name: 'Crédito', href: '/backoffice/credito', icon: CreditCard },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { name: 'Visão Geral', href: '/backoffice/financeiro', icon: Banknote },
            { name: 'A Receber', href: '/backoffice/financeiro/receber', icon: TrendingUp },
            { name: 'A Pagar', href: '/backoffice/financeiro/pagar', icon: TrendingDown },
        ],
    },
    {
        label: 'Crescimento',
        items: [
            { name: 'Automações', href: '/backoffice/automacoes', icon: Zap },
            { name: 'Playbooks', href: '/backoffice/playbooks', icon: BookOpen },
            { name: 'Analytics', href: '/backoffice/tracking', icon: BarChart2 },
            { name: 'IA Avaliações', href: '/backoffice/avaliacoes/ia', icon: Sparkles },
        ],
    },
    {
        label: 'Configurações',
        items: [
            { name: 'Equipe', href: '/backoffice/equipe', icon: Users },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Plug },
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
        ],
    },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dragControls = useDragControls()

    // Lock body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on navigation
    useEffect(() => { setOpen(false) }, [pathname])

    // Clear search when drawer closes
    useEffect(() => { if (!open) setSearch('') }, [open])

    // Filter groups based on search query
    const filtered = search.trim()
        ? GROUPS
            .map(g => ({
                ...g,
                items: g.items.filter(item =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                ),
            }))
            .filter(g => g.items.length > 0)
        : GROUPS

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div
                    className="mx-2 mb-2 rounded-xl overflow-hidden"
                    style={{
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: 'var(--bo-shadow)',
                    }}
                >
                    <div className="flex items-center justify-between px-2">
                        {MAIN.map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="relative flex flex-col items-center justify-center py-2.5 w-full"
                                    >
                                        <AnimatePresence>
                                            {active && (
                                                <motion.div
                                                    layoutId="nav-active-pill"
                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                    className="absolute inset-0 mx-1.5 rounded-lg"
                                                    style={{ background: 'var(--bo-active-bg)' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <item.icon
                                            size={18}
                                            className="relative transition-colors duration-150"
                                            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="relative text-[10px] font-medium mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}

                        {/* Menu button */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setOpen(!open)}
                            className="relative flex-1 flex flex-col items-center justify-center py-2.5"
                        >
                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.7 }}
                                        className="absolute inset-0 mx-1 rounded-xl"
                                        style={{ background: 'var(--bo-active-bg)' }}
                                    />
                                )}
                            </AnimatePresence>
                            <motion.span
                                animate={{ rotate: open ? 135 : 0 }}
                                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                className="relative"
                            >
                                {open
                                    ? <X size={20} style={{ color: 'var(--nav-active)' }} />
                                    : <MoreHorizontal size={20} style={{ color: 'var(--nav-inactive)' }} />
                                }
                            </motion.span>
                            <span
                                className="relative text-[10px] font-semibold mt-1 transition-colors"
                                style={{ color: open ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                            >
                                Mais
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Full-screen Drawer ─────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 z-40"
                            style={{ background: 'rgba(7,9,13,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                            onClick={() => setOpen(false)}
                        />

                        {/* Sheet — supports swipe-to-dismiss via drag handle */}
                        <motion.div
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.3 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 400) {
                                    setOpen(false)
                                }
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-3xl flex flex-col"
                            style={{
                                background: 'var(--bo-drawer-bg)',
                                border: '1px solid var(--bo-border)',
                                borderBottom: 'none',
                                boxShadow: 'var(--bo-shadow-elevated)',
                                maxHeight: 'min(85dvh, 85vh)',
                                height: 'min(85dvh, 85vh)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* ── Drag Handle — touch here to swipe down ── */}
                            <div
                                className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => dragControls.start(e)}
                            >
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bo-border)' }} />
                            </div>

                            {/* ── Header ── */}
                            <div
                                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid var(--bo-border)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="text-2xl font-bold tracking-tight"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--bo-text)' }}
                                    >
                                        IMI
                                    </span>
                                    <div className="h-6 w-px" style={{ background: 'var(--bo-border)' }} />
                                    <span
                                        className="text-[11px] font-medium uppercase tracking-[0.15em] leading-[1.2]"
                                        style={{ color: 'var(--bo-text-muted)' }}
                                    >
                                        Inteligência<br />Imobiliária
                                    </span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setOpen(false)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'var(--bo-icon-bg)' }}
                                >
                                    <X size={16} style={{ color: 'var(--bo-text-muted)' }} />
                                </motion.button>
                            </div>

                            {/* ── Search ── */}
                            <div className="px-4 py-3 flex-shrink-0">
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: 'var(--bo-text-muted)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Buscar seção..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none placeholder:opacity-50"
                                        style={{
                                            background: 'var(--bo-icon-bg)',
                                            border: '1px solid var(--bo-border)',
                                            color: 'var(--bo-text)',
                                        }}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full"
                                            style={{ background: 'var(--bo-border)' }}
                                        >
                                            <X size={10} style={{ color: 'var(--bo-text-muted)' }} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── Menu Groups ── */}
                            <div className="overflow-y-auto flex-1 pb-[calc(72px+env(safe-area-inset-bottom))]">
                                {filtered.length === 0 && (
                                    <div className="py-12 text-center px-6">
                                        <Search size={28} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--bo-text-muted)' }} />
                                        <p className="text-sm" style={{ color: 'var(--bo-text-muted)' }}>
                                            Nenhum resultado para<br />
                                            <span className="font-semibold" style={{ color: 'var(--bo-text)' }}>"{search}"</span>
                                        </p>
                                    </div>
                                )}

                                {filtered.map((group, gi) => (
                                    <div key={group.label} className="pt-4">
                                        <p
                                            className="px-6 pb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                                            style={{ color: 'var(--bo-text-muted)' }}
                                        >
                                            {group.label}
                                        </p>
                                        {group.items.map((item, i) => {
                                            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                            return (
                                                <motion.div
                                                    key={item.href}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: search ? 0 : (gi * 3 + i) * 0.018 }}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setOpen(false)}
                                                        className="flex items-center gap-4 px-5 py-3 mx-2 rounded-xl transition-all"
                                                        style={{
                                                            background: active ? 'var(--bo-active-bg)' : 'transparent',
                                                            color: active ? 'var(--nav-active)' : 'var(--bo-text-muted)',
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bo-hover)'
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                            style={{
                                                                background: active ? 'rgba(26,26,46,0.15)' : 'var(--bo-icon-bg)',
                                                            }}
                                                        >
                                                            <item.icon size={15} />
                                                        </div>
                                                        <span className="text-sm font-medium flex-1">{item.name}</span>
                                                        {active && (
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--nav-active)' }} />
                                                        )}
                                                    </Link>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ))}

                                {/* ── User Profile & Logout ── */}
                                {!search && (
                                    <div
                                        className="mt-4 px-6 pb-6 pt-4"
                                        style={{ borderTop: '1px solid var(--bo-border)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}
                                            >
                                                IM
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
                                                    Iule Miranda
                                                </p>
                                                <p className="text-xs truncate" style={{ color: 'var(--bo-text-muted)' }}>
                                                    Admin
                                                </p>
                                            </div>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={async () => {
                                                    setOpen(false)
                                                    const supabase = createClient()
                                                    await supabase.auth.signOut()
                                                    router.push('/login')
                                                }}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ background: 'var(--s-cancel-bg)' }}
                                            >
                                                <LogOut size={16} style={{ color: 'var(--s-cancel)' }} />
                                            </motion.button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
