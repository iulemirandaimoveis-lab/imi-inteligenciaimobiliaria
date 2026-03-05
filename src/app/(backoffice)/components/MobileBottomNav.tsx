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
    QrCode, Sparkles, Building, Search, Sun,
    Plus, UserPlus, CalendarPlus, ClipboardList,
} from 'lucide-react'

// ── Task-based navigation ───────────────────────────────────────────
// 3 main tabs + FAB in center + Mais button (5 visual positions)
const MAIN = [
    { name: 'Hoje', href: '/backoffice/hoje', icon: Sun },
    { name: 'Leads', href: '/backoffice/leads', icon: Users },
    { name: 'Agenda', href: '/backoffice/agenda', icon: CalendarDays },
]

// Quick-create actions (FAB sheet)
const QUICK_CREATE = [
    {
        label: 'Novo Lead',
        desc: 'Adicionar ao pipeline',
        href: '/backoffice/leads/novo',
        icon: UserPlus,
        color: '#E8A87C',
        bg: 'rgba(232,168,124,0.12)',
    },
    {
        label: 'Novo Evento',
        desc: 'Agendar compromisso',
        href: '/backoffice/agenda',
        icon: CalendarPlus,
        color: '#8B5CF6',
        bg: 'rgba(139,92,246,0.12)',
    },
    {
        label: 'Novo Imóvel',
        desc: 'Cadastrar empreendimento',
        href: '/backoffice/imoveis/novo',
        icon: Building2,
        color: 'var(--bo-accent)',
        bg: 'rgba(51,78,104,0.12)',
    },
    {
        label: 'Nova Avaliação',
        desc: 'Iniciar laudo técnico',
        href: '/backoffice/avaliacoes/nova',
        icon: ClipboardList,
        color: '#6BB87B',
        bg: 'rgba(107,184,123,0.12)',
    },
]

// Quick-access grid (drawer top)
const QUICK_ACCESS = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote },
    { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: Scale },
    { name: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
    { name: 'Contratos', href: '/backoffice/contratos', icon: FileSignature },
    { name: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
    { name: 'Config.', href: '/backoffice/settings', icon: Settings },
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
    const [quickCreateOpen, setQuickCreateOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dragControls = useDragControls()
    const quickDragControls = useDragControls()

    // Lock body scroll while any sheet is open
    useEffect(() => {
        document.body.style.overflow = (open || quickCreateOpen) ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open, quickCreateOpen])

    // Close on navigation
    useEffect(() => {
        setOpen(false)
        setQuickCreateOpen(false)
    }, [pathname])

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
                    className="mx-2 mb-2 rounded-xl overflow-visible"
                    style={{
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: 'var(--bo-shadow)',
                    }}
                >
                    <div className="flex items-center justify-between px-2">
                        {/* First 2 main tabs */}
                        {MAIN.slice(0, 2).map(item => {
                            const active = !open && !quickCreateOpen && (pathname === item.href || pathname?.startsWith(item.href + '/'))
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
                                            className="relative text-[11px] font-medium mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}

                        {/* Center FAB */}
                        <div className="flex-shrink-0 flex items-center justify-center px-2">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => {
                                    setOpen(false)
                                    setQuickCreateOpen(v => !v)
                                }}
                                className="flex items-center justify-center rounded-2xl"
                                style={{
                                    width: 52,
                                    height: 52,
                                    marginTop: '-20px',
                                    background: quickCreateOpen
                                        ? 'linear-gradient(135deg, var(--bo-accent), var(--bo-accent-dim))'
                                        : 'linear-gradient(135deg, var(--bo-accent-dim), var(--bo-accent))',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                                }}
                            >
                                <motion.div
                                    animate={{ rotate: quickCreateOpen ? 45 : 0 }}
                                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                >
                                    <Plus size={22} color="white" />
                                </motion.div>
                            </motion.button>
                        </div>

                        {/* Last 1 main tab (Agenda) */}
                        {MAIN.slice(2).map(item => {
                            const active = !open && !quickCreateOpen && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="relative flex flex-col items-center justify-center py-2.5 w-full"
                                    >
                                        <AnimatePresence>
                                            {active && (
                                                <motion.div
                                                    layoutId="nav-active-pill-right"
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
                                            className="relative text-[11px] font-medium mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}

                        {/* Mais button */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => {
                                setQuickCreateOpen(false)
                                setOpen(!open)
                            }}
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
                                className="relative text-[11px] font-semibold mt-1 transition-colors"
                                style={{ color: open ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                            >
                                Mais
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Quick-Create Action Sheet ────────────────────────── */}
            <AnimatePresence>
                {quickCreateOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 z-40"
                            style={{ background: 'rgba(7,9,13,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                            onClick={() => setQuickCreateOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            drag="y"
                            dragControls={quickDragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.3 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80 || info.velocity.y > 400) {
                                    setQuickCreateOpen(false)
                                }
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-3xl"
                            style={{
                                background: 'var(--bo-drawer-bg)',
                                border: '1px solid var(--bo-border)',
                                borderBottom: 'none',
                                boxShadow: 'var(--bo-shadow-elevated)',
                                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
                            }}
                        >
                            {/* Drag handle */}
                            <div
                                className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => quickDragControls.start(e)}
                            >
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bo-border)' }} />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                <span className="text-sm font-bold" style={{ color: 'var(--bo-text)' }}>
                                    O que deseja criar?
                                </span>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setQuickCreateOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--bo-icon-bg)' }}
                                >
                                    <X size={14} style={{ color: 'var(--bo-text-muted)' }} />
                                </motion.button>
                            </div>

                            {/* Actions */}
                            <div className="py-1">
                                {QUICK_CREATE.map((item, i) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={() => setQuickCreateOpen(false)}
                                            className="hover-card flex items-center gap-4 px-5 py-4 mx-2 my-0.5 rounded-2xl transition-all"
                                        >
                                            <div
                                                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: item.bg }}
                                            >
                                                <item.icon size={20} style={{ color: item.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>
                                                    {item.label}
                                                </p>
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--bo-text-muted)' }}>
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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

                        {/* Sheet */}
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
                            {/* ── Drag Handle ── */}
                            <div
                                className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => dragControls.start(e)}
                            >
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bo-border)' }} />
                            </div>

                            {/* ── Header — minimal, no IMI brand ── */}
                            <div
                                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid var(--bo-border)' }}
                            >
                                <span className="text-sm font-bold" style={{ color: 'var(--bo-text)' }}>Menu</span>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setOpen(false)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'var(--bo-icon-bg)' }}
                                >
                                    <X size={16} style={{ color: 'var(--bo-text-muted)' }} />
                                </motion.button>
                            </div>

                            {/* ── User Profile strip (always visible) ── */}
                            <div
                                className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: '1px solid var(--bo-border)' }}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, var(--bo-accent-dim), var(--bo-accent))' }}
                                >
                                    IM
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--bo-text)' }}>
                                        Iule Miranda
                                    </p>
                                    <p className="text-[11px] font-medium truncate" style={{ color: 'var(--bo-accent)' }}>
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
                                    className="flex items-center gap-2 px-3 h-9 rounded-xl text-sm font-semibold flex-shrink-0"
                                    style={{ background: 'var(--s-cancel-bg)', color: 'var(--s-cancel)' }}
                                >
                                    <LogOut size={14} />
                                    Sair
                                </motion.button>
                            </div>

                            {/* ── Quick Access Grid ── */}
                            <div className="px-4 pt-4 pb-2 flex-shrink-0">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {QUICK_ACCESS.map(item => {
                                        const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className="hover-card flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                                                style={{
                                                    background: active ? 'var(--bo-active-bg)' : 'var(--bo-icon-bg)',
                                                }}
                                            >
                                                <item.icon
                                                    size={18}
                                                    style={{ color: active ? 'var(--nav-active)' : 'var(--bo-text-muted)' }}
                                                />
                                                <span
                                                    className="text-[10px] font-medium text-center leading-tight"
                                                    style={{ color: active ? 'var(--nav-active)' : 'var(--bo-text-muted)' }}
                                                >
                                                    {item.name}
                                                </span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Thin divider */}
                            <div className="mx-4 flex-shrink-0" style={{ height: 1, background: 'var(--bo-border)' }} />

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
                                                        className="hover-card flex items-center gap-4 px-5 py-3 mx-2 rounded-xl transition-all"
                                                        style={{
                                                            background: active ? 'var(--bo-active-bg)' : 'transparent',
                                                            color: active ? 'var(--nav-active)' : 'var(--bo-text-muted)',
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                            style={{
                                                                background: active ? 'var(--bo-hover)' : 'var(--bo-icon-bg)',
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

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
