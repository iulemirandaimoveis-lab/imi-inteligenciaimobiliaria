'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
    LayoutDashboard, Building2, Users, X,
    FileText, Briefcase, BookOpen, Settings,
    MessageSquare, Banknote, FolderOpen,
    Scale, CreditCard, FileStack, Layers, Target, Zap, FileSignature, LogOut,
    Megaphone, BarChart2, Plug, TrendingUp, TrendingDown, CalendarDays,
    QrCode, Sparkles, Building, Sun,
    Plus, UserPlus, CalendarPlus, ClipboardList,
    ChevronRight, Inbox, Check, Pencil,
} from 'lucide-react'

// ── Shortcut pool — user picks 4 ────────────────────────────────────
const ALL_SHORTCUTS = [
    { name: 'Hoje',       href: '/backoffice/hoje',           icon: Sun,             color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    { name: 'Leads',      href: '/backoffice/leads',          icon: Users,           color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    { name: 'Agenda',     href: '/backoffice/agenda',         icon: CalendarDays,    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
    { name: 'Dashboard',  href: '/backoffice/dashboard',      icon: LayoutDashboard, color: '#6B9EC4', bg: 'rgba(107,158,196,0.14)' },
    { name: 'Imóveis',    href: '/backoffice/imoveis',        icon: Building2,       color: '#D4A929', bg: 'rgba(212,169,41,0.13)'  },
    { name: 'Financeiro', href: '/backoffice/financeiro',     icon: Banknote,        color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    { name: 'Avaliações', href: '/backoffice/avaliacoes',     icon: Scale,           color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    { name: 'Campanhas',  href: '/backoffice/campanhas',      icon: Megaphone,       color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    { name: 'Contratos',  href: '/backoffice/contratos',      icon: FileSignature,   color: '#4ECDC4', bg: 'rgba(78,205,196,0.12)'  },
    { name: 'WhatsApp',   href: '/backoffice/whatsapp',       icon: MessageSquare,   color: '#4ADE80', bg: 'rgba(74,222,128,0.11)'  },
    { name: 'Automações', href: '/backoffice/automacoes',     icon: Zap,             color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    { name: 'Config.',    href: '/backoffice/settings',       icon: Settings,        color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
]

const DEFAULT_HREFS = [
    '/backoffice/hoje',
    '/backoffice/leads',
    '/backoffice/agenda',
    '/backoffice/dashboard',
]

const LS_KEY = 'imi-nav-shortcuts'

// Quick-create actions
const QUICK_CREATE = [
    { label: 'Novo Lead',      desc: 'Adicionar ao pipeline',    href: '/backoffice/leads/novo',      icon: UserPlus,     color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    { label: 'Novo Evento',    desc: 'Agendar compromisso',      href: '/backoffice/agenda',          icon: CalendarPlus, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
    { label: 'Novo Imóvel',    desc: 'Cadastrar empreendimento', href: '/backoffice/imoveis/novo',    icon: Building2,    color: '#486581', bg: 'rgba(72,101,129,0.15)'  },
    { label: 'Nova Avaliação', desc: 'Iniciar laudo técnico',    href: '/backoffice/avaliacoes/nova', icon: ClipboardList,color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
]

// Full nav groups
const GROUPS = [
    {
        label: 'Visão Executiva', color: '#6B9EC4', bg: 'rgba(107,158,196,0.12)',
        items: [
            { name: 'Dashboard',           href: '/backoffice/dashboard',        icon: LayoutDashboard },
            { name: 'Metas & Performance', href: '/backoffice/financeiro/metas', icon: Target },
            { name: 'Relatórios',          href: '/backoffice/relatorios',        icon: FileStack },
        ],
    },
    {
        label: 'Captação', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)',
        items: [
            { name: 'Leads',        href: '/backoffice/leads',        icon: Users },
            { name: 'Inbox IA',     href: '/backoffice/leads/inbox',  icon: Inbox },
            { name: 'Campanhas',    href: '/backoffice/campanhas',    icon: Megaphone },
            { name: 'QR Tracking',  href: '/backoffice/tracking/qr',  icon: QrCode },
            { name: 'Omni Channel', href: '/backoffice/omnichannel',  icon: Layers },
            { name: 'WhatsApp',     href: '/backoffice/whatsapp',     icon: MessageSquare },
        ],
    },
    {
        label: 'Conversão', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)',
        items: [
            { name: 'Pipeline',   href: '/backoffice/leads/pipeline',    icon: TrendingUp },
            { name: 'Simulações', href: '/backoffice/credito/simulador', icon: CreditCard },
            { name: 'Agenda',     href: '/backoffice/agenda',            icon: CalendarDays },
        ],
    },
    {
        label: 'Portfólio', color: '#D4A929', bg: 'rgba(212,169,41,0.12)',
        items: [
            { name: 'Imóveis',      href: '/backoffice/imoveis',     icon: Building2 },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building },
            { name: 'Projetos',     href: '/backoffice/projetos',     icon: FolderOpen },
            { name: 'Publicações',  href: '/backoffice/conteudos',    icon: FileText },
        ],
    },
    {
        label: 'Operação', color: '#4ECDC4', bg: 'rgba(78,205,196,0.12)',
        items: [
            { name: 'Avaliações',  href: '/backoffice/avaliacoes',   icon: Scale },
            { name: 'Contratos',   href: '/backoffice/contratos',    icon: FileSignature },
            { name: 'Consultoria', href: '/backoffice/consultorias', icon: Briefcase },
            { name: 'Crédito',     href: '/backoffice/credito',      icon: CreditCard },
        ],
    },
    {
        label: 'Financeiro', color: '#84CC16', bg: 'rgba(132,204,22,0.10)',
        items: [
            { name: 'Visão Geral', href: '/backoffice/financeiro',         icon: Banknote },
            { name: 'A Receber',   href: '/backoffice/financeiro/receber', icon: TrendingUp },
            { name: 'A Pagar',     href: '/backoffice/financeiro/pagar',   icon: TrendingDown },
        ],
    },
    {
        label: 'Crescimento', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
        items: [
            { name: 'Automações', href: '/backoffice/automacoes',       icon: Zap },
            { name: 'Playbooks',  href: '/backoffice/playbooks',        icon: BookOpen },
            { name: 'Analytics',  href: '/backoffice/tracking',         icon: BarChart2 },
            { name: 'IA Criador', href: '/backoffice/conteudo/criador', icon: Sparkles },
        ],
    },
    {
        label: 'Configurações', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)',
        items: [
            { name: 'Equipe',        href: '/backoffice/equipe',      icon: Users },
            { name: 'Integrações',   href: '/backoffice/integracoes', icon: Plug },
            { name: 'Configurações', href: '/backoffice/settings',    icon: Settings },
        ],
    },
]

// ── User strip (loads from Supabase auth) ──────────────────────────
function UserStrip({ onClose, router }: { onClose: () => void; router: ReturnType<typeof useRouter> }) {
    const [userInfo, setUserInfo] = useState({ name: '—', email: '—', initials: '—' })

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'
                const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                setUserInfo({ name, email: user.email || '', initials })
            }
        })
    }, [])

    return (
        <div
            className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--bo-border)' }}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--bo-accent-dim), var(--bo-accent))' }}
            >
                {userInfo.initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--bo-text)' }}>{userInfo.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--bo-text-muted)' }}>{userInfo.email}</p>
            </div>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                    onClose()
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/login')
                }}
                className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold flex-shrink-0"
                style={{ background: 'var(--s-cancel-bg)', color: 'var(--s-cancel)' }}
            >
                <LogOut size={12} />
                Sair
            </motion.button>
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────
export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [customizing, setCustomizing] = useState(false)
    const dragControls = useDragControls()

    // Persisted shortcuts
    const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(DEFAULT_HREFS)
    const [tempPinned, setTempPinned] = useState<string[]>(DEFAULT_HREFS)

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY)
            if (saved) {
                const parsed = JSON.parse(saved) as string[]
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPinnedHrefs(parsed.slice(0, 4))
                }
            }
        } catch {}
    }, [])

    // Lock scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on navigation
    useEffect(() => {
        setOpen(false)
        setCustomizing(false)
    }, [pathname])

    const shortcuts = pinnedHrefs
        .map(href => ALL_SHORTCUTS.find(s => s.href === href))
        .filter(Boolean) as typeof ALL_SHORTCUTS

    const leftShortcuts  = shortcuts.slice(0, 2)
    const rightShortcuts = shortcuts.slice(2, 4)

    const togglePin = (href: string) => {
        setTempPinned(prev => {
            if (prev.includes(href)) return prev.filter(h => h !== href)
            if (prev.length >= 4) return prev
            return [...prev, href]
        })
    }

    const handleSaveCustomize = () => {
        setPinnedHrefs(tempPinned)
        try { localStorage.setItem(LS_KEY, JSON.stringify(tempPinned)) } catch {}
        setCustomizing(false)
    }

    const enterCustomize = () => {
        setTempPinned([...pinnedHrefs])
        setCustomizing(true)
    }

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div
                    className="mx-2 mb-2 rounded-2xl"
                    style={{
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid var(--bo-border)',
                        boxShadow: 'var(--bo-shadow)',
                    }}
                >
                    <div className="flex items-center justify-between px-1 py-0.5">

                        {/* Left 2 shortcuts */}
                        {leftShortcuts.map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="relative flex flex-col items-center justify-center py-2 w-full"
                                    >
                                        <AnimatePresence>
                                            {active && (
                                                <motion.div
                                                    layoutId={`nav-pill-${item.href.replace(/\//g, '-')}`}
                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                    className="absolute inset-0 mx-1 rounded-xl"
                                                    style={{ background: item.bg }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <item.icon
                                            size={18}
                                            className="relative transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="relative text-[10px] font-semibold mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}

                        {/* Center FAB — mega menu */}
                        <div className="flex-shrink-0 flex items-center justify-center px-3">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setOpen(v => !v)}
                                className="flex items-center justify-center rounded-2xl"
                                style={{
                                    width: 52,
                                    height: 52,
                                    marginTop: '-18px',
                                    background: open
                                        ? 'linear-gradient(135deg, var(--bo-accent), var(--bo-accent-dim))'
                                        : 'linear-gradient(135deg, var(--bo-accent-dim), var(--bo-accent))',
                                    boxShadow: open
                                        ? '0 4px 24px rgba(72,101,129,0.5)'
                                        : '0 4px 20px rgba(0,0,0,0.35)',
                                }}
                            >
                                <motion.div
                                    animate={{ rotate: open ? 45 : 0 }}
                                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                >
                                    <Plus size={22} color="white" strokeWidth={2.5} />
                                </motion.div>
                            </motion.button>
                        </div>

                        {/* Right 2 shortcuts */}
                        {rightShortcuts.map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="relative flex flex-col items-center justify-center py-2 w-full"
                                    >
                                        <AnimatePresence>
                                            {active && (
                                                <motion.div
                                                    layoutId={`nav-pill-${item.href.replace(/\//g, '-')}`}
                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                    className="absolute inset-0 mx-1 rounded-xl"
                                                    style={{ background: item.bg }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <item.icon
                                            size={18}
                                            className="relative transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="relative text-[10px] font-semibold mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── Mega Menu Drawer ───────────────────────────────── */}
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
                            style={{
                                background: 'rgba(7,9,13,0.8)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                            }}
                            onClick={() => { setOpen(false); setCustomizing(false) }}
                        />

                        {/* Sheet */}
                        <motion.div
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.35 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 400) {
                                    setOpen(false)
                                    setCustomizing(false)
                                }
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-3xl flex flex-col"
                            style={{
                                background: 'var(--bo-drawer-bg)',
                                border: '1px solid var(--bo-border)',
                                borderBottom: 'none',
                                boxShadow: '0 -8px 64px rgba(0,0,0,0.4)',
                                maxHeight: 'min(94dvh, 94vh)',
                                height: 'min(94dvh, 94vh)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Drag Handle */}
                            <div
                                className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => dragControls.start(e)}
                            >
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bo-border)' }} />
                            </div>

                            {customizing ? (
                                /* ── Personalizar Atalhos ── */
                                <>
                                    <div
                                        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                                        style={{ borderBottom: '1px solid var(--bo-border)' }}
                                    >
                                        <div>
                                            <span className="text-sm font-bold" style={{ color: 'var(--bo-text)' }}>
                                                Personalizar Atalhos
                                            </span>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--bo-text-muted)' }}>
                                                Selecione até 4 módulos ({tempPinned.length}/4 selecionados)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCustomizing(false)}
                                                className="h-9 px-3 rounded-xl text-sm font-medium"
                                                style={{ background: 'var(--bo-icon-bg)', color: 'var(--bo-text-muted)' }}
                                            >
                                                Voltar
                                            </button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSaveCustomize}
                                                disabled={tempPinned.length === 0}
                                                className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold disabled:opacity-50"
                                                style={{ background: 'var(--bo-accent)', color: 'white' }}
                                            >
                                                <Check size={14} />
                                                Salvar
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div
                                        className="overflow-y-auto flex-1 p-4"
                                        style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}
                                    >
                                        <p className="text-xs mb-4 px-1" style={{ color: 'var(--bo-text-muted)' }}>
                                            Os 4 módulos selecionados ficam fixados na barra inferior para acesso rápido.
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {ALL_SHORTCUTS.map(item => {
                                                const pinned   = tempPinned.includes(item.href)
                                                const disabled = !pinned && tempPinned.length >= 4
                                                return (
                                                    <motion.button
                                                        key={item.href}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => !disabled && togglePin(item.href)}
                                                        className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all relative"
                                                        style={{
                                                            background: pinned ? item.bg : 'var(--bo-icon-bg)',
                                                            border: `1.5px solid ${pinned ? item.color + '80' : 'transparent'}`,
                                                            opacity: disabled ? 0.35 : 1,
                                                        }}
                                                    >
                                                        <item.icon
                                                            size={22}
                                                            style={{ color: pinned ? item.color : 'var(--bo-text-muted)' }}
                                                        />
                                                        <span
                                                            className="text-[11px] font-semibold text-center leading-tight px-1"
                                                            style={{ color: pinned ? item.color : 'var(--bo-text-muted)' }}
                                                        >
                                                            {item.name}
                                                        </span>
                                                        {pinned && (
                                                            <div
                                                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                                style={{ background: item.color }}
                                                            >
                                                                <Check size={10} color="white" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* ── Main Menu View ── */
                                <>
                                    {/* Header */}
                                    <div
                                        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
                                        style={{ borderBottom: '1px solid var(--bo-border)' }}
                                    >
                                        <span className="text-base font-bold tracking-tight" style={{ color: 'var(--bo-text)' }}>
                                            Menu
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setOpen(false)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--bo-icon-bg)' }}
                                        >
                                            <X size={16} style={{ color: 'var(--bo-text-muted)' }} />
                                        </motion.button>
                                    </div>

                                    {/* User profile */}
                                    <UserStrip onClose={() => setOpen(false)} router={router} />

                                    {/* Scrollable content */}
                                    <div
                                        className="overflow-y-auto flex-1"
                                        style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}
                                    >
                                        {/* ── Criar Novo ── */}
                                        <div className="pt-4 pb-2">
                                            <SectionLabel color="#E8A87C" label="Criar Novo" />
                                            <div className="px-3 mt-1">
                                                {QUICK_CREATE.map((item, i) => (
                                                    <motion.div
                                                        key={item.href}
                                                        initial={{ opacity: 0, x: -6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.035 }}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => setOpen(false)}
                                                            className="hover-card flex items-center gap-3 px-3 py-3 mb-1 rounded-2xl transition-all"
                                                        >
                                                            <div
                                                                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                                style={{ background: item.bg }}
                                                            >
                                                                <item.icon size={18} style={{ color: item.color }} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold" style={{ color: 'var(--bo-text)' }}>
                                                                    {item.label}
                                                                </p>
                                                                <p className="text-xs mt-0.5" style={{ color: 'var(--bo-text-muted)' }}>
                                                                    {item.desc}
                                                                </p>
                                                            </div>
                                                            <ChevronRight size={14} style={{ color: 'var(--bo-border)', flexShrink: 0 }} />
                                                        </Link>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Atalhos rápidos ── */}
                                        <div className="pb-2">
                                            <div className="flex items-center justify-between px-5 pb-2.5 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: '#6B9EC4' }} />
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--bo-text-muted)' }}>
                                                        Meus Atalhos
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={enterCustomize}
                                                    className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-semibold"
                                                    style={{ background: 'var(--bo-icon-bg)', color: 'var(--bo-accent)' }}
                                                >
                                                    <Pencil size={11} />
                                                    Personalizar
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 px-4">
                                                {shortcuts.map(item => {
                                                    const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setOpen(false)}
                                                            className="hover-card flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                                                            style={{
                                                                background: active ? item.bg : 'var(--bo-icon-bg)',
                                                                border: `1px solid ${active ? item.color + '60' : 'transparent'}`,
                                                            }}
                                                        >
                                                            <item.icon
                                                                size={20}
                                                                style={{ color: item.color, opacity: active ? 1 : 0.75 }}
                                                            />
                                                            <span
                                                                className="text-[9px] font-bold text-center leading-tight px-0.5"
                                                                style={{ color: active ? item.color : 'var(--bo-text-muted)' }}
                                                            >
                                                                {item.name}
                                                            </span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* ── Full navigation ── */}
                                        {GROUPS.map((group, gi) => (
                                            <div key={group.label} className="pt-3">
                                                <SectionLabel color={group.color} label={group.label} />
                                                {group.items.map((item, i) => {
                                                    const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                                    return (
                                                        <motion.div
                                                            key={item.href}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: (gi * 5 + i) * 0.012 }}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => setOpen(false)}
                                                                className="hover-card flex items-center gap-3 px-4 py-2.5 mx-2 mb-0.5 rounded-xl transition-all"
                                                                style={{ background: active ? group.bg : 'transparent' }}
                                                            >
                                                                <div
                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                                    style={{ background: group.bg }}
                                                                >
                                                                    <item.icon size={15} style={{ color: group.color }} />
                                                                </div>
                                                                <span
                                                                    className="text-sm font-medium flex-1"
                                                                    style={{ color: active ? 'var(--bo-text)' : 'var(--bo-text-muted)' }}
                                                                >
                                                                    {item.name}
                                                                </span>
                                                                <ChevronRight
                                                                    size={13}
                                                                    style={{ color: active ? group.color : 'var(--bo-border)', flexShrink: 0 }}
                                                                />
                                                            </Link>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                        <div className="h-6" />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// ── Section label helper ───────────────────────────────────────────
function SectionLabel({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2.5 px-5 pb-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] flex-shrink-0" style={{ color: 'var(--bo-text-muted)' }}>
                {label}
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--bo-border)' }} />
        </div>
    )
}
