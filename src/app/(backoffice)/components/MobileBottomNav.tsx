'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
    LayoutDashboard, Building2, Users, BarChart3, X,
    FileText, DollarSign, Briefcase, BookOpen, Settings,
    MessageSquare, Bell, Banknote, FolderOpen, MoreHorizontal,
    Scale, CreditCard, FileStack, Layers, Target, Zap, Mail, FileSignature, LogOut,
    Megaphone, BarChart2, Plug
} from 'lucide-react'

const MAIN = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Leads', href: '/backoffice/leads', icon: Users },
    { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
]

const GROUPS = [
    {
        label: 'Operações',
        items: [
            { name: 'Avaliações', href: '/backoffice/avaliacoes', icon: Scale },
            { name: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: FileText },
            { name: 'Contratos', href: '/backoffice/contratos', icon: FileSignature },
            { name: 'Email + Honorários', href: '/backoffice/avaliacoes/email-honorarios', icon: Mail },
            { name: 'Exercícios NBR', href: '/backoffice/avaliacoes/exercicios', icon: BookOpen },
            { name: 'Crédito', href: '/backoffice/credito', icon: CreditCard },
            { name: 'Consultoria', href: '/backoffice/consultorias', icon: Briefcase },
            { name: 'WhatsApp', href: '/backoffice/whatsapp', icon: MessageSquare },
        ],
    },
    {
        label: 'Portfólio',
        items: [
            { name: 'Portfólio', href: '/backoffice/imoveis', icon: Building2 },
            { name: 'Construtoras', href: '/backoffice/construtoras', icon: Building2 },
            { name: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
            { name: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote },
        ],
    },
    {
        label: 'Gestão',
        items: [
            { name: 'Leads', href: '/backoffice/leads', icon: Users },
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: FileStack },
            { name: 'Playbooks', href: '/backoffice/playbooks', icon: BookOpen },
        ],
    },
    {
        label: 'Marketing',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Megaphone },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: FileText },
            { name: 'Tracking', href: '/backoffice/tracking', icon: BarChart2 },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { name: 'Equipe', href: '/backoffice/equipe', icon: Users },
            { name: 'Integrações', href: '/backoffice/integracoes', icon: Plug },
            { name: 'Configurações', href: '/backoffice/settings', icon: Settings },
            { name: 'Automações', href: '/backoffice/automacoes', icon: Zap },
        ],
    },
]

const GOLD = '#C49D5B'

export function MobileBottomNav() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const SURFACE = 'var(--bo-surface)'
    const DIM = 'var(--bo-text-muted)'

    const SHEET_BG = 'var(--bo-drawer-bg)'
    const BORDER = 'var(--bo-border)'
    const TEXT = 'var(--bo-text)'
    const DIM_TEXT = 'var(--bo-text-muted)'
    const HOVER_BG = 'var(--bo-hover)'
    const ICON_BG = 'var(--bo-icon-bg)'

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => { setOpen(false) }, [pathname])

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 z-50 transition-colors"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div
                    className="mx-3 mb-3 rounded-2xl overflow-hidden transition-colors"
                    style={{
                        background: SURFACE,
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: `1px solid ${BORDER}`,
                        boxShadow: 'var(--bo-shadow)',
                    }}
                >
                    <div className="flex items-center justify-between px-1">
                        {MAIN.map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="relative flex flex-col items-center justify-center py-3 w-full"
                                    >
                                        <AnimatePresence>
                                            {active && (
                                                <motion.div
                                                    layoutId="nav-active-pill"
                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                    className="absolute inset-0 mx-1 rounded-xl"
                                                    style={{ background: 'rgba(196,157,91,0.10)' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                        <item.icon
                                            size={20}
                                            className="relative transition-colors duration-150"
                                            style={{ color: active ? GOLD : DIM }}
                                        />
                                        <span
                                            className="relative text-[9px] font-semibold mt-1 transition-colors duration-150"
                                            style={{ color: active ? GOLD : DIM }}
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
                            className="relative flex-1 flex flex-col items-center justify-center py-3"
                        >
                            <AnimatePresence>
                                {open && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.7 }}
                                        className="absolute inset-0 mx-1 rounded-xl"
                                        style={{ background: 'rgba(196,157,91,0.10)' }}
                                    />
                                )}
                            </AnimatePresence>
                            <motion.span
                                animate={{ rotate: open ? 135 : 0 }}
                                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                className="relative"
                            >
                                {open
                                    ? <X size={20} style={{ color: GOLD }} />
                                    : <MoreHorizontal size={20} style={{ color: DIM }} />
                                }
                            </motion.span>
                            <span
                                className="relative text-[9px] font-semibold mt-1 transition-colors"
                                style={{ color: open ? GOLD : DIM }}
                            >
                                Menu
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
                            style={{ background: 'rgba(7,9,13,0.75)', backdropFilter: 'blur(6px)' }}
                            onClick={() => setOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-3xl overflow-hidden transition-colors flex flex-col"
                            style={{
                                background: SHEET_BG,
                                border: `1px solid ${BORDER}`,
                                borderBottom: 'none',
                                boxShadow: 'var(--bo-shadow-elevated)',
                                height: '85vh',
                            }}
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                                <div className="w-8 h-1 rounded-full" style={{ background: BORDER }} />
                            </div>

                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                                style={{ borderBottom: `1px solid ${BORDER}` }}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="text-2xl font-bold tracking-tight transition-colors"
                                        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TEXT }}
                                    >
                                        IMI
                                    </span>
                                    <div className="h-6 w-px" style={{ background: BORDER }}></div>
                                    <span className="text-[9px] font-medium uppercase tracking-[0.15em] leading-[1.1]" style={{ color: DIM_TEXT }}>
                                        Inteligência<br />Imobiliária
                                    </span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                                    style={{ background: ICON_BG }}
                                >
                                    <X size={15} style={{ color: DIM_TEXT }} />
                                </motion.button>
                            </div>

                            {/* Groups */}
                            <div className="overflow-y-auto flex-1 pb-[calc(88px+env(safe-area-inset-bottom))]">
                                {GROUPS.map((group, gi) => (
                                    <div key={group.label} className="pt-4">
                                        <p
                                            className="px-6 pb-2 text-[9px] font-bold uppercase tracking-[0.12em]"
                                            style={{ color: DIM_TEXT }}
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
                                                    transition={{ delay: (gi * 3 + i) * 0.018 }}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setOpen(false)}
                                                        className="flex items-center gap-4 px-5 py-3 mx-2 rounded-xl transition-all"
                                                        style={{
                                                            background: active ? 'rgba(196,157,91,0.08)' : 'transparent',
                                                            color: active ? '#C49D5B' : DIM_TEXT,
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!active) (e.currentTarget as HTMLElement).style.background = HOVER_BG
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                                                        }}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                                                            style={{
                                                                background: active ? 'rgba(196,157,91,0.15)' : ICON_BG,
                                                            }}
                                                        >
                                                            <item.icon size={15} />
                                                        </div>
                                                        <span className="text-sm font-medium flex-1">{item.name}</span>
                                                        {active && (
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                                                        )}
                                                    </Link>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ))}

                                {/* User Profile & Logout */}
                                <div className="mt-4 px-6 pb-6 pt-2 border-t" style={{ borderColor: 'var(--bo-border)' }}>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #C49D5B, #8B5E1F)' }}
                                        >
                                            IM
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--bo-text)' }}>Iule Miranda</p>
                                            <p className="text-[10px] truncate" style={{ color: 'var(--bo-text-muted)' }}>Admin</p>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={async () => {
                                                setOpen(false)
                                                console.log("Logout triggered locally for mobile")
                                                window.location.href = '/login'
                                            }}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-red-50 dark:bg-red-500/10"
                                        >
                                            <LogOut size={16} className="text-red-500" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
