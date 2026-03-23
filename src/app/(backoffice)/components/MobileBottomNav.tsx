'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
    LayoutDashboard, Building2, Users, X, Sun,
    FileText, Briefcase, BookOpen, Settings,
    MessageSquare, Banknote, FolderOpen,
    Scale, CreditCard, FileStack, Layers, Target, Zap, FileSignature,
    Megaphone, BarChart2, Plug, TrendingUp, TrendingDown, CalendarDays,
    QrCode, Sparkles, Building, Brain, LineChart, Wand2, BarChart3, Shield,
    UserPlus, CalendarPlus, ClipboardList,
    BookMarked, Inbox, MoreHorizontal,
    Video, Search, Bot, UserCog, ScrollText, LayoutGrid, Bell, Handshake, MessageCircle,
} from 'lucide-react'

// ── 4 fixed bottom nav items ─────────────────────────────────────────
const BOTTOM_ITEMS = [
    { name: 'Hoje',    href: '/backoffice/hoje',      icon: Sun,          color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))'  },
    { name: 'Imóveis', href: '/backoffice/imoveis',   icon: Building2,    color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))'  },
    { name: 'Leads',   href: '/backoffice/leads',     icon: Users,        color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))' },
    { name: 'Agenda',  href: '/backoffice/agenda',    icon: CalendarDays, color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))'  },
]

// Quick-create actions (shown in mega-menu)
const QUICK_CREATE = [
    { label: 'Novo Imóvel',    subtitle: 'Cadastrar empreendimento', href: '/backoffice/imoveis/novo',    icon: Building2,    color: 'var(--accent-400)', iconBg: 'rgba(200,164,74,0.14)'  },
    { label: 'Novo Lead',      subtitle: 'Adicionar ao pipeline',    href: '/backoffice/leads/novo',      icon: UserPlus,     color: 'var(--info)',              iconBg: 'rgba(96,165,250,0.14)'  },
    { label: 'Nova Avaliação', subtitle: 'Iniciar laudo técnico',    href: '/backoffice/avaliacoes/nova', icon: ClipboardList,color: 'var(--platinum-400)',              iconBg: 'rgba(167,139,250,0.14)' },
    { label: 'Nova Campanha',  subtitle: 'Criar campanha de mídia',  href: '/backoffice/campanhas/nova',  icon: CalendarPlus, color: '#FB923C',              iconBg: 'rgba(251,146,60,0.14)'  },
    { label: 'Nova Proposta',  subtitle: 'Gerar proposta comercial', href: '/backoffice/propostas/nova',  icon: BookMarked,   color: 'var(--success)',              iconBg: 'rgba(52,211,153,0.14)'  },
    { label: 'Novo Contrato',  subtitle: 'Registrar contrato',       href: '/backoffice/contratos/novo',  icon: FileSignature,color: '#F87171',              iconBg: 'rgba(248,113,113,0.14)' },
]

// Badge values: 'NEW' | 'BREVE' | undefined
type NavItemBadge = 'NEW' | 'BREVE'
interface GroupItem { name: string; href: string; icon: React.ElementType; badge?: NavItemBadge }

// Full nav groups — horizontal Netflix-style rows
const GROUPS: Array<{ label: string; color: string; bg: string; items: GroupItem[] }> = [
    {
        label: 'Visão Executiva', color: '#6B9EC4', bg: 'rgba(107,158,196,0.12)',
        items: [
            { name: 'Dashboard',    href: '/backoffice/dashboard',            icon: LayoutDashboard, badge: 'NEW'   },
            { name: 'Metas',        href: '/backoffice/financeiro/metas',     icon: Target },
            { name: 'Relatórios',   href: '/backoffice/relatorios',           icon: FileStack,       badge: 'NEW'   },
            { name: 'Global Intel', href: '/backoffice/relatorios/executivo', icon: Brain },
        ],
    },
    {
        label: 'Captação', color: 'var(--warning)', bg: 'rgba(232,168,124,0.12)',
        items: [
            { name: 'Leads',         href: '/backoffice/leads',            icon: Users,         badge: 'NEW'   },
            { name: 'Inbox IA',      href: '/backoffice/leads/inbox',      icon: Inbox },
            { name: 'Comportamento', href: '/backoffice/leads/behavior',   icon: BarChart3 },
            { name: 'Campanhas',     href: '/backoffice/campanhas',        icon: Megaphone,     badge: 'NEW'   },
            { name: 'Ads',           href: '/backoffice/campanhas/ads',    icon: BarChart2 },
            { name: 'QR Tracking',   href: '/backoffice/tracking/qr',      icon: QrCode,        badge: 'NEW'   },
        ],
    },
    {
        label: 'Conversão', color: 'var(--success)', bg: 'var(--success-bg)',
        items: [
            { name: 'Parcerias', href: '/backoffice/parcerias',        icon: Handshake,   badge: 'NEW' },
            { name: 'Chat Equipe', href: '/backoffice/connect',       icon: MessageSquare, badge: 'NEW' },
            { name: 'Pipeline',  href: '/backoffice/leads/pipeline',   icon: TrendingUp },
            { name: 'Simulações',href: '/backoffice/credito/simulador',icon: CreditCard },
            { name: 'Agenda',    href: '/backoffice/agenda',           icon: CalendarDays },
        ],
    },
    {
        label: 'Portfólio', color: '#D4A929', bg: 'rgba(212,169,41,0.12)',
        items: [
            { name: 'Imóveis',      href: '/backoffice/imoveis',            icon: Building2,  badge: 'NEW'   },
            { name: 'Explorer',     href: '/backoffice/imoveis/explorer',   icon: Search,     badge: 'NEW'   },
            { name: 'Construtoras', href: '/backoffice/construtoras',       icon: Building,   badge: 'NEW'   },
            { name: 'Projetos',     href: '/backoffice/projetos',           icon: FolderOpen, badge: 'NEW'   },
            { name: 'Publicações',  href: '/backoffice/conteudo',           icon: FileText   },
            { name: 'Criador IA',   href: '/backoffice/conteudo/criador',   icon: Wand2      },
            { name: 'eBook IA',     href: '/backoffice/conteudo/ebook',     icon: BookMarked },
            { name: 'Vídeo IA',     href: '/backoffice/conteudo/video',     icon: Video,      badge: 'NEW'   },
            { name: 'Automação',    href: '/backoffice/conteudo/automacao', icon: Zap        },
        ],
    },
    {
        label: 'Inteligência', color: 'var(--info)', bg: 'rgba(96,165,250,0.12)',
        items: [
            { name: 'Biblioteca',  href: '/backoffice/biblioteca',                icon: BookOpen, badge: 'NEW' },
            { name: 'eBooks',      href: '/backoffice/inteligencia/ebooks',       icon: BookOpen  },
            { name: 'Relatórios',  href: '/backoffice/inteligencia/relatorios',   icon: FileStack,   badge: 'NEW' },
            { name: 'Indicadores', href: '/backoffice/inteligencia/indicadores',  icon: LineChart },
            { name: 'Índices IMI', href: '/backoffice/inteligencia/indices',      icon: Brain,       badge: 'NEW' },
            { name: 'Widgets',     href: '/backoffice/inteligencia/widgets',      icon: LayoutGrid,  badge: 'NEW' },
            { name: 'AI Chat',     href: '/backoffice/ai-chat',                  icon: MessageCircle, badge: 'NEW' },
            { name: 'Agentes IA',  href: '/backoffice/ia/agentes',               icon: Bot,         badge: 'NEW' },
        ],
    },
    {
        label: 'Operação', color: '#4ECDC4', bg: 'rgba(78,205,196,0.12)',
        items: [
            { name: 'Avaliações',     href: '/backoffice/avaliacoes',                  icon: Scale,        badge: 'NEW'   },
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
            { name: 'Visão Geral', href: '/backoffice/financeiro',         icon: Banknote,    badge: 'NEW'   },
            { name: 'A Receber',   href: '/backoffice/financeiro/receber', icon: TrendingUp  },
            { name: 'A Pagar',     href: '/backoffice/financeiro/pagar',   icon: TrendingDown },
            { name: 'Metas',       href: '/backoffice/financeiro/metas',   icon: Target      },
        ],
    },
    {
        label: 'Crescimento', color: 'var(--platinum-400)', bg: 'rgba(167,139,250,0.12)',
        items: [
            { name: 'Automações',    href: '/backoffice/automacoes',    icon: Zap        },
            { name: 'Playbooks',     href: '/backoffice/playbooks',     icon: BookOpen,  badge: 'NEW'   },
            { name: 'Analytics',     href: '/backoffice/tracking',      icon: BarChart2, badge: 'NEW'   },
            { name: 'Central IA',    href: '/backoffice/ia',            icon: Sparkles   },
            { name: 'IA Avaliações', href: '/backoffice/avaliacoes/ia', icon: Sparkles   },
        ],
    },
    {
        label: 'Configurações', color: 'var(--text-tertiary)', bg: 'rgba(148,163,184,0.10)',
        items: [
            { name: 'Organização',  href: '/backoffice/organizacao',         icon: Building     },
            { name: 'Equipe',       href: '/backoffice/equipe',              icon: Users,       badge: 'NEW'   },
            { name: 'Usuários',     href: '/backoffice/settings/usuarios',   icon: UserCog,     badge: 'NEW'   },
            { name: 'Integrações',  href: '/backoffice/integracoes',         icon: Plug      },
            { name: 'Settings',     href: '/backoffice/settings',            icon: Settings  },
            { name: 'Corretores',   href: '/backoffice/settings/corretores', icon: Users     },
            { name: 'Permissões',   href: '/backoffice/settings/permissoes', icon: Shield    },
            { name: 'Logs',         href: '/backoffice/settings/logs',       icon: ScrollText },
            { name: 'Config. IA',   href: '/backoffice/settings/ia',         icon: Brain     },
        ],
    },
]

// ── Netflix tile badge ─────────────────────────────────────────────
function TileBadge({ badge }: { badge: string }) {
    const isNew = badge === 'NEW'
    return (
        <span style={{
            position: 'absolute',
            top: 2,
            right: isNew ? 2 : -2,
            fontSize: isNew ? 8 : 7,
            fontWeight: 700,
            padding: isNew ? '2px 5px' : '2px 4px',
            borderRadius: 6,
            letterSpacing: '0.05em',
            background: isNew ? '#2D8F5C' : 'rgba(148,163,184,0.20)',
            color: isNew ? '#fff' : 'var(--text-tertiary)',
            lineHeight: 1.2,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: isNew ? '0 1px 4px rgba(45,143,92,0.3)' : 'none',
        }}>
            {isNew ? 'NOVO' : 'BREVE'}
        </span>
    )
}

// ── Netflix tile card ──────────────────────────────────────────────
function NetflixItemCard({
    name, icon: Icon, color, bg, active, badge,
}: { name: string; icon: React.ElementType; color: string; bg: string; active: boolean; badge?: string }) {
    return (
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px]" style={{ position: 'relative' }}>
            <div
                className="w-[52px] h-[52px] flex items-center justify-center transition-all duration-200"
                style={{
                    borderRadius: 6,
                    background: active ? bg : 'var(--bg-elevated)',
                    border: active ? `1.5px solid ${color}50` : '1px solid var(--border-subtle)',
                    boxShadow: active ? `0 4px 14px ${color}30` : '0 1px 3px rgba(0,0,0,0.06)',
                    position: 'relative',
                }}
            >
                <Icon size={20} style={{ color: active ? color : 'var(--text-secondary)' }} />
            </div>
            {badge && <TileBadge badge={badge} />}
            <span
                className="text-[10px] font-semibold text-center leading-tight w-full"
                style={{
                    color: active ? color : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                {name}
            </span>
        </div>
    )
}

// ── Netflix row label ──────────────────────────────────────────────
function NetflixRowLabel({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2.5 px-4 mb-2.5">
            {/* Colored indicator */}
            <div
                className="flex-shrink-0"
                style={{ width: 3, height: 16, borderRadius: 6, background: color, boxShadow: `0 0 8px ${color}40` }}
            />
            <span
                className="text-[11px] font-bold tracking-[0.10em] uppercase"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
            >
                {label}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>
    )
}

// ── Scrollable horizontal row ──────────────────────────────────────
function NetflixRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="flex gap-2.5 overflow-x-auto px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
                {children}
            </div>
            {/* Right fade hint — matches sheet bg */}
            <div
                className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                style={{ background: 'linear-gradient(to left, var(--bg-surface) 10%, transparent)' }}
            />
        </div>
    )
}

// ── Vertical divider between nav items ────────────────────────────
function NavDivider() {
    return (
        <div
            style={{
                width: 1,
                height: 28,
                background: 'var(--border-default)',
                flexShrink: 0,
            }}
        />
    )
}

// ── Main component ─────────────────────────────────────────────────
export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const dragControls = useDragControls()

    // Lock scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on navigation
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    // Hide when imoveis module has its own module nav
    const isImoveisModule = pathname?.startsWith('/backoffice/imoveis')
    if (isImoveisModule) return null

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <nav
                aria-label="Navegação principal mobile"
                className="lg:hidden fixed bottom-0 inset-x-0 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Nav container — DS3 standard radius (not pill-shaped) */}
                <div
                    className="mx-3 mb-3"
                    style={{
                        borderRadius: 'var(--r-xl)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid var(--border-default)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    <div className="flex items-center h-16 px-1">

                        {/* Hoje */}
                        {(() => {
                            const item = BOTTOM_ITEMS[0]
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1" aria-label={`Navegar para ${item.name}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center h-full w-full gap-0.5"
                                    >
                                        <item.icon
                                            size={active ? 22 : 20}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })()}

                        <NavDivider />

                        {/* Imóveis */}
                        {(() => {
                            const item = BOTTOM_ITEMS[1]
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1" aria-label={`Navegar para ${item.name}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center h-full w-full gap-0.5"
                                    >
                                        <item.icon
                                            size={active ? 22 : 20}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })()}

                        <NavDivider />

                        {/* Mais — center, inline, distinct background */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setOpen(v => !v)}
                                aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                                aria-expanded={open}
                                className="flex items-center justify-center"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 6,
                                    background: open ? 'var(--accent-400)' : 'var(--bg-elevated)',
                                    border: `1px solid ${open ? 'var(--accent-400)' : 'rgba(200,164,74,0.2)'}`,
                                    transition: 'background 0.2s, border-color 0.2s',
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
                                            <X size={20} color="white" strokeWidth={2.5} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <MoreHorizontal size={20} style={{ color: 'var(--text-tertiary)' }} strokeWidth={2} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            <span
                                className="text-[10px] font-semibold transition-colors duration-150"
                                style={{ color: open ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                            >
                                Mais
                            </span>
                        </div>

                        <NavDivider />

                        {/* Leads */}
                        {(() => {
                            const item = BOTTOM_ITEMS[2]
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1" aria-label={`Navegar para ${item.name}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center h-full w-full gap-0.5"
                                    >
                                        <item.icon
                                            size={active ? 22 : 20}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })()}

                        <NavDivider />

                        {/* Agenda */}
                        {(() => {
                            const item = BOTTOM_ITEMS[3]
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1" aria-label={`Navegar para ${item.name}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center h-full w-full gap-0.5"
                                    >
                                        <item.icon
                                            size={active ? 22 : 20}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold transition-colors duration-150"
                                            style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })()}

                    </div>
                </div>
            </nav>

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
                            onClick={() => setOpen(false)}
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
                                }
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex flex-col"
                            style={{
                                borderRadius: '4px 4px 0 0',
                                background: 'var(--bg-surface)',
                                borderTop: '1px solid var(--border-default)',
                                borderLeft: '1px solid var(--border-default)',
                                borderRight: '1px solid var(--border-default)',
                                boxShadow: '0 -8px 40px rgba(0,0,0,0.30)',
                                maxHeight: 'min(88dvh, 88vh)',
                                height: 'min(88dvh, 88vh)',
                                overflow: 'hidden',
                                maxWidth: '100vw',
                                width: '100%',
                            }}
                        >
                            {/* ── Header with drag handle + IMI brand + close ── */}
                            <div
                                className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => dragControls.start(e)}
                            >
                                {/* Drag handle */}
                                <div className="flex justify-center pt-3 pb-0">
                                    <div
                                        className="w-9 h-[3px]"
                                        style={{ borderRadius: 'var(--r-full)', background: 'var(--border-strong)' }}
                                    />
                                </div>
                                {/* Brand row */}
                                <div
                                    className="flex items-center justify-between px-4 pt-3 pb-3"
                                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span style={{
                                            fontFamily: "'Libre Baskerville', Georgia, serif",
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            letterSpacing: '-0.01em',
                                            lineHeight: 1,
                                        }}>IMI</span>
                                        <div style={{ width: 1, height: 13, background: 'var(--border-strong)', flexShrink: 0 }} />
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'var(--text-gold)',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase' as const,
                                            lineHeight: 1.25,
                                            fontFamily: 'var(--font-sans)',
                                        }}>
                                            MENU<br />PRINCIPAL
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Notification bell */}
                                        <Link
                                            href="/backoffice/notificacoes"
                                            onClick={() => setOpen(false)}
                                            className="relative flex items-center justify-center"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 'var(--r-md)',
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            <Bell size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <span
                                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                                                style={{ background: 'var(--accent-400)', border: '2px solid var(--bg-surface)' }}
                                            />
                                        </Link>
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="flex items-center justify-center"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 'var(--r-md)',
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-subtle)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Netflix scrollable rows ── */}
                            <div
                                className="overflow-y-auto flex-1"
                                style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))', overflowX: 'hidden' }}
                            >
                                {/* ── Top Widget — Quick Stats ── */}
                                <motion.div
                                    className="px-4 pt-4 pb-2"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.02, duration: 0.25 }}
                                >
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Hoje', value: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }), color: 'var(--accent-400)', bg: 'rgba(200,164,74,0.12)' },
                                            { label: 'Imóveis', value: '—', color: 'var(--info)', bg: 'rgba(96,165,250,0.12)' },
                                            { label: 'Leads', value: '—', color: 'var(--success)', bg: 'rgba(52,211,153,0.12)' },
                                        ].map((w, i) => (
                                            <div
                                                key={w.label}
                                                className="flex-1 rounded-md px-3 py-2.5"
                                                style={{
                                                    background: w.bg,
                                                    border: `1px solid ${w.color}20`,
                                                }}
                                            >
                                                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                    {w.label}
                                                </p>
                                                <p className="text-sm font-bold" style={{ color: w.color }}>
                                                    {w.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Quick Create — premium 2-column launcher */}
                                <motion.div
                                    className="pt-3 px-4"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05, duration: 0.28 }}
                                >
                                    {/* Section label */}
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div style={{ width: 4, height: 12, borderRadius: 6, background: 'var(--accent-400)', flexShrink: 0 }} />
                                        <span style={{
                                            fontSize: '11px', fontWeight: 700,
                                            color: 'var(--text-tertiary)',
                                            letterSpacing: '0.14em',
                                            textTransform: 'uppercase',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            CRIAR NOVO
                                        </span>
                                        <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                                    </div>

                                    {/* 2-column grid — gap-1.5 + px-2 fit Samsung S25 Ultra (412px) */}
                                    <div className="grid grid-cols-2 gap-1.5 w-full">
                                        {QUICK_CREATE.map((item, i) => (
                                            <motion.div
                                                key={item.href}
                                                className="min-w-0 overflow-hidden"
                                                initial={{ opacity: 0, scale: 0.90 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.08 + i * 0.045, type: 'spring', stiffness: 400, damping: 28 }}
                                            >
                                                <Link href={item.href} onClick={() => setOpen(false)}>
                                                    <motion.div
                                                        whileTap={{ scale: 0.96 }}
                                                        className="flex items-center gap-2 px-2.5 min-w-0"
                                                        style={{
                                                            height: 56,
                                                            borderRadius: 'var(--r-lg)',
                                                            background: 'var(--bg-elevated)',
                                                            border: '1px solid var(--border-subtle)',
                                                            transition: 'border-color 0.15s, box-shadow 0.15s',
                                                        }}
                                                        onHoverStart={e => {
                                                            const el = (e.target as HTMLElement).closest('[data-quick-card]') as HTMLElement | null
                                                            if (el) {
                                                                el.style.borderColor = 'rgba(200,164,74,0.45)'
                                                                el.style.boxShadow = '0 2px 10px rgba(200,164,74,0.10)'
                                                            }
                                                        }}
                                                        onHoverEnd={e => {
                                                            const el = (e.target as HTMLElement).closest('[data-quick-card]') as HTMLElement | null
                                                            if (el) {
                                                                el.style.borderColor = ''
                                                                el.style.boxShadow = ''
                                                            }
                                                        }}
                                                    >
                                                        {/* Colored icon box */}
                                                        <div
                                                            className="flex-shrink-0 flex items-center justify-center"
                                                            style={{
                                                                width: 32, height: 32,
                                                                borderRadius: 6,
                                                                background: item.iconBg,
                                                                border: `1px solid ${item.color}28`,
                                                            }}
                                                        >
                                                            <item.icon size={14} style={{ color: item.color }} />
                                                        </div>

                                                        {/* Text — truncated to prevent overflow on narrow screens */}
                                                        <div className="flex-1 min-w-0 overflow-hidden">
                                                            <p className="text-[11px] font-semibold leading-tight truncate"
                                                                style={{ color: 'var(--text-primary)' }}>
                                                                {item.label}
                                                            </p>
                                                            <p className="text-[9px] truncate mt-0.5 leading-tight"
                                                                style={{ color: 'var(--text-tertiary)' }}>
                                                                {item.subtitle}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* ── GROUPS as Netflix horizontal rows ── */}
                                {GROUPS.map((group, gi) => (
                                    <motion.div
                                        key={group.label}
                                        className="pt-4"
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + gi * 0.035, duration: 0.26 }}
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
                                                                badge={item.badge}
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
