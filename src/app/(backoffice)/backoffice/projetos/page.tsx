'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Building2, Plus, MapPin, TrendingUp, Users, DollarSign, Loader2, X } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

interface Projeto {
    id: string
    nome: string
    tipo: string | null
    descricao: string | null
    cidade: string | null
    estado: string | null
    status: string
    fase: string | null
    unidades: number
    unidades_vendidas: number
    area_total_m2: number | null
    vgv: number
    imagem_url: string | null
    data_lancamento: string | null
    data_entrega_prev: string | null
    created_at: string
}

const STATUS_CFG: Record<string, { l: string; color: string }> = {
    estruturacao: { l: 'Estruturação', color: 'var(--bo-accent)' },
    lancamento: { l: 'Lançamento', color: '#10B981' },
    obras: { l: 'Em Obras', color: '#F59E0B' },
    pronto: { l: 'Pronto', color: '#22C55E' },
}

export default function ProjetosPage() {
    const [projetos, setProjetos] = useState<Projeto[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        nome: '', tipo: '', descricao: '', cidade: '', estado: 'PE',
        status: 'estruturacao', fase: '', unidades: 0, vgv: 0, area_total_m2: 0,
    })

    const fetchProjetos = useCallback(async () => {
        setLoading(true)
        try {
            const url = filtro === 'todos' ? '/api/projetos' : `/api/projetos?status=${filtro}`
            const res = await fetch(url)
            const data = await res.json()
            setProjetos(Array.isArray(data) ? data : [])
        } catch { setProjetos([]) }
        setLoading(false)
    }, [filtro])

    useEffect(() => { fetchProjetos() }, [fetchProjetos])

    const fmtCurrency = (v: number) => {
        if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(0)}M`
        if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`
        return `R$ ${v.toLocaleString('pt-BR')}`
    }

    const totalVGV = projetos.reduce((s, p) => s + Number(p.vgv || 0), 0)
    const totalUnidades = projetos.reduce((s, p) => s + (p.unidades || 0), 0)
    const totalVendidas = projetos.reduce((s, p) => s + (p.unidades_vendidas || 0), 0)
    const taxaMedia = totalUnidades > 0 ? Math.round((totalVendidas / totalUnidades) * 100) : 0

    const handleCreate = async () => {
        if (!form.nome) return
        setSaving(true)
        try {
            await fetch('/api/projetos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: form.nome,
                    tipo: form.tipo || null,
                    descricao: form.descricao || null,
                    cidade: form.cidade || null,
                    estado: form.estado || null,
                    status: form.status,
                    fase: form.fase || null,
                    unidades: form.unidades,
                    vgv: form.vgv,
                    area_total_m2: form.area_total_m2 || null,
                }),
            })
            setShowModal(false)
            setForm({ nome: '', tipo: '', descricao: '', cidade: '', estado: 'PE', status: 'estruturacao', fase: '', unidades: 0, vgv: 0, area_total_m2: 0 })
            fetchProjetos()
        } catch { /* ignore */ }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <PageIntelHeader
                title="Projetos & Empreendimentos"
                subtitle="Portfólio de desenvolvimentos ativos"
                actions={
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 h-11 px-5 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition"
                        style={{ background: T.accent }}>
                        <Plus size={16} /> Novo Projeto
                    </button>
                }
            />

            <div className="space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                        { l: 'VGV Total Portfólio', v: fmtCurrency(totalVGV), icon: DollarSign, color: 'var(--bo-accent)' },
                        { l: 'Total de Unidades', v: totalUnidades, icon: Building2, color: 'var(--bo-accent)' },
                        { l: 'Unidades Vendidas', v: totalVendidas, icon: Users, color: '#10B981' },
                        { l: 'Taxa Média de Vendas', v: `${taxaMedia}%`, icon: TrendingUp, color: '#8B5CF6' },
                    ].map(kpi => {
                        const Icon = kpi.icon
                        return (
                            <div key={kpi.l} className="rounded-2xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                    style={{ backgroundColor: `${kpi.color}18` }}>
                                    <Icon size={18} style={{ color: kpi.color }} />
                                </div>
                                <p className="text-2xl font-bold" style={{ color: T.text }}>{kpi.v}</p>
                                <p className="text-[10px] font-medium mt-0.5 uppercase tracking-widest" style={{ color: T.textMuted }}>{kpi.l}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Filtros */}
                <div className="flex gap-2 overflow-x-auto">
                    {['todos', 'estruturacao', 'lancamento', 'obras', 'pronto'].map(s => (
                        <button key={s} onClick={() => setFiltro(s)}
                            className="h-8 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-colors"
                            style={{
                                background: filtro === s ? T.elevated : T.surface,
                                color: filtro === s ? T.text : T.textMuted,
                                border: `1px solid ${filtro === s ? T.accent : T.border}`,
                            }}>
                            {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.l || s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={32} style={{ color: T.accent }} />
                    </div>
                ) : projetos.length === 0 ? (
                    <div className="p-16 text-center rounded-2xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: T.surface }}>
                            <Building2 size={28} style={{ color: T.textMuted, opacity: 0.5 }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: T.text }}>Nenhum projeto encontrado</h3>
                        <p className="text-sm mb-6" style={{ color: T.textMuted }}>Crie um novo projeto para começar</p>
                        <button onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 h-11 px-6 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition"
                            style={{ background: T.accent }}>
                            <Plus size={16} /> Novo Projeto
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {projetos.map(p => {
                            const stt = STATUS_CFG[p.status] || { l: p.status, color: '#6B7280' }
                            const pct = p.unidades > 0 ? Math.round((p.unidades_vendidas / p.unidades) * 100) : 0
                            return (
                                <div key={p.id} className="overflow-hidden rounded-2xl transition-all"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    {/* Image placeholder */}
                                    <div className="h-36 flex items-center justify-center relative overflow-hidden"
                                        style={{ background: T.elevated }}>
                                        {p.imagem_url ? (
                                            <Image src={p.imagem_url} alt={p.nome} fill className="object-cover" />
                                        ) : (
                                            <Building2 size={48} style={{ color: T.textMuted, opacity: 0.3 }} />
                                        )}
                                        <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium"
                                            style={{ backgroundColor: `${stt.color}20`, color: stt.color }}>
                                            {stt.l}
                                        </span>
                                        <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-bold"
                                            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                                            {fmtCurrency(Number(p.vgv || 0))} VGV
                                        </span>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ color: T.text }}>{p.nome}</h3>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MapPin size={11} style={{ color: T.textMuted }} />
                                                <span className="text-xs" style={{ color: T.textMuted }}>{p.cidade || '—'}, {p.estado || '—'}</span>
                                                {p.tipo && (
                                                    <>
                                                        <span className="text-xs mx-1" style={{ color: T.textMuted }}>·</span>
                                                        <span className="text-xs" style={{ color: T.textMuted }}>{p.tipo}</span>
                                                    </>
                                                )}
                                            </div>
                                            {p.descricao && <p className="text-xs mt-1 line-clamp-2" style={{ color: T.textMuted }}>{p.descricao}</p>}
                                        </div>

                                        {/* Progresso vendas */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs" style={{ color: T.textMuted }}>Vendas</span>
                                                <span className="text-xs font-bold" style={{ color: T.text }}>
                                                    {p.unidades_vendidas}/{p.unidades} unid. ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: pct >= 75 ? '#22C55E' : 'var(--bo-accent)',
                                                    }} />
                                            </div>
                                        </div>

                                        {/* Métricas */}
                                        <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                                            <span className="text-xs" style={{ color: T.textMuted }}>
                                                {p.area_total_m2 ? `Área: ${Number(p.area_total_m2).toLocaleString('pt-BR')} m²` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto rounded-2xl"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold" style={{ color: T.text }}>Novo Projeto</h2>
                            <button onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: T.textMuted }}
                                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Nome *</label>
                                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                    placeholder="Nome do projeto" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Tipo</label>
                                    <input value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        placeholder="Ex: Residencial" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                        {Object.entries(STATUS_CFG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Cidade</label>
                                    <input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        placeholder="Cidade" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Estado</label>
                                    <input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                        placeholder="UF" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Unidades</label>
                                    <input type="number" value={form.unidades}
                                        onChange={e => setForm({ ...form, unidades: parseInt(e.target.value) || 0 })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>VGV (R$)</label>
                                    <input type="number" value={form.vgv}
                                        onChange={e => setForm({ ...form, vgv: parseFloat(e.target.value) || 0 })}
                                        className="w-full h-11 px-4 rounded-xl outline-none text-sm"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Descrição</label>
                                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    rows={3} className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                    placeholder="Detalhes do projeto" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 h-11 rounded-xl font-medium transition"
                                style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={saving || !form.nome}
                                className="flex-1 h-11 text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40"
                                style={{ background: T.accent }}>
                                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Projeto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
