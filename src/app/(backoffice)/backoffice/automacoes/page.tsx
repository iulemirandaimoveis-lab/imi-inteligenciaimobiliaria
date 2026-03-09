'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Plus, Search, Play, Pause, Zap,
    Mail, MessageSquare, Calendar, Users,
    FileText, TrendingUp, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { T } from '@/app/(backoffice)/lib/theme'

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

// ── Loading skeleton ─────────────────────────────────────────────────
function AutomacoesSkeleton() {
    return (
        <div className="space-y-5">
            <div style={{ height: 56, background: 'var(--bo-card)', borderRadius: 14, opacity: 0.5, width: '50%' }} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 72, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.4 - i * 0.05 }} />
                ))}
            </div>
            <div style={{ height: 44, background: 'var(--bo-card)', borderRadius: 12, opacity: 0.35 }} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 160, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.3 - i * 0.04 }} />
                ))}
            </div>
        </div>
    )
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
    new_lead: 'var(--bo-accent)',
    follow_up: '#8B5CF6',
    schedule: '#F59E0B',
    team: '#10B981',
    report: '#EF4444',
    pipeline: 'var(--bo-accent)',
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
            const json = await res.json()
            // API returns { data: [...], pagination: {} }
            setWorkflows(json.data || (Array.isArray(json) ? json : []))
        } catch { setWorkflows([]) }
        setLoading(false)
    }, [])

    useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

    const toggleActive = async (wf: Workflow) => {
        const next = !wf.is_active
        await fetch('/api/automacoes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: wf.id, is_active: next }),
        })
        toast.success(next ? `"${wf.name}" ativada` : `"${wf.name}" pausada`)
        fetchWorkflows()
    }

    const handleCreate = async () => {
        if (!form.name) return
        setSaving(true)
        try {
            const res = await fetch('/api/automacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || null,
                    trigger_type: form.trigger_type,
                    is_active: true,
                }),
            })
            if (!res.ok) throw new Error('Erro ao criar automação')
            setShowModal(false)
            setForm({ name: '', description: '', trigger_type: 'manual' })
            toast.success(`Automação "${form.name}" criada!`)
            fetchWorkflows()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao criar automação')
        }
        setSaving(false)
    }

    const handleDelete = async (id: string, name: string) => {
        toast.warning(`Excluir "${name}"?`, {
            action: {
                label: 'Sim, excluir',
                onClick: async () => {
                    await fetch(`/api/automacoes?id=${id}`, { method: 'DELETE' })
                    toast.success('Automação excluída')
                    fetchWorkflows()
                },
            },
            duration: 6000,
        })
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

    if (loading) return <AutomacoesSkeleton />

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <PageIntelHeader
                    moduleLabel="IA & AUTOMAÇÕES"
                    title="Automações"
                    subtitle="Workflows automáticos · Inteligência artificial"
                    live
                    actions={
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                height: '36px', padding: '0 14px', borderRadius: '10px',
                                fontSize: '12px', fontWeight: 700, color: '#fff',
                                background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)',
                                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                boxShadow: '0 0 14px rgba(59,130,246,0.3)',
                            }}
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Nova Automação</span>
                            <span className="sm:hidden">Nova</span>
                        </button>
                    }
                />
            </motion.div>

            {/* ── KPI Strip ──────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
                <KPICard label="Total"          value={stats.total}          accent="blue"  size="sm" icon={<Zap size={11} />} />
                <KPICard label="Ativas"         value={stats.ativas}         accent="green" size="sm" icon={<Play size={11} />} />
                <KPICard label="Pausadas"       value={stats.pausadas}       accent="warm"  size="sm" icon={<Pause size={11} />} />
                <KPICard label="Execuções"      value={stats.execucoesTotal} accent="ai"    size="sm" icon={<TrendingUp size={11} />} />
            </motion.div>

            {/* ── Search ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.10 }}
                className="relative"
            >
                <Search style={{ color: 'var(--bo-text-muted)' }} className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
                <input
                    type="text"
                    placeholder="Buscar automações..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-2xl"
                    style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)', outline: 'none' }}
                />
            </motion.div>

            {/* ── List ───────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            {filtered.length === 0 ? (
                    <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                        <Zap size={48} className="mx-auto mb-4" style={{ color: 'var(--bo-text-muted)', opacity: 0.3 }} />
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--bo-text)' }}>Nenhuma automação encontrada</h3>
                        <p className="mb-6" style={{ color: 'var(--bo-text-muted)' }}>Crie um novo workflow para automatizar processos</p>
                        <button onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 h-11 px-6 text-white rounded-xl font-semibold" style={{ background: "var(--bo-accent)" }}>
                            <Plus size={20} /> Nova Automação
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filtered.map(wf => {
                            const Icon = getIcon(wf.trigger_type)
                            const color = getColor(wf.trigger_type)

                            return (
                                <div key={wf.id} className="rounded-2xl p-6 transition-all group" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${color}15` }}>
                                                <Icon size={24} style={{ color }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold mb-1" style={{ color: 'var(--bo-text)' }}>{wf.name}</h3>
                                                {wf.description && <p className="text-sm" style={{ color: 'var(--bo-text-muted)' }}>{wf.description}</p>}
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
                                    <div className="mb-4 p-3 bg-[var(--bo-hover)] rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap size={14} style={{ color: 'var(--bo-text-muted)' }} className="" />
                                            <span className="text-xs font-semibold uppercase" style={{ color: 'var(--bo-text-muted)' }}>Trigger</span>
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--bo-text)' }}>{wf.trigger_type}</p>
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
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--bo-border)]">
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--bo-text-muted)' }}>Execuções</p>
                                            <p className="text-lg font-bold" style={{ color: 'var(--bo-text)' }}>{wf.run_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--bo-text-muted)' }}>Última Execução</p>
                                            <p className="text-xs font-medium" style={{ color: 'var(--bo-text)' }}>{getTimeAgo(wf.last_run_at)}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--bo-border)] mt-4">
                                        <button onClick={() => toggleActive(wf)}
                                            className="p-2 hover:bg-[var(--bo-hover)] rounded-lg transition" title={wf.is_active ? 'Pausar' : 'Ativar'}>
                                            {wf.is_active
                                                ? <Pause size={16} className="text-amber-400" />
                                                : <Play size={16} className="text-green-400" />}
                                        </button>
                                        <button onClick={() => handleDelete(wf.id, wf.name)}
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition">
                                            <X size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl w-full max-w-lg p-6 space-y-5" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold" style={{ color: 'var(--bo-text)' }}>Nova Automação</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[var(--bo-hover)] rounded-lg">
                                <X size={20} style={{ color: 'var(--bo-text-muted)' }} className="" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--bo-text-muted)' }}>Nome *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }} placeholder="Nome da automação" />
                            </div>

                            <div>
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--bo-text-muted)' }}>Tipo de Trigger</label>
                                <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }}>
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
                                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--bo-text-muted)' }}>Descrição</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} className="w-full px-4 py-3 rounded-xl" style={{ background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)', color: 'var(--bo-text)' }}
                                    placeholder="Descreva o que esta automação faz" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 h-11 rounded-xl font-medium transition" style={{ border: '1px solid var(--bo-border)', color: 'var(--bo-text-muted)' }}>
                                Cancelar
                            </button>
                            <button onClick={handleCreate} disabled={saving || !form.name}
                                className="flex-1 h-11 text-white rounded-xl font-semibold transition disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)' }}>
                                {saving ? 'Salvando...' : 'Criar Automação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
