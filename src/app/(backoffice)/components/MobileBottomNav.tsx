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
    QrCode, Sparkles, Building, Sun, Brain, LineChart, Wand2, BarChart3, Shield,
    Plus, UserPlus, CalendarPlus, ClipboardList,
    Check, Pencil, BookMarked, Inbox,
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

// Quick-create actions (shown in mega-menu)
const QUICK_CREATE = [
    { label: 'Novo Lead',      desc: 'Adicionar ao pipeline',    href: '/backoffice/leads/novo',      icon: UserPlus,     color: '#E8A87C', bg: 'rgba(232,168,124,0.13)' },
    { label: 'Novo Evento',    desc: 'Agendar compromisso',      href: '/backoffice/agenda',          icon: CalendarPlus, color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)'  },
    { label: 'Novo Imóvel',    desc: 'Cadastrar empreendimento', href: '/backoffice/imoveis/novo',    icon: Building2,    color: '#486581', bg: 'rgba(72,101,129,0.16)'  },
    { label: 'Nova Avaliação', desc: 'Iniciar laudo técnico',    href: '/backoffice/avaliacoes/nova', icon: ClipboardList,color: '#6BB87B', bg: 'rgba(107,184,123,0.13)' },
]

// Context-sensitive FAB map — route prefix → primary action
const CONTEXT_FAB: { prefix: string; href: string; label: string; Icon: React.ElementType }[] = [
    { prefix: '/backoffice/leads',        href: '/backoffice/leads/novo',      label: 'Novo Lead',      Icon: UserPlus     },
    { prefix: '/backoffice/avaliacoes',   href: '/backoffice/avaliacoes/nova', label: 'Nova Avaliação', Icon: ClipboardList },
    { prefix: '/backoffice/imoveis',      href: '/backoffice/imoveis/novo',    label: 'Novo Imóvel',    Icon: Building2    },
    { prefix: '/backoffice/campanhas',    href: '/backoffice/campanhas/nova',  label: 'Nova Campanha',  Icon: Megaphone    },
    { prefix: '/backoffice/contratos',    href: '/backoffice/contratos/novo',  label: 'Novo Contrato',  Icon: FileSignature },
]

// Full nav groups — horizontal Netflix-style rows
const GROUPS = [
    {
        label: 'Visão Executiva', color: '#6B9EC4', bg: 'rgba(107,158,196,0.12)',
        items: [
            { name: 'Dashboard',           href: '/backoffice/dashboard',              icon: LayoutDashboard },
            { name: 'Metas',               href: '/backoffice/financeiro/metas',       icon: Target },
            { name: 'Relatórios',          href: '/backoffice/relatorios',             icon: FileStack },
            { name: 'Global Intel',        href: '/backoffice/relatorios/executivo',   icon: Brain },
        ],
    },
    {
        label: 'Captação', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)',
        items: [
            { name: 'Leads',           href: '/backoffice/leads',            icon: Users },
            { name: 'Inbox IA',        href: '/backoffice/leads/inbox',      icon: Inbox },
            { name: 'Comportamento',   href: '/backoffice/leads/behavior',   icon: BarChart3 },
            { name: 'Campanhas',       href: '/backoffice/campanhas',        icon: Megaphone },
            { name: 'Ads',             href: '/backoffice/campanhas/ads',    icon: BarChart2 },
            { name: 'QR Tracking',     href: '/backoffice/tracking/qr',      icon: QrCode },
            { name: 'Omni Channel',    href: '/backoffice/omnichannel',      icon: Layers },
            { name: 'WhatsApp',        href: '/backoffice/whatsapp',         icon: MessageSquare },
        ],
    },
    {
        label: 'Conversão', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)',
        items: [
            { name: 'Pipeline',    href: '/backoffice/leads/pipeline',    icon: TrendingUp },
            { name: 'Simulações',  href: '/backoffice/credito/simulador', icon: CreditCard },
            { name: 'Agenda',      href: '/backoffice/agenda',            icon: CalendarDays },
        ],
    },
    {
        label: 'Portfólio', color: '#D4A929', bg: 'rgba(212,169,41,0.12)',
        items: [
            { name: 'Imóveis',      href: '/backoffice/imoveis',            icon: Building2  },
            { name: 'Construtoras', href: '/backoffice/construtoras',       icon: Building   },
            { name: 'Projetos',     href: '/backoffice/projetos',           icon: FolderOpen },
            { name: 'Publicações',  href: '/backoffice/conteudos',          icon: FileText   },
            { name: 'Criador IA',   href: '/backoffice/conteudo/criador',   icon: Wand2      },
            { name: 'eBook IA',     href: '/backoffice/conteudo/ebook',     icon: BookMarked },
            { name: 'Automação',    href: '/backoffice/conteudo/automacao', icon: Zap        },
        ],
    },
    {
        label: 'Inteligência', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',
        items: [
            { name: 'eBooks',      href: '/backoffice/inteligencia/ebooks',       icon: BookOpen  },
            { name: 'Relatórios',  href: '/backoffice/inteligencia/relatorios',   icon: FileStack },
            { name: 'Indicadores', href: '/backoffice/inteligencia/indicadores',  icon: LineChart },
            { name: 'Índices IMI', href: '/backoffice/inteligencia/indices',      icon: Brain     },
        ],
    },
    {
        label: 'Operação', color: '#4ECDC4', bg: 'rgba(78,205,196,0.12)',
        items: [
            { name: 'Avaliações',     href: '/backoffice/avaliacoes',                  icon: Scale         },
            { name: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova',             icon: Scale         },
            { name: 'Email + Hon.',   href: '/backoffice/avaliacoes/email-honorarios', icon: Scale         },
            { name: 'NBR',            href: '/backoffice/avaliacoes/exercicios',       icon: BookOpen      },
            { name: 'Contratos',      href: '/backoffice/contratos',                   icon: FileSignature },
            { name: 'Novo Contrato',  href: '/backoffice/contratos/novo',              icon: FileSignature },
            { name: 'Consultoria',    href: '/backoffice/consultorias',                icon: Briefcase     },
            { name: 'Nova Consult.',  href: '/backoffice/consultorias/nova',           icon: Briefcase     },
            { name: 'Crédito',        href: '/backoffice/credito',                     icon: CreditCard    },
        ],
    },
    {
        label: 'Financeiro', color: '#84CC16', bg: 'rgba(132,204,22,0.10)',
        items: [
            { name: 'Visão Geral', href: '/backoffice/financeiro',         icon: Banknote    },
            { name: 'A Receber',   href: '/backoffice/financeiro/receber', icon: TrendingUp  },
            { name: 'A Pagar',     href: '/backoffice/financeiro/pagar',   icon: TrendingDown },
            { name: 'Metas',       href: '/backoffice/financeiro/metas',   icon: Target      },
        ],
    },
    {
        label: 'Crescimento', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
        items: [
            { name: 'Automações',    href: '/backoffice/automacoes',    icon: Zap        },
            { name: 'Playbooks',     href: '/backoffice/playbooks',     icon: BookOpen   },
            { name: 'Analytics',     href: '/backoffice/tracking',      icon: BarChart2  },
            { name: 'Central IA',    href: '/backoffice/ia',            icon: Sparkles   },
            { name: 'IA Avaliações', href: '/backoffice/avaliacoes/ia', icon: Sparkles   },
        ],
    },
    {
        label: 'Configurações', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)',
        items: [
            { name: 'Organização',  href: '/backoffice/organizacao',         icon: Building  },
            { name: 'Equipe',       href: '/backoffice/equipe',              icon: Users     },
            { name: 'Integrações',  href: '/backoffice/integracoes',         icon: Plug      },
            { name: 'Settings',     href: '/backoffice/settings',            icon: Settings  },
            { name: 'Corretores',   href: '/backoffice/settings/corretores', icon: Users     },
            { name: 'Permissões',   href: '/backoffice/settings/permissoes', icon: Shield    },
            { name: 'Config. IA',   href: '/backoffice/settings/ia',         icon: Brain     },
        ],
    },
]

// ── Netflix tile card ──────────────────────────────────────────────
function NetflixItemCard({
    name, icon: Icon, color, bg, active,
}: { name: string; icon: React.ElementType; color: string; bg: string; active: boolean }) {
    return (
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[62px]">
            <div
                className="w-[48px] h-[48px] rounded-2xl flex items-center justify-center"
                style={{
                    background: active ? bg : 'var(--bo-icon-bg)',
                    boxShadow: active ? `0 0 0 1.5px ${color}80` : 'none',
                    transition: 'background 0.15s, box-shadow 0.15s',
                }}
            >
                <Icon size={19} style={{ color: active ? color : 'var(--bo-text-muted)' }} />
            </div>
            <span
                className="text-[9px] font-semibold text-center leading-tight w-full"
                style={{ color: active ? color : 'var(--bo-text-muted)' }}
            >
                {name}
            </span>
        </div>
    )
}

// ── Netflix row label ──────────────────────────────────────────────
function NetflixRowLabel({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 mb-2">
            <div className="w-[3px] h-[13px] rounded-full flex-shrink-0" style={{ background: color }} />
            <span
                className="text-[10px] font-bold tracking-[0.1em] uppercase"
                style={{ color: 'var(--bo-text-muted)' }}
            >
                {label}
            </span>
        </div>
    )
}

// ── Scrollable horizontal row ──────────────────────────────────────
function NetflixRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="flex gap-3 overflow-x-auto px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
                {children}
            </div>
            {/* Right fade hint */}
            <div
                className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none"
                style={{ background: 'linear-gradient(to left, var(--bo-drawer-bg, #0f1318) 20%, transparent)' }}
            />
        </div>
    )
}

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
            className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--bo-border)' }}
        >
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: 'var(--bo-accent)' }}
            >
                {userInfo.initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--bo-text)' }}>{userInfo.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>{userInfo.email}</p>
            </div>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                    onClose()
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/login')
                }}
                className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-[11px] font-semibold flex-shrink-0"
                style={{ background: 'var(--s-cancel-bg)', color: 'var(--s-cancel)' }}
            >
                <LogOut size={11} />
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

    // Resolve context-sensitive FAB
    const contextFab = pathname
        ? CONTEXT_FAB.find(c => pathname === c.prefix || pathname.startsWith(c.prefix + '/'))
        : null

    // When in a submodule page (depth > 3 segments like /backoffice/imoveis/abc/editar),
    // or already on a creation route (ends with /novo or /nova),
    // the FAB should open the mega-menu instead of navigating directly —
    // so the user can choose from all quick-create options.
    const isDeepSubmodule = pathname
        ? pathname.split('/').filter(Boolean).length > 3
        : false
    const isCreationRoute = pathname
        ? (pathname.endsWith('/novo') || pathname.endsWith('/nova'))
        : false
    const fabShouldOpenMenu = isDeepSubmodule || isCreationRoute

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

                        {/* Center FAB — context-sensitive or mega-menu */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center px-3">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => {
                                    if (contextFab && !open && !fabShouldOpenMenu) {
                                        // Direct navigation only on root section pages
                                        router.push(contextFab.href)
                                    } else {
                                        // In submodules, creation routes, or no context: open mega-menu
                                        setOpen(v => !v)
                                    }
                                }}
                                className="flex items-center justify-center rounded-2xl"
                                style={{
                                    width: 52,
                                    height: 52,
                                    marginTop: '-18px',
                                    background: 'var(--bo-accent)',
                                    boxShadow: open
                                        ? '0 4px 24px rgba(72,101,129,0.5)'
                                        : '0 4px 20px rgba(0,0,0,0.35)',
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {open ? (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: -45, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 45, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <X size={22} color="white" strokeWidth={2.5} />
                                        </motion.div>
                                    ) : contextFab ? (
                                        <motion.div
                                            key={contextFab.prefix}
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <contextFab.Icon size={20} color="white" strokeWidth={2} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="plus"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <Plus size={22} color="white" strokeWidth={2.5} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            {/* Context label under FAB */}
                            {contextFab && !open && (
                                <motion.span
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[9px] font-semibold mt-0.5 text-center leading-tight"
                                    style={{ color: 'var(--bo-accent)', maxWidth: 56 }}
                                >
                                    {contextFab.label}
                                </motion.span>
                            )}
                            {!contextFab && !open && (
                                <span className="text-[9px] font-semibold mt-0.5"
                                    style={{ color: 'var(--nav-inactive)' }}>
                                    Criar
                                </span>
                            )}
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
                                background: 'rgba(7,9,13,0.82)',
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
                                /* ── Netflix-style Main Menu ── */
                                <>
                                    {/* Header */}
                                    <div
                                        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                                        style={{ borderBottom: '1px solid var(--bo-border)' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-5 h-5 rounded-md flex items-center justify-center"
                                                style={{ background: 'var(--bo-accent)' }}
                                            >
                                                <span className="text-[10px] font-black text-white">I</span>
                                            </div>
                                            <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--bo-text)' }}>
                                                IMI Backoffice
                                            </span>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setOpen(false)}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: 'var(--bo-icon-bg)' }}
                                        >
                                            <X size={15} style={{ color: 'var(--bo-text-muted)' }} />
                                        </motion.button>
                                    </div>

                                    {/* User strip */}
                                    <UserStrip onClose={() => setOpen(false)} router={router} />

                                    {/* ── Netflix scrollable rows ── */}
                                    <div
                                        className="overflow-y-auto flex-1"
                                        style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}
                                    >
                                        {/* Quick Create — prominent landscape cards */}
                                        <motion.div
                                            className="pt-4"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05, duration: 0.28 }}
                                        >
                                            <NetflixRowLabel color="#E8A87C" label="Criar Novo" />
                                            <NetflixRow>
                                                {QUICK_CREATE.map((item, i) => (
                                                    <motion.div
                                                        key={item.href}
                                                        initial={{ opacity: 0, scale: 0.88 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 380, damping: 26 }}
                                                    >
                                                        <Link href={item.href} onClick={() => setOpen(false)}>
                                                            <motion.div
                                                                whileTap={{ scale: 0.94 }}
                                                                className="flex-shrink-0 w-[120px] rounded-2xl p-3 flex flex-col gap-2"
                                                                style={{
                                                                    background: item.bg,
                                                                    border: `1px solid ${item.color}28`,
                                                                }}
                                                            >
                                                                <div
                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                                    style={{ background: `${item.color}25` }}
                                                                >
                                                                    <item.icon size={15} style={{ color: item.color }} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-bold leading-tight" style={{ color: 'var(--bo-text)' }}>
                                                                        {item.label}
                                                                    </p>
                                                                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'var(--bo-text-muted)' }}>
                                                                        {item.desc}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        </Link>
                                                    </motion.div>
                                                ))}
                                            </NetflixRow>
                                        </motion.div>

                                        {/* My shortcuts row */}
                                        <motion.div
                                            className="pt-4"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1, duration: 0.28 }}
                                        >
                                            <div className="flex items-center justify-between px-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-[3px] h-[13px] rounded-full flex-shrink-0" style={{ background: '#6B9EC4' }} />
                                                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: 'var(--bo-text-muted)' }}>
                                                        Meus Atalhos
                                                    </span>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={enterCustomize}
                                                    className="flex items-center gap-1 px-2.5 h-6 rounded-lg text-[10px] font-semibold"
                                                    style={{ background: 'var(--bo-icon-bg)', color: 'var(--bo-accent)' }}
                                                >
                                                    <Pencil size={9} />
                                                    Editar
                                                </motion.button>
                                            </div>
                                            <NetflixRow>
                                                {shortcuts.map((item, i) => {
                                                    const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                                    return (
                                                        <motion.div
                                                            key={item.href}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.12 + i * 0.05 }}
                                                        >
                                                            <Link href={item.href} onClick={() => setOpen(false)}>
                                                                <motion.div whileTap={{ scale: 0.9 }}>
                                                                    <NetflixItemCard
                                                                        name={item.name}
                                                                        icon={item.icon}
                                                                        color={item.color}
                                                                        bg={item.bg}
                                                                        active={active}
                                                                    />
                                                                </motion.div>
                                                            </Link>
                                                        </motion.div>
                                                    )
                                                })}
                                            </NetflixRow>
                                        </motion.div>

                                        {/* ── GROUPS as Netflix horizontal rows ── */}
                                        {GROUPS.map((group, gi) => (
                                            <motion.div
                                                key={group.label}
                                                className="pt-4"
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.14 + gi * 0.035, duration: 0.26 }}
                                            >
                                                <NetflixRowLabel color={group.color} label={group.label} />
                                                <NetflixRow>
                                                    {group.items.map(item => {
                                                        const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                                                        return (
                                                            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                                                                <motion.div whileTap={{ scale: 0.88 }}>
                                                                    <NetflixItemCard
                                                                        name={item.name}
                                                                        icon={item.icon}
                                                                        color={group.color}
                                                                        bg={group.bg}
                                                                        active={active}
                                                                    />
                                                                </motion.div>
                                                            </Link>
                                                        )
                                                    })}
                                                </NetflixRow>
                                            </motion.div>
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
