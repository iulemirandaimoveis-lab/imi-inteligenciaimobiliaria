'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, Building2, Users, BarChart3, X,
    FileText, DollarSign, Briefcase, Target, FileEdit,
    Activity, Lightbulb, Settings, Layers, MessageSquare,
    Bell, Banknote, FolderOpen, MoreHorizontal, ChevronRight,
} from 'lucide-react'

const mainItems = [
    { name: 'Dashboard', href: '/backoffice/dashboard', icon: LayoutDashboard },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2 },
    { name: 'Leads', href: '/backoffice/leads', icon: Users },
    { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
]

const allGroups = [
    {
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
        label: 'Marketing & IA',
        items: [
            { name: 'Campanhas', href: '/backoffice/campanhas', icon: Target },
            { name: 'Conteúdo', href: '/backoffice/conteudos', icon: FileEdit },
            { name: 'Tracking', href: '/backoffice/tracking', icon: Activity },
        ],
    },
    {
        label: 'Financeiro & Projetos',
        items: [
            { name: 'Financeiro', href: '/backoffice/financeiro', icon: Banknote },
            { name: 'Projetos', href: '/backoffice/projetos', icon: FolderOpen },
        ],
    },
    {
        label: 'Gestão & Dashboards',
        items: [
            { name: 'Relatórios', href: '/backoffice/relatorios', icon: BarChart3 },
            { name: 'Playbooks', href: '/backoffice/playbooks', icon: Lightbulb },
        ],
    },
    {
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

// ── Bottom Tab Item ───────────────────────────────────────────
function TabItem({ item, isActive, onClick }: { item: typeof mainItems[0]; isActive: boolean; onClick?: () => void }) {
    return (
        <Link href={item.href} onClick={onClick}>
            <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center justify-center min-w-[56px] py-2 px-3 cursor-pointer"
            >
                {/* Active pill background */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            layoutId="tab-active-bg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute inset-0 rounded-xl"
                            style={{ background: 'rgba(196,157,91,0.10)' }}
                        />
                    )}
                </AnimatePresence>

                <item.icon
                    size={20}
                    className="relative transition-colors duration-150"
                    style={{ color: isActive ? 'var(--accent-600)' : '#ADB5BD' }}
                />

                <span
                    className="relative text-[10px] font-semibold mt-1 transition-colors duration-150"
                    style={{ color: isActive ? 'var(--accent-600)' : '#ADB5BD' }}
                >
                    {item.name}
                </span>

                {/* Active dot */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                            className="absolute top-1 w-1 h-1 rounded-full"
                            style={{ background: 'var(--accent-500)', right: '10px' }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    )
}

// ── Drawer Item ───────────────────────────────────────────────
function DrawerItem({ item, isActive, onClose }: { item: { name: string; href: string; icon: any }; isActive: boolean; onClose: () => void }) {
    return (
        <Link href={item.href} onClick={onClose}>
            <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-4 px-5 py-3.5 rounded-xl mx-2 cursor-pointer transition-colors duration-100"
                style={{ background: isActive ? 'rgba(196,157,91,0.08)' : 'transparent' }}
                onTouchStart={e => (e.currentTarget.style.background = '#F8F9FA')}
                onTouchEnd={e => (e.currentTarget.style.background = isActive ? 'rgba(196,157,91,0.08)' : 'transparent')}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: isActive ? 'rgba(196,157,91,0.12)' : '#F1F3F5',
                    }}
                >
                    <item.icon
                        size={17}
                        style={{ color: isActive ? 'var(--accent-600)' : '#6C757D' }}
                    />
                </div>
                <span
                    className="text-sm font-medium flex-1"
                    style={{ color: isActive ? '#1A1A1A' : '#495057' }}
                >
                    {item.name}
                </span>
                {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-500)' }} />
                )}
            </motion.div>
        </Link>
    )
}

// ── Main Component ────────────────────────────────────────────
export function MobileBottomNav() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    // Prevent body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    // Close on route change
    useEffect(() => { setMenuOpen(false) }, [pathname])

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div
                    className="mx-3 mb-3 rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(233,236,239,0.8)',
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                    }}
                >
                    <div className="flex items-center justify-around px-1 py-1">
                        {mainItems.map(item => (
                            <TabItem
                                key={item.href}
                                item={item}
                                isActive={!menuOpen && (pathname === item.href || !!pathname?.startsWith(item.href + '/'))}
                            />
                        ))}

                        {/* More button */}
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="relative flex flex-col items-center justify-center min-w-[56px] py-2 px-3 cursor-pointer"
                        >
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: 'rgba(196,157,91,0.10)' }}
                                    />
                                )}
                            </AnimatePresence>

                            <motion.span
                                animate={{ rotate: menuOpen ? 90 : 0 }}
                                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                className="relative"
                            >
                                {menuOpen
                                    ? <X size={20} style={{ color: 'var(--accent-600)' }} />
                                    : <MoreHorizontal size={20} style={{ color: '#ADB5BD' }} />
                                }
                            </motion.span>
                            <span
                                className="relative text-[10px] font-semibold mt-1 transition-colors duration-150"
                                style={{ color: menuOpen ? 'var(--accent-600)' : '#ADB5BD' }}
                            >
                                Menu
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Drawer Overlay ─────────────────────────────────── */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 z-40"
                            style={{ background: 'rgba(10,14,20,0.5)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.9 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-50 overflow-hidden rounded-t-3xl"
                            style={{
                                background: 'white',
                                boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
                                maxHeight: '80vh',
                                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
                            }}
                        >
                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full" style={{ background: '#DEE2E6' }} />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3"
                                style={{ borderBottom: '1px solid #F1F3F5' }}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-700))' }}
                                    >
                                        I
                                    </div>
                                    <span className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-playfair), serif' }}>
                                        IMI Atlantis
                                    </span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setMenuOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: '#F1F3F5' }}
                                >
                                    <X size={16} style={{ color: '#6C757D' }} />
                                </motion.button>
                            </div>

                            {/* Nav groups */}
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
                                {allGroups.map((group, gi) => (
                                    <div key={group.label} className="pt-4">
                                        <p className="px-7 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                                            style={{ color: '#ADB5BD' }}>
                                            {group.label}
                                        </p>
                                        {group.items.map((item, i) => (
                                            <motion.div
                                                key={item.href}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: (gi * group.items.length + i) * 0.02 }}
                                            >
                                                <DrawerItem
                                                    item={item}
                                                    isActive={pathname === item.href || !!pathname?.startsWith(item.href + '/')}
                                                    onClose={() => setMenuOpen(false)}
                                                />
                                            </motion.div>
                                        ))}
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
