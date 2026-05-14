'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Handshake, ArrowLeftRight, Search, MessageSquare,
    Building2, DollarSign, CheckCircle, Clock,
    XCircle, TrendingUp, Users, ChevronRight, X, Loader2, Send,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePartnerships, type Partnership } from '@/hooks/use-partnerships'
import { PageIntelHeader, KPICard, FilterTabs, type FilterTab } from '../../components/ui'
import { T } from '../../lib/theme'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'


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

/* ─── NEW PARTNERSHIP MODAL ───────────────────────────────────── */
function NewPartnershipModal({
    prefill,
    onClose,
    onCreated,
}: {
    prefill: { property_id: string; property_name: string; owner_broker_id: string }
    onClose: () => void
    onCreated: (id: string) => void
}) {
    const [message, setMessage] = useState('')
    const [ownerPct, setOwnerPct] = useState(45)
    const [partnerPct, setPartnerPct] = useState(45)
    const [propertyPrice, setPropertyPrice] = useState<number>(0)
    const [submitting, setSubmitting] = useState(false)
    const [loadingPrice, setLoadingPrice] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        supabase.from('developments').select('price_from').eq('id', prefill.property_id).single()
            .then(({ data }) => {
                if (data?.price_from) setPropertyPrice(Number(data.price_from))
                setLoadingPrice(false)
            })
    }, [prefill.property_id])

    const handleSubmit = async () => {
        if (!message.trim()) { toast.error('Escreva uma mensagem para o corretor'); return }
        if (propertyPrice <= 0) { toast.error('Preço do imóvel inválido'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/partnerships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: prefill.property_id,
                    property_name: prefill.property_name,
                    property_price: propertyPrice,
                    owner_broker_id: prefill.owner_broker_id,
                    message: message.trim(),
                    commission_owner_pct: ownerPct,
                    commission_partner_pct: partnerPct,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Erro ao criar parceria')
            }
            const json = await res.json()
            toast.success('Parceria proposta com sucesso!')
            onCreated(json.data?.id || json.id)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao criar parceria')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-xl overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.15)' }}>
                            <Handshake size={18} style={{ color: 'var(--gold, #C8A44A)' }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: T.text }}>Propor Parceria</h3>
                            <p className="text-[11px]" style={{ color: T.textMuted }}>Inicie uma colaboração comercial</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer' }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Property info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: T.surface, border: `1px solid ${T.borderLight}` }}>
                        <Building2 size={16} style={{ color: 'var(--info)', flexShrink: 0 }} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{prefill.property_name}</p>
                            <p className="text-[11px] font-mono" style={{ color: T.textMuted }}>
                                {loadingPrice ? '...' : formatCurrency(propertyPrice)}
                            </p>
                        </div>
                    </div>

                    {/* Commission split */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: T.textDim }}>
                            Comissão (Proprietário / Parceiro)
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <input
                                    type="range" min={5} max={85} value={ownerPct}
                                    onChange={(e) => { const v = Number(e.target.value); setOwnerPct(v); setPartnerPct(90 - v) }}
                                    className="w-full accent-[var(--gold,#C8A44A)]"
                                />
                            </div>
                            <span className="text-sm font-mono font-bold min-w-[90px] text-center" style={{ color: T.text }}>
                                {ownerPct}% / {partnerPct}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                            <span>Proprietário: {ownerPct}%</span>
                            <span style={{ color: 'var(--text-gold, #C8A44A)', fontWeight: 600 }}>IMI: 10%</span>
                            <span>Parceiro: {partnerPct}%</span>
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: T.textDim }}>
                            Mensagem inicial
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Olá, gostaria de propor uma parceria neste imóvel..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full rounded-lg p-3 text-sm outline-none resize-none"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                    <button
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !message.trim() || loadingPrice}
                        className="h-9 px-5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', cursor: submitting ? 'wait' : 'pointer' }}
                    >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Enviar Proposta
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function ParceriasPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('all')

    // Handle ?new=1 query params from property detail "Propor Parceria" button
    const [showNewModal, setShowNewModal] = useState(false)
    const [prefill, setPrefill] = useState<{ property_id: string; property_name: string; owner_broker_id: string } | null>(null)

    useEffect(() => {
        if (searchParams.get('new') === '1') {
            const pid = searchParams.get('property_id')
            const pname = searchParams.get('property_name')
            const obid = searchParams.get('owner_broker_id')
            if (pid && pname && obid) {
                setPrefill({ property_id: pid, property_name: pname, owner_broker_id: obid })
                setShowNewModal(true)
            }
        }
    }, [searchParams])

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

    const handleCloseModal = useCallback(() => {
        setShowNewModal(false)
        setPrefill(null)
        router.replace('/backoffice/parcerias')
    }, [router])

    const handleCreated = useCallback((id: string) => {
        setShowNewModal(false)
        setPrefill(null)
        router.push(`/backoffice/parcerias/${id}`)
    }, [router])

    return (
        <div className="space-y-6">
            {/* New Partnership Modal */}
            <AnimatePresence>
                {showNewModal && prefill && (
                    <NewPartnershipModal
                        prefill={prefill}
                        onClose={handleCloseModal}
                        onCreated={handleCreated}
                    />
                )}
            </AnimatePresence>

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
