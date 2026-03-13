'use client'

import { useState, useEffect } from 'react'
import {
    Zap, Bot, RefreshCw, Plus, Play, Settings,
    Calendar, Instagram, Linkedin, Mail, FileText,
    BarChart3, Search, Pause, Loader2,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Workflow {
    id: string
    name: string
    description: string | null
    is_active: boolean | null
    trigger_type: string
    config: any
    last_run_at: string | null
    run_count: number | null
    created_at: string
}

const CANAL_ICONS: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    email: Mail,
    blog: FileText,
    default: Zap,
}

function getStatusInfo(workflow: Workflow) {
    const key = workflow.is_active ? 'ativo' : 'morno'
    const cfg = getStatusConfig(key)
    return { label: workflow.is_active ? 'ativo' : 'pausado', color: cfg.dot, bg: `${cfg.dot}1f` }
}

function fmtLastRun(ts: string | null): string {
    if (!ts) return 'Nunca executado'
    const d = new Date(ts)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getCanais(wf: Workflow): string[] {
    if (wf.config?.canais) return wf.config.canais
    if (wf.trigger_type) return [wf.trigger_type.split('_')[0]]
    return ['blog']
}

export default function AutomacaoConteudoPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')

    async function loadWorkflows() {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('automation_workflows')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setWorkflows(data || [])
        } catch {
            toast.error('Erro ao carregar automações')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadWorkflows() }, [])

    const toggleWorkflow = async (wf: Workflow) => {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('automation_workflows')
                .update({ is_active: !wf.is_active, updated_at: new Date().toISOString() })
                .eq('id', wf.id)
            if (error) throw error
            setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, is_active: !w.is_active } : w))
            toast.success(wf.is_active ? 'Automação pausada' : 'Automação ativada')
        } catch {
            toast.error('Erro ao atualizar automação')
        }
    }

    const wfFiltrados = workflows.filter(f =>
        f.name.toLowerCase().includes(busca.toLowerCase()) ||
        (f.description ?? '').toLowerCase().includes(busca.toLowerCase())
    )

    const ativos = workflows.filter(w => w.is_active).length
    const totalRuns = workflows.reduce((s, w) => s + (w.run_count ?? 0), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONTEÚDO"
                title="Automação de Conteúdo"
                subtitle="Configure agentes de IA para criar e agendar posts automaticamente"
                breadcrumbs={[
                    { label: 'Conteúdo', href: '/backoffice/conteudo' },
                    { label: 'Automação' },
                ]}
                actions={
                    <button
                        className="flex items-center gap-2 h-10 px-5 text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all flex-shrink-0"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} />
                        Novo Pipeline
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <KPICard label="Pipelines Ativos"  value={loading ? '—' : String(ativos)}                           icon={<Zap size={14} />} accent="green" size="sm" />
                <KPICard label="Execuções Totais"   value={loading ? '—' : totalRuns.toLocaleString('pt-BR')}        icon={<BarChart3 size={14} />} accent="blue" size="sm" />
                <KPICard label="Total de Pipelines" value={loading ? '—' : String(workflows.length)}                 icon={<Settings size={14} />} size="sm" />
            </div>

            {/* Lista de Pipelines */}
            <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                        <input
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar pipeline de automação..."
                            className="w-full h-11 pl-11 pr-4 rounded-2xl text-sm focus:ring-2 outline-none"
                            style={{ background: T.elevated, color: T.text }}
                        />
                    </div>
                    <button
                        onClick={loadWorkflows}
                        className="flex items-center gap-2 h-11 px-4 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest"
                        style={{ background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}
                    >
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                    </div>
                ) : wfFiltrados.length === 0 ? (
                    <div className="text-center py-16">
                        <Bot size={40} className="mx-auto mb-3 opacity-20" style={{ color: T.textMuted }} />
                        <p className="font-medium" style={{ color: T.text }}>
                            {busca ? 'Nenhum pipeline encontrado' : 'Nenhuma automação configurada'}
                        </p>
                        <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                            {busca ? 'Tente outros termos' : 'Crie o primeiro pipeline de automação'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {wfFiltrados.map(wf => {
                            const statusInfo = getStatusInfo(wf)
                            const canais = getCanais(wf)
                            return (
                                <div key={wf.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 group transition-colors" style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-base font-bold" style={{ color: T.text }}>{wf.name}</h3>
                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        {wf.description && (
                                            <p className="text-sm leading-relaxed max-w-xl" style={{ color: T.textMuted }}>{wf.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={14} style={{ color: T.accent }} />
                                                <span className="text-xs font-semibold" style={{ color: T.text }}>{wf.trigger_type}</span>
                                            </div>
                                            {wf.last_run_at && (
                                                <>
                                                    <div className="h-4 w-px" style={{ background: T.border }} />
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={14} style={{ color: T.textMuted }} />
                                                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>
                                                            Última exec: {fmtLastRun(wf.last_run_at)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="flex -space-x-2">
                                            {canais.map(canal => {
                                                const Icon = CANAL_ICONS[canal] ?? CANAL_ICONS.default
                                                return (
                                                    <div key={canal} className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                                        style={{ background: T.elevated, border: `2px solid ${T.border}`, color: T.textMuted }} title={canal}>
                                                        <Icon size={14} />
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: T.textMuted }}>Execuções</p>
                                            <p className="text-sm font-bold" style={{ color: T.text }}>
                                                {wf.run_count != null ? wf.run_count.toLocaleString('pt-BR') : '—'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleWorkflow(wf)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                                                style={(() => {
                                                    const sc = getStatusConfig(wf.is_active ? 'morno' : 'ativo')
                                                    return { background: `${sc.dot}1f`, color: sc.dot }
                                                })()}
                                                title={wf.is_active ? 'Pausar' : 'Ativar'}
                                            >
                                                {wf.is_active ? <Pause size={18} /> : <Play size={18} />}
                                            </button>
                                            <button
                                                onClick={() => toast.info(`Configurações de "${wf.name}" — em breve`)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:brightness-110"
                                                style={{ background: T.elevated, color: T.textMuted }}
                                                title="Configurações"
                                            >
                                                <Settings size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {workflows.length > 0 && (
                    <div className="p-4 text-center" style={{ background: T.elevated, borderTop: `1px solid ${T.border}` }}>
                        <p className="text-xs font-medium" style={{ color: T.textMuted }}>
                            {workflows.length} pipeline{workflows.length !== 1 ? 's' : ''} configurado{workflows.length !== 1 ? 's' : ''} · {ativos} ativo{ativos !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
