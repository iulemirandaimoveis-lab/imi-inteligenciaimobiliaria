'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
    X, MoreHorizontal, Bell, Sun,
    Building2, Users, UserPlus, ClipboardList, CalendarPlus, BookMarked,
    FileSignature, MessageCircle,
} from 'lucide-react'
import { SECTIONS, SECTION_COLORS, SECTION_BG_COLORS, flattenSectionItems } from './nav-config'

// ── 4 fixed bottom nav items ─────────────────────────────────────────
const BOTTOM_ITEMS = [
    { name: 'Hoje',    href: '/backoffice/hoje',    icon: Sun,           color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))' },
    { name: 'Imóveis', href: '/backoffice/imoveis', icon: Building2,                             color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))' },
    { name: 'Leads',   href: '/backoffice/leads',   icon: Users,                                 color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))' },
    { name: 'Connect', href: '/backoffice/connect', icon: MessageCircle,                         color: 'var(--nav-active)', bg: 'var(--g10, rgba(200,164,74,.10))' },
]

// Quick-create actions (shown in mega-menu)
const QUICK_CREATE = [
    { label: 'Novo Imóvel',    subtitle: 'Cadastrar empreendimento', href: '/backoffice/imoveis/novo',    icon: Building2,     color: 'var(--accent-400)',   iconBg: 'rgba(200,164,74,0.14)'  },
    { label: 'Novo Lead',      subtitle: 'Adicionar ao pipeline',    href: '/backoffice/leads/novo',      icon: UserPlus,      color: 'var(--info)',          iconBg: 'rgba(96,165,250,0.14)'  },
    { label: 'Nova Avaliação', subtitle: 'Iniciar laudo técnico',    href: '/backoffice/avaliacoes/nova', icon: ClipboardList, color: 'var(--platinum-400)', iconBg: 'rgba(167,139,250,0.14)' },
    { label: 'Nova Campanha',  subtitle: 'Criar campanha de mídia',  href: '/backoffice/campanhas/nova',  icon: CalendarPlus,  color: '#FB923C',              iconBg: 'rgba(251,146,60,0.14)'  },
    { label: 'Nova Proposta',  subtitle: 'Gerar proposta comercial', href: '/backoffice/propostas/nova',  icon: BookMarked,    color: 'var(--success)',       iconBg: 'rgba(52,211,153,0.14)'  },
    { label: 'Novo Contrato',  subtitle: 'Registrar contrato',       href: '/backoffice/contratos/novo',  icon: FileSignature, color: '#F87171',              iconBg: 'rgba(248,113,113,0.14)' },
]

// Derive mobile groups from the shared nav config — always in sync with desktop
const GROUPS = SECTIONS.map(section => ({
    label: section.label,
    color: SECTION_COLORS[section.label] || 'var(--text-tertiary)',
    bg: SECTION_BG_COLORS[section.label] || 'rgba(148,163,184,0.10)',
    items: flattenSectionItems(section.items),
}))

// ── Netflix tile badge ─────────────────────────────────────────────
function TileBadge({ badge }: { badge: string | number }) {
    const isNew = badge === 'NEW'
    const isIA = badge === 'IA'
    return (
        <span style={{
            position: 'absolute',
            top: 2,
            right: isNew || isIA ? 2 : -2,
            fontSize: isNew ? 8 : 7,
            fontWeight: 700,
            padding: isNew || isIA ? '2px 5px' : '2px 4px',
            borderRadius: 7,
            letterSpacing: '0.05em',
            background: isNew ? '#2D8F5C' : isIA ? 'var(--accent-400)' : 'rgba(148,163,184,0.20)',
            color: isNew || isIA ? '#fff' : 'var(--text-tertiary)',
            lineHeight: 1.2,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: isNew ? '0 1px 4px rgba(45,143,92,0.3)' : isIA ? '0 1px 4px rgba(200,164,74,0.25)' : 'none',
        }}>
            {isNew ? 'NOVO' : isIA ? 'IA' : 'BREVE'}
        </span>
    )
}

// ── Netflix tile card ──────────────────────────────────────────────
function NetflixItemCard({
    name, icon: Icon, color, bg, active, badge,
}: { name: string; icon: React.ElementType; color: string; bg: string; active: boolean; badge?: string | number }) {
    return (
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px]" style={{ position: 'relative' }}>
            <div
                className="w-[52px] h-[52px] flex items-center justify-center transition-all duration-200"
                style={{
                    borderRadius: 7,
                    background: active ? bg : 'var(--bg-elevated)',
                    border: active ? `1.5px solid ${color}50` : '1px solid var(--border-default)',
                    boxShadow: active ? `0 4px 14px ${color}30` : '0 1px 4px rgba(0,0,0,0.08)',
                    position: 'relative',
                }}
            >
                {Icon && <Icon size={20} style={{ color: active ? color : 'var(--text-primary)' }} />}
            </div>
            {badge !== undefined && <TileBadge badge={badge} />}
            <span
                className="text-[10px] font-semibold text-center leading-tight w-full"
                style={{
                    color: active ? color : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    opacity: active ? 1 : 0.85,
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
            <div
                className="flex-shrink-0"
                style={{ width: 3, height: 16, borderRadius: 7, background: color, boxShadow: `0 0 8px ${color}40` }}
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

// ── Bottom bar tab item ────────────────────────────────────────────
function BottomTab({ item, active }: { item: typeof BOTTOM_ITEMS[number]; active: boolean }) {
    return (
        <Link href={item.href} className="flex-1 relative" aria-label={`Navegar para ${item.name}`}>
            <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center justify-center w-full gap-0.5 relative"
                style={{
                    margin: '0 2px',
                    height: 48,
                    borderRadius: 8,
                    background: active ? 'rgba(200,164,74,0.10)' : 'transparent',
                    transition: 'background 0.2s',
                }}
            >
                {active && (
                    <span style={{
                        position: 'absolute',
                        top: 5,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'var(--accent-400)',
                        boxShadow: '0 0 6px rgba(200,164,74,0.7)',
                    }} />
                )}
                <item.icon
                    size={20}
                    className="transition-colors duration-150"
                    style={{ color: active ? 'var(--accent-400)' : 'var(--nav-inactive)', marginTop: active ? 6 : 0 }}
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
}

// ── Main component ─────────────────────────────────────────────────
export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [keyboardOpen, setKeyboardOpen] = useState(false)
    const dragControls = useDragControls()
    const [stats, setStats] = useState({ imoveis: '—', leads: '—' })

    // Detect virtual keyboard
    useEffect(() => {
        if (typeof visualViewport === 'undefined') return
        const vv = visualViewport!
        const onResize = () => { setKeyboardOpen(vv.height < window.innerHeight * 0.75) }
        vv.addEventListener('resize', onResize)
        return () => vv.removeEventListener('resize', onResize)
    }, [])

    // Lock scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on navigation
    useEffect(() => { setOpen(false) }, [pathname])

    // Fetch live stats when menu opens
    useEffect(() => {
        if (!open) return
        fetch('/api/backoffice/stats/counts')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setStats({ imoveis: String(d.imoveis ?? '—'), leads: String(d.leads ?? '—') }) })
            .catch(() => {})
    }, [open])

    if (keyboardOpen) return null

    return (
        <>
            {/* ── Bottom Bar ─────────────────────────────────────── */}
            <nav
                aria-label="Navegação principal mobile"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div
                    className="mx-4 mb-3"
                    style={{
                        borderRadius: 'var(--r-xl)',
                        background: 'var(--nav-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1.5px solid rgba(200,164,74,0.45)',
                        boxShadow: '0 -2px 20px rgba(200,164,74,0.08), 0 8px 32px rgba(0,0,0,0.28)',
                        overflow: 'hidden',
                    }}
                >
                    <div className="flex items-center h-16 px-2">

                        <BottomTab item={BOTTOM_ITEMS[0]} active={!open && (pathname === BOTTOM_ITEMS[0].href || pathname?.startsWith(BOTTOM_ITEMS[0].href + '/'))} />

                        <NavDivider />

                        <BottomTab item={BOTTOM_ITEMS[1]} active={!open && (pathname === BOTTOM_ITEMS[1].href || pathname?.startsWith(BOTTOM_ITEMS[1].href + '/'))} />

                        <NavDivider />

                        {/* Mais — center action button */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setOpen(v => !v)}
                                aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                                aria-expanded={open}
                                className="flex items-center justify-center"
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: open ? 'rgba(200,164,74,0.14)' : 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
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
                                            <X size={18} color="var(--accent-400)" strokeWidth={2.5} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <MoreHorizontal size={18} style={{ color: 'var(--text-tertiary)' }} strokeWidth={2} />
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

                        <BottomTab item={BOTTOM_ITEMS[2]} active={!open && (pathname === BOTTOM_ITEMS[2].href || pathname?.startsWith(BOTTOM_ITEMS[2].href + '/'))} />

                        <NavDivider />

                        <BottomTab item={BOTTOM_ITEMS[3]} active={!open && (pathname === BOTTOM_ITEMS[3].href || pathname?.startsWith(BOTTOM_ITEMS[3].href + '/'))} />

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
                                if (info.offset.y > 100 || info.velocity.y > 400) setOpen(false)
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
                            className="lg:hidden fixed bottom-0 inset-x-0 z-60 flex flex-col"
                            style={{
                                borderRadius: '16px 16px 0 0',
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
                                <div className="flex justify-center pt-3 pb-0">
                                    <div
                                        className="w-9 h-[3px]"
                                        style={{ borderRadius: 'var(--r-full)', background: 'var(--border-strong)' }}
                                    />
                                </div>
                                <div
                                    className="flex items-center justify-between px-4 pt-3 pb-3"
                                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span style={{
                                            fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
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
                                className="overflow-y-auto flex-1 max-h-[80dvh]"
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
                                            { label: 'Imóveis', value: stats.imoveis, color: 'var(--info)', bg: 'rgba(96,165,250,0.12)' },
                                            { label: 'Leads', value: stats.leads, color: 'var(--success)', bg: 'rgba(52,211,153,0.12)' },
                                        ].map(w => (
                                            <div
                                                key={w.label}
                                                className="flex-1 rounded-md px-3 py-2.5"
                                                style={{ background: w.bg, border: `1px solid ${w.color}20` }}
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

                                {/* ── Quick Create ── */}
                                <motion.div
                                    className="pt-3 px-4"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05, duration: 0.28 }}
                                >
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div style={{ width: 4, height: 12, borderRadius: 7, background: 'var(--accent-400)', flexShrink: 0 }} />
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

                                    <div className="grid grid-cols-2 gap-2 w-full">
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
                                                    >
                                                        <div
                                                            className="flex-shrink-0 flex items-center justify-center"
                                                            style={{
                                                                width: 32, height: 32,
                                                                borderRadius: 7,
                                                                background: item.iconBg,
                                                                border: `1px solid ${item.color}28`,
                                                            }}
                                                        >
                                                            <item.icon size={14} style={{ color: item.color }} />
                                                        </div>
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

                                {/* ── All sections as Netflix horizontal rows ── */}
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
                                                                name={item.label}
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
