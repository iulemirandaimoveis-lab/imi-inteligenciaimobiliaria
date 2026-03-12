'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp, TrendingDown, Minus, Plus, Save, Trash2,
    Loader2, RefreshCw, Edit2, X, BarChart3, Gauge,
    Tag, DollarSign, Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'

type Indicator = {
    id: string
    metric_name: string
    value: string
    unit: string | null
    category: string | null
    description: string | null
    trend: 'up' | 'down' | 'stable'
    sort_order: number
    updated_at: string
}

type NewForm = {
    metric_name: string
    value: string
    unit: string
    category: string
    description: string
    trend: 'up' | 'down' | 'stable'
    sort_order: number
}

const CATEGORIES = ['performance', 'liquidez', 'preco', 'oferta', 'macro']

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
    performance: { label: 'Performance',  color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  Icon: BarChart3 },
    liquidez:    { label: 'Liquidez',     color: '#10B981', bg: 'rgba(16,185,129,0.10)',  Icon: Gauge },
    preco:       { label: 'Preço',        color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  Icon: DollarSign },
    oferta:      { label: 'Oferta',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',  Icon: Package },
    macro:       { label: 'Macro',        color: '#EC4899', bg: 'rgba(236,72,153,0.10)',  Icon: TrendingUp },
}

const TREND_META = {
    up:     { label: 'Alta',    color: getStatusConfig('convertido').dot, Icon: TrendingUp },
    down:   { label: 'Queda',   color: getStatusConfig('perdido').dot,    Icon: TrendingDown },
    stable: { label: 'Estável', color: getStatusConfig('morno').dot,      Icon: Minus },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const inputStyle = {
    background: 'var(--bo-surface)',
    border: '1px solid var(--bo-border)',
    color: 'var(--bo-text)',
}
const inputClass = "h-9 px-3 rounded-xl text-sm outline-none transition-all w-full focus:ring-1 focus:ring-[var(--bo-accent)]"

// ── Indicator Card — view mode ───────────────────────────────────
function IndicatorCard({
    ind,
    onEdit,
    onDelete,
}: {
    ind: Indicator
    onEdit: (ind: Indicator) => void
    onDelete: (id: string) => void
}) {
    const cm = CATEGORY_META[ind.category ?? ''] ?? CATEGORY_META.performance
    const tm = TREND_META[ind.trend] ?? TREND_META.stable
    const CatIcon = cm.Icon
    const TrendIcon = tm.Icon

    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-3 group transition-all hover-card"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cm.bg }}
                    >
                        <CatIcon size={14} style={{ color: cm.color }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: cm.color }}>{cm.label}</p>
                        <p className="text-xs font-medium truncate" style={{ color: T.textMuted }}>
                            {ind.metric_name}
                        </p>
                    </div>
                </div>
                {/* Actions — visible on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(ind)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'var(--bo-hover)' }}
                    >
                        <Edit2 size={11} style={{ color: T.textMuted }} />
                    </button>
                    <button
                        onClick={() => onDelete(ind.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                        style={{ background: 'var(--bo-hover)' }}
                    >
                        <Trash2 size={11} color="#EF4444" />
                    </button>
                </div>
            </div>

            {/* Value */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold leading-none" style={{ color: T.text }}>
                        {ind.value}
                    </p>
                    {ind.unit && (
                        <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>{ind.unit}</p>
                    )}
                </div>
                <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                    style={{ background: `${tm.color}18`, color: tm.color }}
                >
                    <TrendIcon size={11} />
                    {tm.label}
                </span>
            </div>

            {/* Description + date */}
            {ind.description && (
                <p className="text-[11px] line-clamp-2" style={{ color: T.textMuted }}>
                    {ind.description}
                </p>
            )}
            <p className="text-[10px]" style={{ color: T.textDim }}>
                Atualizado {formatDate(ind.updated_at)}
            </p>
        </div>
    )
}

// ── Indicator Edit Card ──────────────────────────────────────────
function IndicatorEditCard({
    initial,
    onSave,
    onCancel,
    saving,
    isNew,
}: {
    initial: Partial<Indicator> & { metric_name: string; value: string; trend: 'up' | 'down' | 'stable' }
    onSave: (data: typeof initial) => void
    onCancel: () => void
    saving: boolean
    isNew?: boolean
}) {
    const [form, setForm] = useState(initial)
    const upd = (key: string, val: string | number) => setForm(p => ({ ...p, [key]: val }))

    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'var(--bo-active-bg)', border: `1px solid var(--bo-border-gold)` }}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: T.text }}>
                    {isNew ? 'Novo Indicador' : 'Editar Indicador'}
                </p>
                <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--bo-hover)' }}>
                    <X size={13} style={{ color: T.textMuted }} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Nome da Métrica *</label>
                    <input className={inputClass} style={inputStyle} placeholder="Ex: Valorização anual" value={form.metric_name ?? ''} onChange={e => upd('metric_name', e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Valor *</label>
                    <input className={inputClass} style={inputStyle} placeholder="Ex: +15,2%" value={form.value ?? ''} onChange={e => upd('value', e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Unidade</label>
                    <input className={inputClass} style={inputStyle} placeholder="R$/m², %, pts" value={form.unit ?? ''} onChange={e => upd('unit', e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Categoria</label>
                    <select className={inputClass} style={inputStyle} value={form.category ?? ''} onChange={e => upd('category', e.target.value)}>
                        <option value="">—</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c]?.label ?? c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Tendência</label>
                    <select className={inputClass} style={inputStyle} value={form.trend ?? 'stable'} onChange={e => upd('trend', e.target.value)}>
                        <option value="up">↑ Alta</option>
                        <option value="down">↓ Queda</option>
                        <option value="stable">→ Estável</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] font-medium mb-1 block" style={{ color: T.textMuted }}>Descrição</label>
                    <input className={inputClass} style={inputStyle} placeholder="Contextualização opcional" value={form.description ?? ''} onChange={e => upd('description', e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => onSave(form as any)}
                    disabled={saving || !form.metric_name || !form.value}
                    className="flex-1 h-9 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
                    style={{ background: 'var(--bo-accent)' }}
                >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isNew ? 'Criar' : 'Salvar'}
                </button>
            </div>
        </div>
    )
}

// ── Main page ────────────────────────────────────────────────────
export default function IndicadoresPage() {
    const [indicators, setIndicators] = useState<Indicator[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [addingNew, setAddingNew] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    const emptyNew: NewForm = { metric_name: '', value: '', unit: '', category: '', description: '', trend: 'stable', sort_order: 0 }

    async function load() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase.from('market_indicators').select('*').order('sort_order', { ascending: true })
        setIndicators(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function handleSaveEdit(id: string, form: Partial<Indicator>) {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('market_indicators')
            .update({ ...form, updated_at: new Date().toISOString() })
            .eq('id', id)
        setSaving(false)
        setEditingId(null)
        toast.success('Indicador atualizado')
        load()
    }

    async function handleDelete(id: string) {
        toast.warning('Remover este indicador?', {
            action: {
                label: 'Sim, remover',
                onClick: async () => {
                    const supabase = createClient()
                    await supabase.from('market_indicators').delete().eq('id', id)
                    toast.success('Indicador removido')
                    load()
                },
            },
            duration: 6000,
        })
    }

    async function handleAdd(form: NewForm) {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('market_indicators').insert({
            metric_name: form.metric_name,
            value: form.value,
            unit: form.unit || null,
            category: form.category || null,
            description: form.description || null,
            trend: form.trend,
            sort_order: Number(form.sort_order),
        })
        setSaving(false)
        setAddingNew(false)
        toast.success('Indicador criado')
        load()
    }

    const filtered = categoryFilter === 'all'
        ? indicators
        : indicators.filter(i => i.category === categoryFilter)

    const editingIndicator = editingId ? indicators.find(i => i.id === editingId) : null

    return (
        <div className="space-y-5">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="INTELIGÊNCIA DE MERCADO"
                title="Indicadores"
                subtitle="KPIs do dashboard público — dados de mercado editáveis inline"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={load}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            <RefreshCw size={14} style={{ color: T.textMuted }} />
                        </button>
                        <button
                            onClick={() => { setAddingNew(true); setEditingId(null) }}
                            className="bo-btn bo-btn-primary"
                            style={{ background: 'var(--bo-accent)' }}
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Novo</span>
                        </button>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <KPICard label="Total" value={loading ? '—' : String(indicators.length)} icon={<BarChart3 size={14} />} size="sm" />
                <KPICard label="Em Alta" value={loading ? '—' : String(indicators.filter(i => i.trend === 'up').length)} icon={<TrendingUp size={14} />} accent="green" size="sm" />
                <KPICard label="Em Queda" value={loading ? '—' : String(indicators.filter(i => i.trend === 'down').length)} icon={<TrendingDown size={14} />} accent="hot" size="sm" />
            </div>

            {/* Category filter tabs */}
            <div className="chip-scroll-row pb-1">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className="flex-shrink-0 h-8 px-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                        background: categoryFilter === 'all' ? 'var(--bo-accent)' : T.elevated,
                        color: categoryFilter === 'all' ? 'white' : T.textMuted,
                        border: `1px solid ${categoryFilter === 'all' ? 'transparent' : T.border}`,
                    }}
                >
                    Todos ({indicators.length})
                </button>
                {CATEGORIES.map(cat => {
                    const cm = CATEGORY_META[cat]
                    const count = indicators.filter(i => i.category === cat).length
                    if (count === 0) return null
                    return (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className="flex-shrink-0 h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                            style={{
                                background: categoryFilter === cat ? cm.bg : T.elevated,
                                color: categoryFilter === cat ? cm.color : T.textMuted,
                                border: `1px solid ${categoryFilter === cat ? `${cm.color}40` : T.border}`,
                            }}
                        >
                            {cm.label} ({count})
                        </button>
                    )
                })}
            </div>

            {/* New indicator form */}
            {addingNew && (
                <IndicatorEditCard
                    initial={emptyNew}
                    onSave={(form) => handleAdd(form as NewForm)}
                    onCancel={() => setAddingNew(false)}
                    saving={saving}
                    isNew
                />
            )}

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl p-4 animate-pulse"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, height: 160 }}>
                            <div className="flex gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl" style={{ background: 'var(--bo-hover)' }} />
                                <div className="flex-1">
                                    <div className="h-2.5 rounded mb-1.5" style={{ background: 'var(--bo-hover)', width: '50%' }} />
                                    <div className="h-2 rounded" style={{ background: 'var(--bo-hover)', width: '70%' }} />
                                </div>
                            </div>
                            <div className="h-8 rounded mb-2" style={{ background: 'var(--bo-hover)', width: '60%' }} />
                            <div className="h-2 rounded" style={{ background: 'var(--bo-hover)', width: '40%' }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    <BarChart3 size={36} style={{ color: T.textDim }} className="mb-3" />
                    <p className="text-sm font-semibold" style={{ color: T.text }}>
                        {categoryFilter === 'all' ? 'Nenhum indicador' : `Nenhum indicador em "${CATEGORY_META[categoryFilter]?.label}"`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                        Adicione indicadores de mercado para exibir no dashboard
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map(ind => (
                        editingId === ind.id && editingIndicator ? (
                            <IndicatorEditCard
                                key={ind.id}
                                initial={editingIndicator}
                                onSave={(form) => handleSaveEdit(ind.id, form as Partial<Indicator>)}
                                onCancel={() => setEditingId(null)}
                                saving={saving}
                            />
                        ) : (
                            <IndicatorCard
                                key={ind.id}
                                ind={ind}
                                onEdit={(i) => { setEditingId(i.id); setAddingNew(false) }}
                                onDelete={handleDelete}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
