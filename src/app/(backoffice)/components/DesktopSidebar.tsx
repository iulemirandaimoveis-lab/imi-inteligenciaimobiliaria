'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Building2, FileText, Users, Scale,
    Settings, ChevronDown, ChevronRight, LogOut,
    BookOpen, BarChart2, Target, TrendingUp, TrendingDown,
    Zap, CreditCard, Briefcase, CalendarDays, QrCode, Sparkles,
    FileStack, FolderOpen, Banknote, Building,
    FileSignature, Layers, MessageSquare, Megaphone, Plug,
    Brain, BarChart3, LineChart, Wand2, List
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
    label: string
    href?: string
    icon: React.ComponentType<any>
    badge?: string | number
    children?: NavItem[]
}

interface NavSection {
    label: string
    items: NavItem[]
}

const SECTIONS: NavSection[] = [
    {
        label: 'Visão Executiva',
        items: [
            { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
            { label: 'Metas & Performance', href: '/backoffice/financeiro/metas', icon: Target },
            { label: 'Relatórios', href: '/backoffice/relatorios', icon: FileStack },
            { label: 'Global Intelligence', href: '/backoffice/relatorios/executivo', icon: Brain },
        ]
    },
    {
        label: 'Captação',
        items: [
            {
                label: 'Leads', icon: Users,
                children: [
                    { label: 'Todos os Leads', href: '/backoffice/leads', icon: Users },
                    { label: 'Inbox IA', href: '/backoffice/leads/inbox', icon: Sparkles },
                    { label: 'Comportamento', href: '/backoffice/leads/behavior', icon: BarChart3 },
                    { label: 'Novo Lead', href: '/backoffice/leads/novo', icon: Users },
                ]
            },
            { label: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
            { label: 'QR Tracking', href: '/backoffice/tracking/qr', icon: QrCode },
            { label: 'Omni Channel', href: '/backoffice/omnichannel', icon: Layers },
            { label: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
        ]
    },
    {
        label: 'Conversão',
        items: [
            { label: 'Pipeline', href: '/backoffice/leads/pipeline', icon: TrendingUp },
            { label: 'Simulações', href: '/backoffice/credito/simulador', icon: CreditCard },
            { label: 'Agenda', href: '/backoffice/agenda', icon: CalendarDays },
        ]
    },
    {
        label: 'Portfólio',
        items: [
            {
                label: 'Imóveis', icon: Building2,
                children: [
                    { label: 'Portfólio', href: '/backoffice/imoveis', icon: Building2 },
                    { label: 'Inventário', href: '/backoffice/imoveis/inventario', icon: List },
                    { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo', icon: Building2 },
                ]
            },
            { label: 'Construtoras', href: '/backoffice/construtoras', icon: Building },
            { label: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
            {
                label: 'Conteúdo', icon: FileText,
                children: [
                    { label: 'Publicações', href: '/backoffice/conteudos', icon: FileText },
                    { label: 'Criador IA', href: '/backoffice/conteudo/criador', icon: Wand2 },
                    { label: 'Automação', href: '/backoffice/conteudo/automacao', icon: Zap },
                ]
            },
        ]
    },
    {
        label: 'Inteligência',
        items: [
            { label: 'Ebooks', href: '/backoffice/inteligencia/ebooks', icon: BookOpen },
            { label: 'Relatórios', href: '/backoffice/inteligencia/relatorios', icon: FileStack },
            { label: 'Indicadores', href: '/backoffice/inteligencia/indicadores', icon: LineChart },
            { label: 'Índices IMI', href: '/backoffice/inteligencia/indices', icon: Brain },
        ]
    },
    {
        label: 'Operação',
        items: [
            {
                label: 'Avaliações', icon: Scale,
                children: [
                    { label: 'Todas', href: '/backoffice/avaliacoes', icon: Scale },
                    { label: 'Nova', href: '/backoffice/avaliacoes/nova', icon: Scale },
                    { label: 'Email + Honorários', href: '/backoffice/avaliacoes/email-honorarios', icon: Scale },
                    { label: 'Exercícios NBR', href: '/backoffice/avaliacoes/exercicios', icon: BookOpen },
                ]
            },
            {
                label: 'Contratos', icon: FileSignature,
                children: [
                    { label: 'Gerenciador', href: '/backoffice/contratos', icon: FileSignature },
                    { label: 'Novo', href: '/backoffice/contratos/novo', icon: FileSignature },
                ]
            },
            {
                label: 'Consultoria', icon: Briefcase,
                children: [
                    { label: 'Consultorias', href: '/backoffice/consultorias', icon: Briefcase },
                    { label: 'Nova', href: '/backoffice/consultorias/nova', icon: Briefcase },
                ]
            },
            {
                label: 'Crédito', icon: CreditCard,
                children: [
                    { label: 'Operações', href: '/backoffice/credito', icon: CreditCard },
                    { label: 'Simulador', href: '/backoffice/credito/simulador', icon: CreditCard },
                ]
            },
        ]
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Visão Geral', href: '/backoffice/financeiro', icon: Banknote },
            { label: 'A Receber', href: '/backoffice/financeiro/receber', icon: TrendingUp },
            { label: 'A Pagar', href: '/backoffice/financeiro/pagar', icon: TrendingDown },
            { label: 'Metas', href: '/backoffice/financeiro/metas', icon: Target },
        ]
    },
    {
        label: 'Crescimento',
        items: [
            { label: 'Automações', href: '/backoffice/automacoes', icon: Zap },
            { label: 'Playbooks', href: '/backoffice/playbooks', icon: BookOpen },
            { label: 'Analytics', href: '/backoffice/tracking', icon: BarChart2 },
            { label: 'IA Avaliações', href: '/backoffice/avaliacoes/ia', icon: Sparkles },
        ]
    },
    {
        label: 'Configurações',
        items: [
            { label: 'Equipe', href: '/backoffice/equipe', icon: Users },
            { label: 'Integrações', href: '/backoffice/integracoes', icon: Plug },
            { label: 'Configurações', href: '/backoffice/settings', icon: Settings },
            { label: 'AI Settings', href: '/backoffice/settings/ia', icon: Brain },
        ]
    },
]

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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                        color: isParentActive || open ? 'var(--accent-500)' : 'var(--sidebar-text)',
                        background: isParentActive || open ? 'var(--bo-active-bg)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}
                >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                            style={{ background: 'var(--bo-card)' }}
                        >
                            {item.badge}
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
                            style={{ borderLeft: '1px solid var(--bo-border-subtle)' }}
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
            className="hover-card relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
                color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                background: isActive
                    ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600))'
                    : 'transparent',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
            }}
        >
            {/* Active indicator bar */}
            {isActive && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute -left-[11px] top-1/2 w-[3px] h-4 rounded-full"
                    style={{ background: 'var(--bo-accent)', transform: 'translateY(-50%)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
            )}
            <item.icon size={15} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                        item.badge === 'BREVE'
                            ? 'text-[var(--bo-text-muted)] bg-[var(--bo-hover)] border-[var(--bo-border)]'
                            : 'text-white border-transparent'
                    }`}
                    style={item.badge !== 'BREVE' ? { background: 'var(--bo-card)' } : undefined}
                >
                    {item.badge}
                </span>
            )}
        </Link>
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
            className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
            style={{
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
            }}
        >
            {/* Decorative gradient accent */}
            <div
                className="absolute top-0 right-0 w-32 h-48 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at top right, var(--bo-hover) 0%, transparent 70%)',
                }}
            />
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
                <span
                    className="text-2xl font-bold tracking-tight transition-colors text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    IMI
                </span>
                <div className="h-6 w-px" style={{ background: 'var(--sidebar-border)' }}></div>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] leading-[1.1]" style={{ color: 'var(--sidebar-text)' }}>
                    Inteligência<br />Imobiliária
                </span>
            </div>

            {/* Nav — min-h-0 is critical for flex overflow-y-auto to scroll */}
            <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2.5">
                {SECTIONS.map((section, idx) => (
                    <div key={section.label} className={idx > 0 ? 'mt-4' : ''}>
                        <p
                            className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: 'var(--bo-text-muted)', opacity: 0.7 }}
                        >
                            {section.label}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <NavItemComponent key={item.href || item.label} item={item} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / User */}
            <div
                className="px-2.5 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid var(--sidebar-border)' }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl flex-1 min-w-0"
                        style={{ background: 'var(--bo-icon-bg)' }}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}
                        >
                            IM
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--bo-text)' }}>Iule Miranda</p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>CTO · CRECI 17933</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        title="Sair"
                        className="hover-card w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: 'var(--bo-icon-bg)', color: 'var(--bo-text-muted)' }}
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
