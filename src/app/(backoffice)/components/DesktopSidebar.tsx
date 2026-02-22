'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Building2, FileText, Users, Scale,
    Settings, ChevronDown, ChevronRight, LogOut,
    BookOpen, Mail, Sparkles, Calculator, BarChart2,
    BookmarkPlus, Target, Zap, CreditCard, Briefcase,
    FileStack, FolderOpen, Banknote, Home, TrendingUp,
    FileSignature, Layers
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
    label: string
    href?: string
    icon: React.ComponentType<any>
    badge?: string | number
    children?: NavItem[]
}

const NAV: NavItem[] = [
    { label: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    {
        label: 'Avaliações', icon: Scale, badge: '5',
        children: [
            { label: 'Todas', href: '/backoffice/avaliacoes', icon: FileText },
            { label: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: BookmarkPlus },
            { label: 'Email + Honorários', href: '/backoffice/avaliacoes/email-honorarios', icon: Mail },
            { label: 'Exercícios NBR', href: '/backoffice/avaliacoes/exercicios', icon: BookOpen },
        ]
    },
    {
        label: 'Imóveis', icon: Building2,
        children: [
            { label: 'Portfólio', href: '/backoffice/imoveis', icon: Building2 },
            { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo', icon: BookmarkPlus },
        ]
    },
    {
        label: 'Leads', icon: Users,
        children: [
            { label: 'Pipeline', href: '/backoffice/leads', icon: Users },
            { label: 'Novo Lead', href: '/backoffice/leads/novo', icon: BookmarkPlus },
        ]
    },
    {
        label: 'Crédito', icon: CreditCard,
        children: [
            { label: 'Operações', href: '/backoffice/credito', icon: CreditCard },
            { label: 'Simulador', href: '/backoffice/credito/simulador', icon: Calculator },
        ]
    },
    {
        label: 'Consultoria', icon: Briefcase,
        children: [
            { label: 'Consultorias', href: '/backoffice/consultorias', icon: Briefcase },
            { label: 'Nova', href: '/backoffice/consultorias/nova', icon: BookmarkPlus },
        ]
    },
    {
        label: 'Contratos', icon: FileSignature,
        children: [
            { label: 'Gerenciador', href: '/backoffice/contratos', icon: FileSignature },
            { label: 'Novo Contrato', href: '/backoffice/contratos/novo', icon: BookmarkPlus },
        ]
    },
    { label: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
    {
        label: 'Financeiro', icon: Banknote,
        children: [
            { label: 'Visão Geral', href: '/backoffice/financeiro', icon: BarChart2 },
            { label: 'A Receber', href: '/backoffice/financeiro/receber', icon: TrendingUp },
            { label: 'A Pagar', href: '/backoffice/financeiro/pagar', icon: TrendingUp },
            { label: 'Metas & Performance', href: '/backoffice/financeiro/metas', icon: Target },
        ]
    },
    { label: 'Relatórios', href: '/backoffice/relatorios', icon: FileStack },
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
                        color: isParentActive || open ? '#C49D5B' : 'var(--bo-text-muted)',
                        background: isParentActive || open ? 'var(--bo-active-bg)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}
                >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                            style={{ background: 'rgba(196,157,91,0.60)' }}
                        >
                            {item.badge}
                        </span>
                    )}
                    <span style={{ opacity: 0.5 }}>
                        {open
                            ? <ChevronDown size={13} />
                            : <ChevronRight size={13} />
                        }
                    </span>
                </button>

                {open && (
                    <div
                        className="ml-5 mt-0.5 space-y-0.5 pl-3"
                        style={{ borderLeft: '1px solid var(--bo-border-light)' }}
                    >
                        {item.children!.map(child => (
                            <NavItemComponent key={child.href || child.label} item={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link
            href={item.href!}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
            style={{
                color: isActive ? '#ffffff' : 'var(--bo-text-muted)',
                background: isActive
                    ? 'linear-gradient(135deg, #C49D5B, #A67C3D)'
                    : 'transparent',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 2px 12px rgba(196,157,91,0.35)' : 'none',
            }}
            onMouseEnter={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bo-hover)'
                        ; (e.currentTarget as HTMLElement).style.color = 'var(--bo-text)'
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ; (e.currentTarget as HTMLElement).style.color = 'var(--bo-text-muted)'
                }
            }}
        >
            <item.icon size={15} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                    style={{ background: 'rgba(196,157,91,0.60)' }}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    )
}

export function DesktopSidebar() {
    return (
        <aside
            className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
            style={{
                background: '#0F1117',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <span
                    className="text-2xl font-bold tracking-tight transition-colors text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    IMI
                </span>
                <div className="h-6 w-px bg-white/20"></div>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] leading-[1.1]" style={{ color: '#8B93A7' }}>
                    Inteligência<br />Imobiliária
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
                {NAV.map(item => (
                    <NavItemComponent key={item.href || item.label} item={item} />
                ))}
            </nav>

            {/* Footer / User */}
            <div
                className="px-2.5 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all"
                    style={{ background: 'var(--bo-icon-bg)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #C49D5B, #8B5E1F)' }}
                    >
                        IM
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--bo-text)' }}>Iule Miranda</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>CTO · CRECI 17933</p>
                    </div>
                    <LogOut
                        size={14}
                        className="transition-colors"
                        style={{ color: 'var(--bo-text-muted)' }}
                    />
                </div>
            </div>
        </aside>
    )
}
