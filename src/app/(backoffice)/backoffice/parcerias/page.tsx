'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Handshake, ArrowLeftRight, Search, MessageSquare,
    Building2, DollarSign, CheckCircle, Clock,
    XCircle, TrendingUp, Users, ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePartnerships, type Partnership } from '@/hooks/use-partnerships'
import { PageIntelHeader, KPICard, FilterTabs, type FilterTab } from '../../components/ui'
import { T } from '../../lib/theme'
import { formatCurrency } from '@/lib/format'


/* ─── STATUS CONFIG ───────────────────────────────────────────── */
const STATUS_CFG: Record<
    Partnership['status'],
    { label: string; color: string; bg: string }
> = {
    proposed:    { label: 'Proposta',    color: 'var(--accent-400)', bg: 'rgba(61,111,255,0.12)' },
    negotiating: { label: 'Negociando',  color: 'var(--warning)',    bg: 'rgba(251,191,36,0.12)' },
    accepted:    { label: 'Aceita',      color: 'var(--success)',    bg: 'rgba(34,197,94,0.12)' },
    active:      { label: 'Ativa',       color: 'var(--success)',    bg: 'rgba(34,197,94,0.12)' },
    completed:   { label: 'Concluída',   color: 'var(--info)',       bg: 'rgba(96,165,250,0.12)' },
    cancelled:   { label: 'Cancelada',   color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
    rejected:    { label: 'Rejeitada',   color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
    expired:     { label: 'Expirada',    color: 'var(--error)',      bg: 'rgba(239,68,68,0.12)' },
}

/* ─── FILTER TABS ─────────────────────────────────────────────── */
const FILTER_TABS: FilterTab[] = [
    { id: 'all',       label: 'Todas' },
    { id: 'proposed',  label: 'Propostas' },
    { id: 'active',    label: 'Ativas' },
    { id: 'completed', label: 'Concluídas' },
    { id: 'cancelled', label: 'Canceladas' },
]

/* ─── PARTNERSHIP CARD ────────────────────────────────────────── */
function PartnershipCard({
    partnership,
    index,
    onClick,
}: {
    partnership: Partnership
    index: number
    onClick: () => void
}) {
    const sc = STATUS_CFG[partnership.status] || STATUS_CFG.proposed
    const unread = partnership.unread_owner + partnership.unread_partner
    const ownerPct = partnership.commission_owner_pct ?? 0
    const partnerPct = partnership.commission_partner_pct ?? 0
    const lastActivity = partnership.last_message_at
        ? formatDistanceToNow(new Date(partnership.last_message_at), {
              addSuffix: true,
              locale: ptBR,
          })
        : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
            {/* Top status bar */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${sc.color}99 50%, transparent 100%)`,
                }}
            />

            <div className="p-5">
                {/* Header: status + unread */}
                <div className="flex items-center justify-between mb-3">
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                        style={{ color: sc.color, background: sc.bg }}
                    >
                        {sc.label}
                    </span>
                    {unread > 0 && (
                        <span
                            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1"
                            style={{
                                background: T.accent,
                                color: '#fff',
                            }}
                        >
                            {unread}
                        </span>
                    )}
                </div>

                {/* Property */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(96,165,250,0.10)', border: `1px solid rgba(96,165,250,0.2)` }}
                    >
                        <Building2 size={14} style={{ color: 'var(--info)', opacity: 0.8 }} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                            {partnership.property_name}
                        </p>
                        {partnership.property_price != null && (
                            <p className="text-[11px] font-mono" style={{ color: T.textMuted }}>
                                {formatCurrency(partnership.property_price)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Owner ↔ Partner */}
                <div
                    className="flex items-center gap-2 mb-3 py-2.5 px-3 rounded-[6px]"
                    style={{ background: T.elevated, border: `1px solid ${T.borderLight}` }}
                >
                    <span className="text-xs font-medium truncate flex-1" style={{ color: T.text }}>
                        {partnership.owner_name}
                    </span>
                    <ArrowLeftRight size={12} style={{ color: T.textDim, flexShrink: 0 }} />
                    <span className="text-xs font-medium truncate flex-1 text-right" style={{ color: T.text }}>
                        {partnership.partner_name}
                    </span>
                </div>

                {/* Commission split */}
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={11} style={{ color: T.textDim }} />
                    <span className="text-[11px] font-mono" style={{ color: T.textMuted }}>
                        Comissão: {ownerPct}% / {partnerPct}%
                    </span>
                </div>

                {/* Lead name */}
                {partnership.lead_name && (
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={11} style={{ color: T.textDim }} />
                        <span className="text-[11px] truncate" style={{ color: T.textMuted }}>
                            Lead: {partnership.lead_name}
                        </span>
                    </div>
                )}

                {/* Last message preview */}
                {partnership.last_message_preview && (
                    <div
                        className="flex items-start gap-2 mb-3 text-[11px] leading-relaxed"
                        style={{ color: T.textDim }}
                    >
                        <MessageSquare size={10} className="flex-shrink-0 mt-0.5 opacity-60" />
                        <span className="line-clamp-2">{partnership.last_message_preview}</span>
                    </div>
                )}

                {/* Footer */}
                <div
                    className="flex items-center justify-between pt-3 text-[10px]"
                    style={{ borderTop: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <div className="flex items-center gap-1">
                        <Clock size={9} className="opacity-60" />
                        <span>
                            {lastActivity || formatDistanceToNow(new Date(partnership.proposed_at), {
                                addSuffix: true,
                                locale: ptBR,
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Ver detalhes</span>
                        <ChevronRight size={10} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

/* ─── EMPTY STATE ─────────────────────────────────────────────── */
function EmptyParcerias() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg p-16 text-center"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            <div
                className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(96,165,250,0.10)' }}
            >
                <Handshake size={28} style={{ color: 'var(--info)', opacity: 0.7 }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: T.text }}>
                Nenhuma parceria encontrada
            </h3>
            <p className="text-sm mb-2 max-w-sm mx-auto" style={{ color: T.textMuted }}>
                Proponha uma parceria na ficha de um imóvel para iniciar uma colaboração comercial com outro corretor.
            </p>
        </motion.div>
    )
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function ParceriasPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('all')

    const statusFilter = tab === 'active'
        ? 'active'
        : tab === 'cancelled'
        ? 'cancelled'
        : tab === 'completed'
        ? 'completed'
        : tab === 'proposed'
        ? 'proposed'
        : undefined

    const { partnerships, isLoading } = usePartnerships({
        status: statusFilter,
    })

    // Client-side search filtering
    const filtered = search
        ? partnerships.filter(
              (p) =>
                  p.property_name.toLowerCase().includes(search.toLowerCase()) ||
                  p.owner_name.toLowerCase().includes(search.toLowerCase()) ||
                  p.partner_name.toLowerCase().includes(search.toLowerCase()) ||
                  (p.lead_name && p.lead_name.toLowerCase().includes(search.toLowerCase()))
          )
        : partnerships

    // KPI aggregations
    const totalActive = partnerships.filter(
        (p) => p.status === 'active' || p.status === 'accepted'
    ).length
    const totalCompleted = partnerships.filter((p) => p.status === 'completed').length
    const totalVolume = partnerships
        .filter((p) => p.status === 'completed' && p.sale_value != null)
        .reduce((sum, p) => sum + (p.sale_value ?? 0), 0)

    return (
        <div className="space-y-6">
            <PageIntelHeader
                moduleLabel="PARCERIAS · COMERCIAL"
                title="Parcerias Comerciais"
                subtitle="Gerencie colaborações, comissões e negociações entre corretores"
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard
                    label="Total Parcerias"
                    value={partnerships.length}
                    icon={<Handshake size={14} />}
                    accent="blue"
                    size="sm"
                />
                <KPICard
                    label="Ativas"
                    value={totalActive}
                    icon={<CheckCircle size={14} />}
                    accent="green"
                    size="sm"
                />
                <KPICard
                    label="Concluídas"
                    value={totalCompleted}
                    icon={<TrendingUp size={14} />}
                    accent="ai"
                    size="sm"
                />
                <KPICard
                    label="Volume Total"
                    value={formatCurrency(totalVolume)}
                    icon={<DollarSign size={14} />}
                    accent="gold"
                    size="sm"
                />
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 min-w-0">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: T.textMuted }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por imóvel, corretor ou lead..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-[6px] text-sm outline-none"
                        style={{
                            background: T.elevated,
                            border: `1px solid ${T.border}`,
                            color: T.text,
                        }}
                    />
                </div>
                <FilterTabs tabs={FILTER_TABS} active={tab} onChange={setTab} />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="rounded-lg p-5 animate-pulse"
                            style={{
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                height: 240,
                            }}
                        />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyParcerias />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map((partnership, i) => (
                            <PartnershipCard
                                key={partnership.id}
                                partnership={partnership}
                                index={i}
                                onClick={() =>
                                    router.push(`/backoffice/parcerias/${partnership.id}`)
                                }
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
