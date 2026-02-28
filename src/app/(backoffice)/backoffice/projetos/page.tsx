'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Plus, MapPin, TrendingUp, Eye, Users, DollarSign, BarChart2, Loader2, X } from 'lucide-react'

/* ── Dark-theme design tokens ─────────────────────────── */
const T = {
    page: 'min-h-screen bg-[#0B0B11]',
    card: 'bg-[#141420] border border-white/[.06] rounded-2xl',
    text: 'text-white',
    sub: 'text-white/50',
    accent: '#3B82F6',
    accentBg: 'bg-[#1A1A2E]',
    input: 'bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/30 rounded-xl',
}

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
    estruturacao: { l: 'Estruturação', color: '#3B82F6' },
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
        <div className={T.page}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-xl font-bold ${T.text}`}>Projetos & Empreendimentos</h1>
                        <p className={`text-xs mt-0.5 ${T.sub}`}>Portfólio de desenvolvimentos ativos</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className={`flex items-center gap-2 h-9 px-4 ${T.accentBg} text-white rounded-xl text-sm font-semibold hover:brightness-110 transition`}>
                        <Plus size={16} /> Novo Projeto
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                        { l: 'VGV Total Portfólio', v: fmtCurrency(totalVGV), icon: DollarSign, color: '#3B82F6' },
                        { l: 'Total de Unidades', v: totalUnidades, icon: Building2, color: '#3B82F6' },
                        { l: 'Unidades Vendidas', v: totalVendidas, icon: Users, color: '#10B981' },
                        { l: 'Taxa Média de Vendas', v: `${taxaMedia}%`, icon: TrendingUp, color: '#8B5CF6' },
                    ].map(kpi => {
                        const Icon = kpi.icon
                        return (
                            <div key={kpi.l} className={T.card + ' p-4'}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                    style={{ backgroundColor: `${kpi.color}15` }}>
                                    <Icon size={18} style={{ color: kpi.color }} />
                                </div>
                                <p className={`text-xl font-bold ${T.text}`}>{kpi.v}</p>
                                <p className={`text-xs mt-0.5 ${T.sub}`}>{kpi.l}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Filtros */}
                <div className="flex gap-2 overflow-x-auto">
                    {['todos', 'estruturacao', 'lancamento', 'obras', 'pronto'].map(s => (
                        <button key={s} onClick={() => setFiltro(s)}
                            className={`h-8 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${filtro === s
                                ? 'bg-[#1A1A2E] text-white border-[#3B82F6]'
                                : 'bg-[#141420] text-white/50 border-white/10 hover:border-white/20'
                                }`}>
                            {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.l || s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                    </div>
                ) : projetos.length === 0 ? (
                    <div className={`${T.card} p-12 text-center`}>
                        <Building2 size={48} className="mx-auto text-white/20 mb-4" />
                        <h3 className={`text-lg font-semibold ${T.text} mb-2`}>Nenhum projeto encontrado</h3>
                        <p className={T.sub}>Crie um novo projeto para começar</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {projetos.map(p => {
                            const stt = STATUS_CFG[p.status] || { l: p.status, color: '#6B7280' }
                            const pct = p.unidades > 0 ? Math.round((p.unidades_vendidas / p.unidades) * 100) : 0
                            return (
                                <div key={p.id} className={`${T.card} overflow-hidden hover:border-white/10 transition-all`}>
                                    {/* Image placeholder */}
                                    <div className="h-36 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] flex items-center justify-center relative">
                                        {p.imagem_url ? (
                                            <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={48} className="text-white/10" />
                                        )}
                                        <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium"
                                            style={{ backgroundColor: `${stt.color}20`, color: stt.color }}>
                                            {stt.l}
                                        </span>
                                        <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-black/60 text-white font-bold">
                                            {fmtCurrency(Number(p.vgv || 0))} VGV
                                        </span>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className={`text-sm font-bold ${T.text}`}>{p.nome}</h3>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MapPin size={11} className="text-white/30" />
                                                <span className={`text-xs ${T.sub}`}>{p.cidade || '—'}, {p.estado || '—'}</span>
                                                {p.tipo && (
                                                    <>
                                                        <span className="text-xs text-white/20 mx-1">·</span>
                                                        <span className={`text-xs ${T.sub}`}>{p.tipo}</span>
                                                    </>
                                                )}
                                            </div>
                                            {p.descricao && <p className={`text-xs mt-1 line-clamp-2 ${T.sub}`}>{p.descricao}</p>}
                                        </div>

                                        {/* Progresso vendas */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs ${T.sub}`}>Vendas</span>
                                                <span className={`text-xs font-bold ${T.text}`}>
                                                    {p.unidades_vendidas}/{p.unidades} unid. ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: pct >= 75 ? '#22C55E' : pct >= 30 ? '#3B82F6' : '#3B82F6',
                                                    }} />
                                            </div>
                                        </div>

                                        {/* Métricas */}
                                        <div className="flex items-center justify-between pt-1 border-t border-white/[.06]">
                                            <span className={`text-xs ${T.sub}`}>
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
                    <div className={`${T.card} w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-lg font-bold ${T.text}`}>Novo Projeto</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                                <X size={20} className="text-white/40" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Nome *</label>
                                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`} placeholder="Nome do projeto" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Tipo</label>
                                    <input value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`} placeholder="Ex: Residencial" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`}>
                                        {Object.entries(STATUS_CFG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Cidade</label>
                                    <input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`} placeholder="Cidade" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Estado</label>
                                    <input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                                        className={`w-full h-11 px-4 ${T.input}`} placeholder="UF" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Unidades</label>
                                    <input type="number" value={form.unidades}
                                        onChange={e => setForm({ ...form, unidades: parseInt(e.target.value) || 0 })}
                                        className={`w-full h-11 px-4 ${T.input}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60 mb-1.5 block">VGV (R$)</label>
                                    <input type="number" value={form.vgv}
                                        onChange={e => setForm({ ...form, vgv: parseFloat(e.target.value) || 0 })}
                                        className={`w-full h-11 px-4 ${T.input}`} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Descrição</label>
                                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    rows={3} className={`w-full px-4 py-3 ${T.input}`} placeholder="Detalhes do projeto" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 h-11 border border-white/10 text-white/60 rounded-xl font-medium hover:bg-white/5 transition">
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={saving || !form.nome}
                                className={`flex-1 h-11 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40`}>
                                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Projeto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
