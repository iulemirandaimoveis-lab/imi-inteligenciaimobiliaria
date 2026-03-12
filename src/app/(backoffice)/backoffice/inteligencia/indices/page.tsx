'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Minus, Save, Trash2, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, StatusBadge } from '@/app/(backoffice)/components/ui'

type MarketIndex = {
    id: string
    name: string
    value: number
    base_date: string
    current_date: string
    variation_1m: number | null
    variation_3m: number | null
    variation_12m: number | null
    description: string | null
    methodology: string | null
    region: string | null
    is_published: boolean
    updated_at: string
}

function formatVar(v: number | null) {
    if (v === null) return '—'
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

function varColor(v: number | null) {
    if (v === null) return 'var(--bo-text-muted)'
    if (v > 0) return getStatusConfig('convertido').dot
    if (v < 0) return getStatusConfig('perdido').dot
    return getStatusConfig('morno').dot
}

function VarIcon({ v }: { v: number | null }) {
    if (v === null) return <Minus size={11} style={{ color: 'var(--bo-text-muted)' }} />
    if (v > 0) return <TrendingUp size={11} style={{ color: getStatusConfig('convertido').dot }} />
    if (v < 0) return <TrendingDown size={11} style={{ color: getStatusConfig('perdido').dot }} />
    return <Minus size={11} style={{ color: getStatusConfig('morno').dot }} />
}

export default function IndicesBackofficePage() {
    const [indices, setIndices] = useState<MarketIndex[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<MarketIndex>>({})
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase.from('market_indices').select('*').order('name', { ascending: true })
        setIndices(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function saveEdit(id: string) {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('market_indices').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', id)
        setSaving(false)
        setEditingId(null)
        toast.success('Índice atualizado')
        load()
    }

    async function togglePublish(id: string, current: boolean) {
        const supabase = createClient()
        await supabase.from('market_indices').update({ is_published: !current }).eq('id', id)
        load()
    }

    async function deleteIndex(id: string) {
        toast.warning('Remover este índice de mercado?', {
            action: {
                label: 'Sim, remover',
                onClick: async () => {
                    const supabase = createClient()
                    await supabase.from('market_indices').delete().eq('id', id)
                    toast.success('Índice removido')
                    load()
                },
            },
            duration: 6000,
        })
    }

    const inputClass = "h-9 px-3 rounded-xl text-sm outline-none transition-all w-full"
    const inputStyle = { background: T.surface ?? T.elevated, border: `1px solid ${T.border}`, color: T.text }

    const published = indices.filter(i => i.is_published).length
    const drafts = indices.filter(i => !i.is_published).length

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="INTELIGÊNCIA DE MERCADO"
                title="Índices IMI"
                subtitle="Gestão dos índices de mercado proprietários — performance e variações"
                actions={
                    <button
                        onClick={load}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <RefreshCw size={14} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
                <KPICard
                    label="Total Índices"
                    value={loading ? '—' : indices.length}
                    icon={<TrendingUp size={14} />}
                    accent="blue"
                    size="sm"
                />
                <KPICard
                    label="Publicados"
                    value={loading ? '—' : published}
                    icon={<Eye size={14} />}
                    accent="green"
                    size="sm"
                    delta={indices.length > 0 ? Math.round((published / indices.length) * 100) : 0}
                    deltaLabel="publicados"
                />
                <KPICard
                    label="Rascunhos"
                    value={loading ? '—' : drafts}
                    icon={<EyeOff size={14} />}
                    accent="warm"
                    size="sm"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl" style={{ background: 'var(--bo-hover)' }} />
                                    <div>
                                        <div className="h-3.5 rounded mb-1.5" style={{ background: 'var(--bo-hover)', width: 120 }} />
                                        <div className="h-2.5 rounded" style={{ background: 'var(--bo-hover)', width: 80 }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="h-12 rounded-xl" style={{ background: 'var(--bo-hover)' }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : indices.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <TrendingUp size={40} style={{ color: T.textMuted, opacity: 0.25 }} className="mx-auto mb-4" />
                        <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>Nenhum índice cadastrado</p>
                        <p className="text-xs" style={{ color: T.textMuted }}>Adicione índices via migração SQL ou painel admin</p>
                    </div>
                ) : (
                    indices.map((idx) => (
                        <div key={idx.id} className="rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            {/* Header row */}
                            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                                        <TrendingUp size={15} style={{ color: '#3B82F6' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: T.text }}>{idx.name}</p>
                                        <p className="text-xs" style={{ color: T.textMuted }}>{idx.region ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge statusKey={idx.is_published ? 'publicado' : 'rascunho'} size="xs" />
                                    <button
                                        onClick={() => togglePublish(idx.id, idx.is_published)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                    >
                                        {idx.is_published
                                            ? <EyeOff size={14} style={{ color: T.textMuted }} />
                                            : <Eye size={14} style={{ color: 'var(--bo-accent)' }} />
                                        }
                                    </button>
                                    <button
                                        onClick={() => { setEditingId(editingId === idx.id ? null : idx.id); setEditForm(idx) }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                                        style={{ background: editingId === idx.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${editingId === idx.id ? '#3B82F6' : T.border}` }}
                                    >
                                        <Save size={14} style={{ color: editingId === idx.id ? '#3B82F6' : T.textMuted }} />
                                    </button>
                                    <button
                                        onClick={() => deleteIndex(idx.id)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                    >
                                        <Trash2 size={14} style={{ color: '#ef4444' }} />
                                    </button>
                                </div>
                            </div>

                            {/* Metrics — Bloomberg-style data row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: T.border }}>
                                {[
                                    { label: 'Valor Atual', val: idx.value.toFixed(1), v: null as number | null, isBase: true },
                                    { label: '1 Mês', val: formatVar(idx.variation_1m), v: idx.variation_1m, isBase: false },
                                    { label: '3 Meses', val: formatVar(idx.variation_3m), v: idx.variation_3m, isBase: false },
                                    { label: '12 Meses', val: formatVar(idx.variation_12m), v: idx.variation_12m, isBase: false },
                                ].map(m => (
                                    <div key={m.label} className="p-4 text-center" style={{ borderColor: T.border }}>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{m.label}</p>
                                        <div className="flex items-center justify-center gap-1">
                                            {!m.isBase && <VarIcon v={m.v} />}
                                            <p className="font-bold text-base" style={{ color: m.isBase ? T.text : varColor(m.v) }}>{m.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Edit form */}
                            {editingId === idx.id && (
                                <div className="p-5 space-y-4" style={{ borderTop: `1px solid ${T.border}`, background: 'var(--bo-active-bg)' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Editar Índice</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Nome</label>
                                            <input className={inputClass} style={inputStyle} value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Região</label>
                                            <input className={inputClass} style={inputStyle} value={editForm.region ?? ''} onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Valor Atual</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.value ?? 0} onChange={e => setEditForm(p => ({ ...p, value: parseFloat(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Var. 1 Mês (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_1m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_1m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Var. 3 Meses (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_3m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_3m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Var. 12 Meses (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_12m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_12m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Descrição</label>
                                        <textarea className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} rows={2} value={editForm.description ?? ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="h-10 px-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                                            style={{ color: T.textMuted, background: T.elevated, border: `1px solid ${T.border}` }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => saveEdit(idx.id)}
                                            disabled={saving}
                                            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                                            style={{ background: 'var(--bo-accent)' }}
                                        >
                                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
