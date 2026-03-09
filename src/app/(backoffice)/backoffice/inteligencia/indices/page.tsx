'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Save, Trash2, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

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
    if (v > 0) return '#34d399'
    if (v < 0) return '#ef4444'
    return '#fbbf24'
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

    const inputClass = "h-8 px-2.5 rounded-lg text-sm outline-none transition-all w-full"
    const inputStyle = { background: 'var(--bo-input-bg)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>Índices IMI</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--bo-text-muted)' }}>Gestão dos índices de mercado proprietários</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={load} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bo-hover)] transition-colors" style={{ background: 'var(--bo-icon-bg)' }}>
                        <RefreshCw size={14} style={{ color: 'var(--bo-text-muted)' }} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={22} style={{ color: 'var(--bo-text-muted)' }} />
                    </div>
                ) : indices.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                        <TrendingUp size={36} style={{ color: 'var(--bo-text-muted)', opacity: 0.4 }} className="mx-auto mb-4" />
                        <p className="text-sm" style={{ color: 'var(--bo-text-muted)' }}>Nenhum índice cadastrado</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--bo-text-muted)' }}>Adicione índices via migração SQL ou painel admin</p>
                    </div>
                ) : (
                    indices.map((idx) => (
                        <div key={idx.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                            {/* Header row */}
                            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--bo-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bo-icon-bg)' }}>
                                        <TrendingUp size={14} style={{ color: 'var(--accent-500)' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: 'var(--bo-text)' }}>{idx.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{idx.region ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                        style={idx.is_published
                                            ? { color: '#34d399', background: 'rgba(52,211,153,0.1)' }
                                            : { color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }
                                        }
                                    >
                                        {idx.is_published ? 'Publicado' : 'Rascunho'}
                                    </span>
                                    <button onClick={() => togglePublish(idx.id, idx.is_published)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bo-hover)]">
                                        {idx.is_published ? <EyeOff size={14} style={{ color: 'var(--bo-text-muted)' }} /> : <Eye size={14} style={{ color: 'var(--accent-500)' }} />}
                                    </button>
                                    <button onClick={() => { setEditingId(editingId === idx.id ? null : idx.id); setEditForm(idx) }} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bo-hover)]">
                                        <Save size={14} style={{ color: 'var(--bo-text-muted)' }} />
                                    </button>
                                    <button onClick={() => deleteIndex(idx.id)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                                        <Trash2 size={14} style={{ color: '#ef4444' }} />
                                    </button>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: 'var(--bo-border)' }}>
                                {[
                                    { label: 'Valor Atual', val: idx.value.toFixed(1) },
                                    { label: '1 Mês', val: formatVar(idx.variation_1m), color: varColor(idx.variation_1m) },
                                    { label: '3 Meses', val: formatVar(idx.variation_3m), color: varColor(idx.variation_3m) },
                                    { label: '12 Meses', val: formatVar(idx.variation_12m), color: varColor(idx.variation_12m) },
                                ].map(m => (
                                    <div key={m.label} className="p-4 text-center" style={{ borderColor: 'var(--bo-border)' }}>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--bo-text-muted)' }}>{m.label}</p>
                                        <p className="font-bold text-base" style={{ color: (m as { label: string; val: string; color?: string }).color ?? 'var(--bo-text)' }}>{m.val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Edit form */}
                            {editingId === idx.id && (
                                <div className="p-5 border-t space-y-4" style={{ borderColor: 'var(--bo-border)', background: 'var(--bo-active-bg)' }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Nome</label>
                                            <input className={inputClass} style={inputStyle} value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Região</label>
                                            <input className={inputClass} style={inputStyle} value={editForm.region ?? ''} onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Valor Atual</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.value ?? 0} onChange={e => setEditForm(p => ({ ...p, value: parseFloat(e.target.value) }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Var. 1 Mês (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_1m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_1m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Var. 3 Meses (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_3m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_3m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Var. 12 Meses (%)</label>
                                            <input type="number" step="0.1" className={inputClass} style={inputStyle} value={editForm.variation_12m ?? ''} onChange={e => setEditForm(p => ({ ...p, variation_12m: parseFloat(e.target.value) || null }))} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--bo-text-muted)' }}>Descrição</label>
                                        <textarea className="w-full px-2.5 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} rows={2} value={editForm.description ?? ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setEditingId(null)} className="h-8 px-4 rounded-lg text-sm" style={{ color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }}>Cancelar</button>
                                        <button onClick={() => saveEdit(idx.id)} disabled={saving} className="flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--accent-500)' }}>
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
