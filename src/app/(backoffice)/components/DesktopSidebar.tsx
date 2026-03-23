'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Building2, FileText, Users, Scale,
    Settings, ChevronDown, LogOut, Sun,
    BookOpen, BarChart2, Target, TrendingUp, TrendingDown,
    Zap, CreditCard, Briefcase, CalendarDays, QrCode, Sparkles,
    FileStack, FolderOpen, Banknote, Building,
    FileSignature, Layers, MessageSquare, Megaphone, Plug,
    Brain, BarChart3, LineChart, Wand2, List, Shield, Video, BookMarked, Bot,
    Map as MapIcon, Handshake, MessageCircle, Camera,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
    label: string
    href?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: React.ComponentType<any>
    badge?: string | number
    children?: NavItem[]
}

interface NavSection {
    label: string
    alwaysOpen?: boolean
    items: NavItem[]
}

// ── Section colors for visual differentiation ──
const SECTION_COLORS: Record<string, string> = {
    'Operações Diárias': 'var(--accent-400)',
    'Captação': 'var(--warning)',
    'Conversão': '#4ADE80',
    'Portfólio': '#D4A929',
    'Operação': '#4ECDC4',
    'Financeiro': '#84CC16',
    'Inteligência': 'var(--info)',
    'Configurações': 'var(--text-tertiary)',
}

// ── 8 groups: Operações Diárias always open, rest collapsed by default ──
const SECTIONS: NavSection[] = [
    {
        label: 'Operações Diárias',
        alwaysOpen: true,
        items: [
            { label: 'Hoje',      href: '/backoffice/hoje',      icon: Sun             },
            { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
            { label: 'Leads',     href: '/backoffice/leads',     icon: Users            },
            { label: 'Parcerias', href: '/backoffice/parcerias', icon: Handshake, badge: 'NEW' },
            { label: 'Chat Equipe', href: '/backoffice/connect', icon: MessageSquare },
            { label: 'Agenda',    href: '/backoffice/agenda',    icon: CalendarDays    },
            { label: 'Imóveis',   href: '/backoffice/imoveis',   icon: Building2        },
        ]
    },
    {
        label: 'Captação',
        items: [
            {
                label: 'Leads', icon: Users,
                children: [
                    { label: 'Todos os Leads',  href: '/backoffice/leads',          icon: Users    },
                    { label: 'Inbox IA',        href: '/backoffice/leads/inbox',    icon: Sparkles },
                    { label: 'Comportamento',   href: '/backoffice/leads/behavior', icon: BarChart3 },
                    { label: 'Novo Lead',       href: '/backoffice/leads/novo',     icon: Users    },
                ]
            },
            {
                label: 'Campanhas', icon: Megaphone,
                children: [
                    { label: 'Todas',           href: '/backoffice/campanhas',     icon: Megaphone },
                    { label: 'Ads Performance', href: '/backoffice/campanhas/ads', icon: BarChart2 },
                    { label: 'Nova',            href: '/backoffice/campanhas/nova',icon: Megaphone },
                ]
            },
            { label: 'QR Tracking',  href: '/backoffice/tracking/qr',     icon: QrCode        },
        ]
    },
    {
        label: 'Conversão',
        items: [
            { label: 'Pipeline',    href: '/backoffice/leads/pipeline',    icon: TrendingUp },
            { label: 'Simulações',  href: '/backoffice/credito/simulador', icon: CreditCard },
            { label: 'Agenda',      href: '/backoffice/agenda',            icon: CalendarDays },
        ]
    },
    {
        label: 'Portfólio',
        items: [
            {
                label: 'Imóveis', icon: Building2,
                children: [
                    { label: 'Listagem',       href: '/backoffice/imoveis',                icon: Building2 },
                    { label: 'Explorer',       href: '/backoffice/imoveis/explorer',       icon: BarChart2 },
                    { label: 'Portfolio',      href: '/backoffice/imoveis/portfolio',      icon: LineChart },
                    { label: 'Comparar',       href: '/backoffice/imoveis/comparar',       icon: Scale },
                    { label: 'Inventário',     href: '/backoffice/imoveis/inventario',     icon: List  },
                    { label: 'Novo Imóvel',    href: '/backoffice/imoveis/novo',           icon: Building2 },
                ]
            },
            { label: 'Construtoras', href: '/backoffice/construtoras', icon: Building   },
            { label: 'Projetos',     href: '/backoffice/projetos',     icon: FolderOpen },
            {
                label: 'Conteúdo', icon: FileText,
                children: [
                    { label: 'Publicações', href: '/backoffice/conteudo',           icon: FileText   },
                    { label: 'Criador IA',  href: '/backoffice/conteudo/criador',   icon: Wand2      },
                    { label: 'eBook IA',    href: '/backoffice/conteudo/ebook',     icon: BookMarked },
                    { label: 'Vídeo IA',    href: '/backoffice/conteudo/video',     icon: Video      },
                    { label: 'Automação',   href: '/backoffice/conteudo/automacao', icon: Zap       },
                ]
            },
        ]
    },
    {
        label: 'Operação',
        items: [
            {
                label: 'Avaliações', icon: Scale,
                children: [
                    { label: 'Todas',               href: '/backoffice/avaliacoes',                  icon: Scale    },
                    { label: 'Nova',                href: '/backoffice/avaliacoes/nova',             icon: Scale    },
                    { label: 'Motor de Avaliações', href: '/backoffice/avaliacoes/motor',            icon: Brain, badge: 'IA' },
                    { label: 'Email + Honorários',  href: '/backoffice/avaliacoes/email-honorarios', icon: Scale    },
                    { label: 'Exercícios NBR',      href: '/backoffice/avaliacoes/exercicios',       icon: BookOpen },
                ]
            },
            {
                label: 'Propostas', icon: FileText,
                children: [
                    { label: 'Todas',    href: '/backoffice/propostas',     icon: FileText },
                    { label: 'Nova',     href: '/backoffice/propostas/nova',icon: FileText },
                ]
            },
            {
                label: 'Contratos', icon: FileSignature,
                children: [
                    { label: 'Gerenciador', href: '/backoffice/contratos',     icon: FileSignature },
                    { label: 'Novo',        href: '/backoffice/contratos/novo',icon: FileSignature },
                ]
            },
            {
                label: 'Consultoria', icon: Briefcase,
                children: [
                    { label: 'Consultorias', href: '/backoffice/consultorias',     icon: Briefcase },
                    { label: 'Nova',         href: '/backoffice/consultorias/nova',icon: Briefcase },
                ]
            },
            {
                label: 'Crédito', icon: CreditCard,
                children: [
                    { label: 'Operações',  href: '/backoffice/credito',            icon: CreditCard },
                    { label: 'Simulador',  href: '/backoffice/credito/simulador',  icon: CreditCard },
                ]
            },
        ]
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Visão Geral', href: '/backoffice/financeiro',         icon: Banknote    },
            { label: 'A Receber',   href: '/backoffice/financeiro/receber', icon: TrendingUp  },
            { label: 'A Pagar',     href: '/backoffice/financeiro/pagar',   icon: TrendingDown },
            { label: 'Metas',       href: '/backoffice/financeiro/metas',   icon: Target      },
        ]
    },
    {
        label: 'Inteligência',
        items: [
            { label: 'Biblioteca',   href: '/backoffice/biblioteca',               icon: BookOpen  },
            { label: 'Relatórios',   href: '/backoffice/inteligencia/relatorios',  icon: FileStack },
            { label: 'Indicadores',  href: '/backoffice/inteligencia/indicadores', icon: LineChart },
            { label: 'Índices IMI',  href: '/backoffice/inteligencia/indices',     icon: Brain     },
            { label: 'Widgets',      href: '/backoffice/inteligencia/widgets',     icon: Layers    },
            { label: 'AI Chat',      href: '/backoffice/ai-chat',                   icon: MessageCircle },
            { label: 'Central de IA',href: '/backoffice/ia',                        icon: Sparkles  },
            { label: 'Agentes IA',   href: '/backoffice/ia/agentes',               icon: Bot       },
            { label: 'Prompt Agent', href: '/backoffice/prompt-agent',             icon: Camera    },
            { label: 'Automações',   href: '/backoffice/automacoes',               icon: Zap       },
            { label: 'Analytics',    href: '/backoffice/tracking',                  icon: BarChart2 },
        ]
    },
    {
        label: 'Configurações',
        items: [
            { label: 'Organização',  href: '/backoffice/organizacao',         icon: Building   },
            {
                label: 'Equipe', icon: Users,
                children: [
                    { label: 'Visão Geral',  href: '/backoffice/equipe',              icon: Users },
                    { label: 'Canais',       href: '/backoffice/canais',              icon: MessageSquare },
                    { label: 'Colaboração',  href: '/backoffice/equipe/colaboracao',  icon: Handshake },
                ]
            },
            { label: 'Usuários',     href: '/backoffice/settings/usuarios',   icon: Users      },
            { label: 'Integrações',  href: '/backoffice/integracoes',         icon: Plug      },
            {
                label: 'Configurações', icon: Settings,
                children: [
                    { label: 'Geral',          href: '/backoffice/settings',            icon: Settings  },
                    { label: 'Corretores',     href: '/backoffice/settings/corretores', icon: Users     },
                    { label: 'Permissões',     href: '/backoffice/settings/permissoes', icon: Shield    },
                    { label: 'Logs do Sistema',href: '/backoffice/settings/logs',       icon: FileText  },
                    { label: 'Configurações IA',href: '/backoffice/settings/ia',        icon: Brain     },
                ]
            },
        ]
    },
]

// ── Badge styling helper ──────────────────────────────────────────
function badgeStyle(badge: string | number) {
    const base = {
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700 as const,
        padding: '2px 5px',
        borderRadius: 6,
        letterSpacing: '0.06em',
        lineHeight: 1.2,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
    }
    if (badge === 'NEW') {
        return { ...base, background: '#2D8F5C', color: 'var(--text-inverse)', border: 'none', boxShadow: '0 1px 4px rgba(45,143,92,0.25)' }
    }
    if (badge === 'IA') {
        return { ...base, background: 'var(--accent-400)', color: 'var(--bg-base)', border: 'none', boxShadow: '0 1px 4px rgba(61,111,255,0.25)' }
    }
    if (badge === 'BREVE') {
        return { ...base, fontSize: 11, background: 'rgba(148,163,184,0.15)', color: 'var(--text-tertiary)', border: '1px solid rgba(148,163,184,0.15)' }
    }
    return { ...base, background: 'var(--bg-elevated)', color: 'var(--text-inverse)', border: '1px solid transparent' }
}

// ── Badge display text helper ─────────────────────────────────────
function badgeText(badge: string | number): string {
    if (badge === 'BREVE') return 'BREVE'
    return String(badge)
}

// ── Leaf nav item (no children) ────────────────────────────────────
function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(() => {
        if (!item.children) return false
        return item.children.some(c => c.href && pathname.startsWith(c.href.split('/').slice(0, 4).join('/')))
    })

    const isActive = item.href
        ? pathname === item.href || (item.href !== '/backoffice/dashboard' && pathname.startsWith(item.href))
        : false
    const hasChildren = !!item.children?.length
    const isParentActive = hasChildren && item.children!.some(c => c.href && pathname.startsWith(c.href))

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        color: isParentActive || open ? 'var(--gold, #C8A44A)' : 'var(--text-secondary)',
                        background: isParentActive || open ? 'rgba(200,164,74,.10)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}
                >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                        <span style={badgeStyle(item.badge)}>
                            {badgeText(item.badge)}
                        </span>
                    )}
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ opacity: 0.5, display: 'flex' }}
                    >
                        <ChevronDown size={13} />
                    </motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="ml-5 mt-0.5 space-y-0.5 pl-3 overflow-hidden"
                            style={{ borderLeft: '1px solid var(--border-subtle)' }}
                        >
                            {item.children!.map((child, i) => (
                                <motion.div
                                    key={child.href || child.label}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                    <NavItemComponent item={child} depth={depth + 1} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <Link
            href={item.href!}
            className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                color: isActive ? 'var(--gold, #C8A44A)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(200,164,74,.10)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold, #C8A44A)' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = 'rgba(200,164,74,0.06)'
                    e.currentTarget.style.transform = 'translateX(2px)'
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                }
            }}
        >
            <item.icon size={16} className="flex-shrink-0" style={{ color: isActive ? 'var(--gold, #C8A44A)' : undefined }} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span style={badgeStyle(item.badge)}>
                    {badgeText(item.badge)}
                </span>
            )}
        </Link>
    )
}

// ── Collapsible section ────────────────────────────────────────────
function SectionComponent({ section }: { section: NavSection }) {
    const pathname = usePathname()
    const isAlwaysOpen = !!section.alwaysOpen

    const [open, setOpen] = useState(() => {
        if (isAlwaysOpen) return true
        // Auto-open if current route is within this section
        return section.items.some(item => {
            if (item.href && pathname.startsWith(item.href)) return true
            if (item.children) return item.children.some(c => c.href && pathname.startsWith(c.href))
            return false
        })
    })

    const sectionColor = SECTION_COLORS[section.label] || 'var(--text-tertiary)'

    return (
        <div className="mb-1.5">
            {/* Section header */}
            <button
                onClick={() => { if (!isAlwaysOpen) setOpen(v => !v) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
                style={{ cursor: isAlwaysOpen ? 'default' : 'pointer' }}
                disabled={isAlwaysOpen}
            >
                {/* Color indicator */}
                <div
                    className="flex-shrink-0"
                    style={{ width: 3, height: 12, borderRadius: 6, background: sectionColor, opacity: open ? 1 : 0.4, transition: 'opacity 0.2s' }}
                />
                <p
                    className="flex-1 text-left uppercase"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.10em',
                        color: open ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        transition: 'color 0.2s',
                    }}
                >
                    {section.label}
                </p>
                {!isAlwaysOpen && (
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ opacity: 0.4, display: 'flex', flexShrink: 0 }}
                    >
                        <ChevronDown size={11} style={{ color: 'var(--text-tertiary)' }} />
                    </motion.span>
                )}
            </button>

            {/* Section items */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={isAlwaysOpen ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-0.5 overflow-hidden"
                    >
                        {section.items.map(item => (
                            <NavItemComponent key={item.href || item.label} item={item} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function DesktopSidebar() {
    const router = useRouter()
    const handleSignOut = useCallback(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }, [router])

    return (
        <aside
            className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40"
            style={{
                width: 240,
                background: 'rgba(10,22,36,.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid var(--border-subtle)',
            }}
        >
            {/* Logo — IMI Brand Identity v1.1 DARK */}
            <div
                className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                {/* IMI monogram — Playfair Display 700 · Brand Identity v1.1 DARK */}
                <span
                    className="leading-none select-none"
                    style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: '2px',
                        color: '#FFFFFF',
                    }}
                >
                    IMI
                </span>
                {/* Gold divider · 1px · Brand Identity v1.1 DARK */}
                <div
                    className="flex-shrink-0"
                    style={{ width: 1, height: 26, background: '#C8A44A' }}
                />
                {/* Tagline · Brand Identity v1.1 DARK — gold on dark bg */}
                <span
                    className="select-none"
                    style={{
                        fontSize: '7px',
                        fontWeight: 600,
                        letterSpacing: '2.2px',
                        textTransform: 'uppercase',
                        color: '#C8A44A',
                        lineHeight: 1.45,
                    }}
                >
                    INTELIGÊNCIA<br />IMOBILIÁRIA
                </span>
            </div>

            {/* Nav — min-h-0 is critical for flex overflow-y-auto to scroll */}
            <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2.5">
                {SECTIONS.map(section => (
                    <SectionComponent key={section.label} section={section} />
                ))}
            </nav>

        </aside>
    )
}
