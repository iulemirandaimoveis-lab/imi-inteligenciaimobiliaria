'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Plus, Save, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

const CATEGORIES = ['performance', 'liquidez', 'preco', 'oferta', 'macro']
const TRENDS = [
    { value: 'up', label: 'Alta', icon: TrendingUp },
    { value: 'down', label: 'Queda', icon: TrendingDown },
    { value: 'stable', label: 'Estável', icon: Minus },
]

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IndicadoresPage() {
    const [indicators, setIndicators] = useState<Indicator[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Indicator>>({})
    const [saving, setSaving] = useState(false)
    const [addingNew, setAddingNew] = useState(false)
    const [newForm, setNewForm] = useState<{ metric_name: string; value: string; unit: string; category: string; description: string; trend: 'up' | 'down' | 'stable'; sort_order: number }>({ metric_name: '', value: '', unit: '', category: '', description: '', trend: 'stable', sort_order: 0 })

    async function load() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase.from('market_indicators').select('*').order('sort_order', { ascending: true })
        setIndicators(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function saveEdit(id: string) {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('market_indicators').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', id)
        setSaving(false)
        setEditingId(null)
        load()
    }

    async function deleteIndicator(id: string) {
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

    async function addIndicator() {
        setSaving(true)
        const supabase = createClient()
        await supabase.from('market_indicators').insert({
            metric_name: newForm.metric_name,
            value: newForm.value,
            unit: newForm.unit || null,
            category: newForm.category || null,
            description: newForm.description || null,
            trend: newForm.trend,
            sort_order: Number(newForm.sort_order),
        })
        setSaving(false)
        setAddingNew(false)
        setNewForm({ metric_name: '', value: '', unit: '', category: '', description: '', trend: 'stable', sort_order: 0 })
        load()
    }

    const inputClass = "h-8 px-2.5 rounded-lg text-sm outline-none transition-all w-full"
    const inputStyle = { background: 'var(--bo-input-bg)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>Indicadores de Mercado</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--bo-text-muted)' }}>KPIs do dashboard público — editáveis inline</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={load} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'var(--bo-icon-bg)' }}>
                        <RefreshCw size={14} style={{ color: 'var(--bo-text-muted)' }} />
                    </button>
                    <button
                        onClick={() => setAddingNew(true)}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' }}
                    >
                        <Plus size={15} /> Novo
                    </button>
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={22} style={{ color: 'var(--bo-text-muted)' }} />
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                {['Métrica', 'Valor', 'Unidade', 'Categoria', 'Tendência', 'Atualizado', 'Ações'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--bo-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Add new row */}
                            {addingNew && (
                                <tr style={{ borderBottom: '1px solid var(--bo-border-subtle)', background: 'var(--bo-active-bg)' }}>
                                    <td className="px-4 py-3"><input className={inputClass} style={inputStyle} placeholder="Nome da métrica" value={newForm.metric_name} onChange={e => setNewForm(p => ({ ...p, metric_name: e.target.value }))} /></td>
                                    <td className="px-4 py-3"><input className={inputClass} style={inputStyle} placeholder="Ex: +15,2%" value={newForm.value} onChange={e => setNewForm(p => ({ ...p, value: e.target.value }))} /></td>
                                    <td className="px-4 py-3"><input className={inputClass} style={inputStyle} placeholder="R$/m²" value={newForm.unit} onChange={e => setNewForm(p => ({ ...p, unit: e.target.value }))} /></td>
                                    <td className="px-4 py-3">
                                        <select className={inputClass} style={inputStyle} value={newForm.category} onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}>
                                            <option value="">—</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select className={inputClass} style={inputStyle} value={newForm.trend} onChange={e => setNewForm(p => ({ ...p, trend: e.target.value as 'up' | 'down' | 'stable' }))}>
                                            {TRENDS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Agora</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button onClick={addIndicator} disabled={saving || !newForm.metric_name || !newForm.value} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-40">
                                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} style={{ color: '#34d399' }} />}
                                            </button>
                                            <button onClick={() => setAddingNew(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                                                <Trash2 size={13} style={{ color: '#ef4444' }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {indicators.map((ind) => (
                                <tr key={ind.id} style={{ borderBottom: '1px solid var(--bo-border-subtle)' }} className="hover:bg-white/[0.02] transition-colors">
                                    {editingId === ind.id ? (
                                        <>
                                            <td className="px-4 py-3"><input className={inputClass} style={inputStyle} value={editForm.metric_name ?? ''} onChange={e => setEditForm(p => ({ ...p, metric_name: e.target.value }))} /></td>
                                            <td className="px-4 py-3"><input className={inputClass} style={inputStyle} value={editForm.value ?? ''} onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))} /></td>
                                            <td className="px-4 py-3"><input className={inputClass} style={inputStyle} value={editForm.unit ?? ''} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} /></td>
                                            <td className="px-4 py-3">
                                                <select className={inputClass} style={inputStyle} value={editForm.category ?? ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                                                    <option value="">—</option>
                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select className={inputClass} style={inputStyle} value={editForm.trend ?? 'stable'} onChange={e => setEditForm(p => ({ ...p, trend: e.target.value as 'up' | 'down' | 'stable' }))}>
                                                    {TRENDS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3"><span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>Agora</span></td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => saveEdit(ind.id)} disabled={saving} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 disabled:opacity-40">
                                                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} style={{ color: '#34d399' }} />}
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                                                        <Minus size={13} style={{ color: 'var(--bo-text-muted)' }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-4"><p className="font-medium text-sm" style={{ color: 'var(--bo-text)' }}>{ind.metric_name}</p></td>
                                            <td className="px-4 py-4"><span className="font-bold" style={{ color: 'var(--bo-text)' }}>{ind.value}</span></td>
                                            <td className="px-4 py-4"><span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{ind.unit ?? '—'}</span></td>
                                            <td className="px-4 py-4"><span className="text-xs capitalize" style={{ color: 'var(--bo-text-muted)' }}>{ind.category ?? '—'}</span></td>
                                            <td className="px-4 py-4">
                                                {ind.trend === 'up' && <span className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> Alta</span>}
                                                {ind.trend === 'down' && <span className="text-xs text-red-400 flex items-center gap-1"><TrendingDown size={12} /> Queda</span>}
                                                {ind.trend === 'stable' && <span className="text-xs text-amber-400 flex items-center gap-1"><Minus size={12} /> Estável</span>}
                                            </td>
                                            <td className="px-4 py-4"><span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{formatDate(ind.updated_at)}</span></td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setEditingId(ind.id); setEditForm(ind) }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                                                        <Save size={13} style={{ color: 'var(--bo-text-muted)' }} />
                                                    </button>
                                                    <button onClick={() => deleteIndicator(ind.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                                                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
