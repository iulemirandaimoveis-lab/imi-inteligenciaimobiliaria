'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Plus,
    Search,
    Play,
    Pause,
    Zap,
    Mail,
    MessageSquare,
    Calendar,
    Users,
    FileText,
    TrendingUp,
    Loader2,
    X,
    Settings,
} from 'lucide-react'

/* ── Dark-theme design tokens ─────────────────────────── */
const T = {
    page: 'min-h-screen bg-[#0B0B11]',
    card: 'bg-[#141420] border border-white/[.06] rounded-2xl',
    text: 'text-white',
    sub: 'text-white/50',
    accent: '#C49D5B',
    accentBg: 'bg-[#C49D5B]',
    input: 'bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/30 rounded-xl',
}

interface Workflow {
    id: string
    name: string
    description: string | null
    is_active: boolean
    trigger_type: string
    config: any
    last_run_at: string | null
    run_count: number
    created_at: string
    updated_at: string | null
}

const TRIGGER_ICONS: Record<string, any> = {
    new_lead: Mail,
    follow_up: MessageSquare,
    schedule: Calendar,
    team: Users,
    report: FileText,
    pipeline: TrendingUp,
    manual: Zap,
}

const TRIGGER_COLORS: Record<string, string> = {
    new_lead: '#3B82F6',
    follow_up: '#8B5CF6',
    schedule: '#F59E0B',
    team: '#10B981',
    report: '#EF4444',
    pipeline: '#C49D5B',
    manual: '#6B7280',
}

export default function AutomacoesPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: '',
        description: '',
        trigger_type: 'manual',
    })

    const fetchWorkflows = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/automacoes')
            const data = await res.json()
            setWorkflows(Array.isArray(data) ? data : [])
        } catch { setWorkflows([]) }
        setLoading(false)
    }, [])

    useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

    const toggleActive = async (wf: Workflow) => {
        await fetch('/api/automacoes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: wf.id, is_active: !wf.is_active }),
        })
        fetchWorkflows()
    }

    const handleCreate = async () => {
        if (!form.name) return
        setSaving(true)
        try {
            await fetch('/api/automacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || null,
                    trigger_type: form.trigger_type,
                    is_active: true,
                }),
            })
            setShowModal(false)
            setForm({ name: '', description: '', trigger_type: 'manual' })
            fetchWorkflows()
        } catch { /* ignore */ }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta automação?')) return
        await fetch(`/api/automacoes?id=${id}`, { method: 'DELETE' })
        fetchWorkflows()
    }

    const getTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Nunca'
        const now = new Date()
        const past = new Date(dateStr)
        const diffMin = Math.floor((now.getTime() - past.getTime()) / 60000)
        if (diffMin < 60) return `${diffMin}min atrás`
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h atrás`
        return `${Math.floor(diffMin / 1440)}d atrás`
    }

    const filtered = workflows.filter(wf =>
        wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wf.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        total: workflows.length,
        ativas: workflows.filter(w => w.is_active).length,
        pausadas: workflows.filter(w => !w.is_active).length,
        execucoesTotal: workflows.reduce((s, w) => s + (w.run_count || 0), 0),
    }

    const getIcon = (t: string) => TRIGGER_ICONS[t] || Zap
    const getColor = (t: string) => TRIGGER_COLORS[t] || '#6B7280'

    return (
        <div className={T.page}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${T.text}`}>IA & Automações</h1>
                        <p className={`text-sm mt-1 ${T.sub}`}>Workflows automáticos e inteligência artificial</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className={`flex items-center gap-2 h-11 px-6 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110 transition`}>
                        <Plus size={20} /> Nova Automação
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { l: 'Total', v: stats.total, color: '#C49D5B' },
                        { l: 'Ativas', v: stats.ativas, color: '#22C55E' },
                        { l: 'Pausadas', v: stats.pausadas, color: '#F59E0B' },
                        { l: 'Execuções Total', v: stats.execucoesTotal, color: '#8B5CF6' },
                    ].map(s => (
                        <div key={s.l} className={T.card + ' p-4'}>
                            <p className={`text-xs mb-1 ${T.sub}`}>{s.l}</p>
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.v}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className={T.card + ' p-4'}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                        <input type="text" placeholder="Buscar automações..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full h-11 pl-10 pr-4 ${T.input}`} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#C49D5B]" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`${T.card} p-12 text-center`}>
                        <Zap size={48} className="mx-auto text-white/20 mb-4" />
                        <h3 className={`text-lg font-semibold ${T.text} mb-2`}>Nenhuma automação encontrada</h3>
                        <p className={`${T.sub} mb-6`}>Crie um novo workflow para automatizar processos</p>
                        <button onClick={() => setShowModal(true)}
                            className={`inline-flex items-center gap-2 h-11 px-6 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110`}>
                            <Plus size={20} /> Nova Automação
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filtered.map(wf => {
                            const Icon = getIcon(wf.trigger_type)
                            const color = getColor(wf.trigger_type)

                            return (
                                <div key={wf.id} className={`${T.card} p-6 hover:border-white/10 transition-all group`}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${color}15` }}>
                                                <Icon size={24} style={{ color }} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${T.text} mb-1`}>{wf.name}</h3>
                                                {wf.description && <p className={`text-sm ${T.sub}`}>{wf.description}</p>}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${wf.is_active
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-amber-500/10 text-amber-400'
                                            }`}>
                                            {wf.is_active ? <Play size={12} /> : <Pause size={12} />}
                                            {wf.is_active ? 'Ativa' : 'Pausada'}
                                        </span>
                                    </div>

                                    {/* Trigger */}
                                    <div className="mb-4 p-3 bg-white/[.03] rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap size={14} className="text-white/40" />
                                            <span className="text-xs font-semibold text-white/40 uppercase">Trigger</span>
                                        </div>
                                        <p className={`text-sm font-medium ${T.text}`}>{wf.trigger_type}</p>
                                    </div>

                                    {/* Config preview */}
                                    {wf.config && typeof wf.config === 'object' && Object.keys(wf.config).length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {(wf.config.actions || []).map((a: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded">
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[.06]">
                                        <div>
                                            <p className={`text-xs ${T.sub} mb-1`}>Execuções</p>
                                            <p className={`text-lg font-bold ${T.text}`}>{wf.run_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs ${T.sub} mb-1`}>Última Execução</p>
                                            <p className={`text-xs font-medium ${T.text}`}>{getTimeAgo(wf.last_run_at)}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[.06] mt-4">
                                        <button onClick={() => toggleActive(wf)}
                                            className="p-2 hover:bg-white/5 rounded-lg transition" title={wf.is_active ? 'Pausar' : 'Ativar'}>
                                            {wf.is_active
                                                ? <Pause size={16} className="text-amber-400" />
                                                : <Play size={16} className="text-green-400" />}
                                        </button>
                                        <button onClick={() => handleDelete(wf.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition">
                                            <X size={16} className="text-red-400" />
                                        </button>
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
                    <div className={`${T.card} w-full max-w-lg p-6 space-y-5`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-lg font-bold ${T.text}`}>Nova Automação</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                                <X size={20} className="text-white/40" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Nome *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`} placeholder="Nome da automação" />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Tipo de Trigger</label>
                                <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}
                                    className={`w-full h-11 px-4 ${T.input}`}>
                                    <option value="manual">Manual</option>
                                    <option value="new_lead">Novo Lead</option>
                                    <option value="follow_up">Follow-up</option>
                                    <option value="schedule">Agendamento</option>
                                    <option value="team">Equipe</option>
                                    <option value="report">Relatório</option>
                                    <option value="pipeline">Pipeline</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/60 mb-1.5 block">Descrição</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} className={`w-full px-4 py-3 ${T.input}`}
                                    placeholder="Descreva o que esta automação faz" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 h-11 border border-white/10 text-white/60 rounded-xl font-medium hover:bg-white/5 transition">
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={saving || !form.name}
                                className={`flex-1 h-11 ${T.accentBg} text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40`}>
                                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Automação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
