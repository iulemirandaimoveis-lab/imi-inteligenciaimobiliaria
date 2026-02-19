'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
    LayoutDashboard, Building2, Users, FileText, DollarSign,
    Briefcase, Target, FileEdit, Activity, BarChart3, Lightbulb,
    Settings, Layers, MessageSquare, Bell, Banknote, FolderOpen,
    ChevronDown, ChevronRight,
} from 'lucide-react'

// ── Navigation Structure ─────────────────────────────────────
const groups = [
    {
        key: 'principal',
        label: 'Principal',
        items: [
            { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        key: 'operacoes',
        label: 'Operações Hub',
        items: [
            { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
            { name: 'Leads', href: '/backoffice/leads', icon: Users },
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: FileText },
            { name: 'Crédito', href: '/backoffice/credito', icon: DollarSign },
            { name: 'Consultoria', href: '/backoffice/consultoria', icon: Briefcase },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
            { name: 'Equipe', href: '/backoffice/equipe', icon: Users },
        ],
    },
    {
        key: 'marketing',
        label: 'Marketing & IA',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Target },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: FileEdit },
            { name: 'Tracking', href: '/backoffice/tracking', icon: Activity },
        ],
    },
    {
        key: 'financeiro',
        label: 'Financeiro & Projetos',
        items: [
            { name: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote },
            { name: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
        ],
    },
    {
        key: 'gestao',
        label: 'Gestão & Dashboards',
        items: [
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
            { name: 'Playbooks', href: '/backoffice/playbooks', icon: Lightbulb },
        ],
    },
    {
        key: 'sistema',
        label: 'Configuração Geral',
        items: [
            { name: 'IA & Automação', href: '/backoffice/automacoes', icon: Lightbulb },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Layers },
            { name: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
            { name: 'Notificações', href: '/backoffice/notificacoes', icon: Bell },
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
        ],
    },
]

// ── Collapsible Group ─────────────────────────────────────────
function NavGroup({ group, pathname }: { group: typeof groups[0]; pathname: string }) {
    const hasActive = group.items.some(
        item => pathname === item.href || pathname?.startsWith(item.href + '/')
    )
    const [open, setOpen] = useState(hasActive || group.key === 'principal')

    return (
        <li>
            {group.key !== 'principal' && (
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between px-2 mb-1 group"
                >
                    <span
                        className="text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150"
                        style={{ color: 'rgba(148,163,184,0.45)' }}
                    >
                        {group.label}
                    </span>
                    <motion.span
                        animate={{ rotate: open ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ color: 'rgba(148,163,184,0.35)' }}
                    >
                        <ChevronRight size={11} />
                    </motion.span>
                </button>
            )}

            <AnimatePresence initial={false}>
                {(open || group.key === 'principal') && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden space-y-0.5"
                    >
                        {group.items.map((item, i) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                            return (
                                <motion.li
                                    key={item.name}
                                    initial={{ x: -8, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                    <NavItem item={item} isActive={isActive} />
                                </motion.li>
                            )
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </li>
    )
}

// ── Nav Item ──────────────────────────────────────────────────
function NavItem({ item, isActive }: { item: { name: string; href: string; icon: any }; isActive: boolean }) {
    return (
        <Link href={item.href}>
            <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer group"
                style={{
                    background: isActive ? 'rgba(212,175,55,0.11)' : 'transparent',
                }}
            >
                {/* Active indicator */}
                <AnimatePresence>
                    {isActive && (
                        <motion.span
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                            style={{ background: 'var(--accent-400)' }}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            exit={{ scaleY: 0 }}
                            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                        />
                    )}
                </AnimatePresence>

                {/* Hover bg */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}

                {/* Icon */}
                <item.icon
                    size={16}
                    className="relative flex-shrink-0 transition-colors duration-150"
                    style={{ color: isActive ? 'var(--accent-400)' : 'rgba(148,163,184,0.7)' }}
                />

                {/* Label */}
                <span
                    className="relative text-[13px] font-medium transition-colors duration-150 leading-none"
                    style={{ color: isActive ? '#E2E8F0' : 'rgba(148,163,184,0.85)' }}
                >
                    {item.name}
                </span>
            </motion.div>
        </Link>
    )
}

// ── Main Sidebar ──────────────────────────────────────────────
export function DesktopSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
            <div
                className="flex grow flex-col overflow-y-auto scrollbar-none pb-4"
                style={{
                    background: 'linear-gradient(180deg, #0D1826 0%, #0F1923 60%, #0D1A2A 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center px-5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link href="/backoffice/dashboard" className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: -2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-400) 0%, var(--accent-600) 100%)',
                                boxShadow: '0 0 20px rgba(196,157,91,0.3), 0 2px 8px rgba(0,0,0,0.3)',
                            }}
                        >
                            <span className="text-sm font-bold" style={{ color: '#0D1826' }}>I</span>
                        </motion.div>
                        <div>
                            <div className="text-sm font-bold text-white leading-none tracking-tight"
                                style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                IMI Atlantis
                            </div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] mt-0.5"
                                style={{ color: 'var(--accent-400)' }}>
                                Inteligência
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col px-3 pt-4">
                    <ul className="flex flex-1 flex-col gap-5">
                        {groups.map(group => (
                            <NavGroup key={group.key} group={group} pathname={pathname || ''} />
                        ))}
                    </ul>
                </nav>

                {/* Footer — User */}
                <div className="px-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link href="/backoffice/settings">
                        <motion.div
                            whileHover={{ x: 2 }}
                            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))',
                                    color: 'white',
                                    boxShadow: '0 0 10px rgba(196,157,91,0.2)',
                                }}
                            >
                                IM
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-white/90 truncate leading-none">
                                    Iule Miranda
                                </p>
                                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(148,163,184,0.5)' }}>
                                    Admin · CRECI 17933
                                </p>
                            </div>
                            <Settings size={13} style={{ color: 'rgba(148,163,184,0.3)' }}
                                className="flex-shrink-0 group-hover:text-accent-400 transition-colors" />
                        </motion.div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
