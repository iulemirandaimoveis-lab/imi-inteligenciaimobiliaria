'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
} from 'lucide-react'

// ── 4 fixed bottom nav items ─────────────────────────────────────────
const BOTTOM_ITEMS = [
    { name: 'Hoje',    href: '/backoffice/hoje',      icon: Sun,          color: '#F59E0B', bg: 'rgba(245,158,11,0.13)'  },
    { name: 'Imóveis', href: '/backoffice/imoveis',   icon: Building2,    color: '#D4A929', bg: 'rgba(212,169,41,0.13)'  },
    { name: 'Leads',   href: '/backoffice/leads',     icon: Users,        color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    { name: 'Agenda',  href: '/backoffice/agenda',    icon: CalendarDays, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
]

// Quick-create actions (shown in mega-menu)
const QUICK_CREATE = [
    { label: 'Novo Lead',      desc: 'Adicionar ao pipeline',    href: '/backoffice/leads/novo',      icon: UserPlus,     color: '#E8A87C', bg: 'rgba(232,168,124,0.13)' },
    { label: 'Novo Evento',    desc: 'Agendar compromisso',      href: '/backoffice/agenda',          icon: CalendarPlus, color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)'  },
    { label: 'Novo Imóvel',    desc: 'Cadastrar empreendimento', href: '/backoffice/imoveis/novo',    icon: Building2,    color: '#486581', bg: 'rgba(72,101,129,0.16)'  },
    { label: 'Nova Avaliação', desc: 'Iniciar laudo técnico',    href: '/backoffice/avaliacoes/nova', icon: ClipboardList,color: '#6BB87B', bg: 'rgba(107,184,123,0.13)' },
]

// Full nav groups — horizontal Netflix-style rows
const GROUPS = [
    {
        label: 'Visão Executiva', color: '#6B9EC4', bg: 'rgba(107,158,196,0.12)',
        items: [
            { name: 'Dashboard',    href: '/backoffice/dashboard',            icon: LayoutDashboard },
            { name: 'Metas',        href: '/backoffice/financeiro/metas',     icon: Target },
            { name: 'Relatórios',   href: '/backoffice/relatorios',           icon: FileStack },
            { name: 'Global Intel', href: '/backoffice/relatorios/executivo', icon: Brain },
        ],
    },
    {
        label: 'Captação', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)',
        items: [
            { name: 'Leads',         href: '/backoffice/leads',            icon: Users },
            { name: 'Inbox IA',      href: '/backoffice/leads/inbox',      icon: Inbox },
            { name: 'Comportamento', href: '/backoffice/leads/behavior',   icon: BarChart3 },
            { name: 'Campanhas',     href: '/backoffice/campanhas',        icon: Megaphone },
            { name: 'Ads',           href: '/backoffice/campanhas/ads',    icon: BarChart2 },
            { name: 'QR Tracking',   href: '/backoffice/tracking/qr',      icon: QrCode },
            { name: 'Omni Channel',  href: '/backoffice/omnichannel',      icon: Layers },
            { name: 'WhatsApp',      href: '/backoffice/whatsapp',         icon: MessageSquare },
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
                className="flex gap-2 overflow-x-auto px-4 pb-2"
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

                        {/* Left 2: Dashboard + Imóveis */}
                        {BOTTOM_ITEMS.slice(0, 2).map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center py-2 w-full"
                                    >
                                        <item.icon
                                            size={18}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold mt-0.5 transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        >
                                            {item.name}
                                        </span>
                                    </motion.div>
                                </Link>
                            )
                        })}

                        {/* Center: Mais (elevated, opens mega-menu) */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center px-3">
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setOpen(v => !v)}
                                className="flex items-center justify-center rounded-2xl"
                                style={{
                                    width: 52,
                                    height: 52,
                                    marginTop: '-18px',
                                    background: open ? 'var(--bo-accent)' : 'var(--bo-icon-bg)',
                                    border: `1.5px solid ${open ? 'var(--bo-accent)' : 'var(--bo-border)'}`,
                                    boxShadow: open
                                        ? '0 4px 24px rgba(72,101,129,0.5)'
                                        : '0 4px 20px rgba(0,0,0,0.25)',
                                    transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
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
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ scale: 0.7, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.7, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <MoreHorizontal size={22} style={{ color: 'var(--bo-text-muted)' }} strokeWidth={2} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            <span
                                className="text-[9px] font-semibold mt-0.5"
                                style={{ color: open ? 'var(--bo-accent)' : 'var(--nav-inactive)' }}
                            >
                                Mais
                            </span>
                        </div>

                        {/* Right 2: Leads + Agenda */}
                        {BOTTOM_ITEMS.slice(2, 4).map(item => {
                            const active = !open && (pathname === item.href || pathname?.startsWith(item.href + '/'))
                            return (
                                <Link key={item.href} href={item.href} className="flex-1">
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className="flex flex-col items-center justify-center py-2 w-full"
                                    >
                                        <item.icon
                                            size={18}
                                            className="transition-colors duration-150"
                                            style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold mt-0.5 transition-colors duration-150"
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
                            {/* Drag Handle — arrastar pra baixo fecha */}
                            <div
                                className="flex justify-center pt-3 pb-1 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                                onPointerDown={e => dragControls.start(e)}
                            >
                                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--bo-border)' }} />
                            </div>

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
                                                        className="flex-shrink-0 w-[78px] rounded-xl p-2 flex flex-col gap-1.5"
                                                        style={{
                                                            background: item.bg,
                                                            border: `1px solid ${item.color}28`,
                                                        }}
                                                    >
                                                        <div
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                            style={{ background: `${item.color}25` }}
                                                        >
                                                            <item.icon size={13} style={{ color: item.color }} />
                                                        </div>
                                                        <p className="text-[10px] font-bold leading-tight" style={{ color: 'var(--bo-text)' }}>
                                                            {item.label}
                                                        </p>
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </NetflixRow>
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
