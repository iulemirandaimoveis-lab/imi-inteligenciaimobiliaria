'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

interface PlaybookStep {
    id: number
    titulo: string
    desc: string
}

interface Playbook {
    id: string
    slug: string
    name: string
    category: string
    estimated_time: string | null
    norm_reference: string | null
    icon: string
    steps: PlaybookStep[]
    is_active: boolean
}

export default function PlaybooksPage() {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([])
    const [loading, setLoading] = useState(true)
    const [aberto, setAberto] = useState<string | null>(null)
    const [concluidos, setConcluidos] = useState<Record<string, Set<number>>>({})
    const [filtro, setFiltro] = useState('todos')

    useEffect(() => {
        fetch('/api/operational-playbooks')
            .then(r => r.json())
            .then(d => setPlaybooks(d.data || []))
            .catch(() => setPlaybooks([]))
            .finally(() => setLoading(false))
    }, [])

    const toggle = (id: string) => setAberto(prev => prev === id ? null : id)

    const toggleStep = (playId: string, stepId: number) => {
        setConcluidos(prev => {
            const set = new Set(prev[playId] || [])
            if (set.has(stepId)) set.delete(stepId)
            else set.add(stepId)
            return { ...prev, [playId]: set }
        })
    }

    const categorias = ['todos', ...Array.from(new Set(playbooks.map(p => p.category)))]
    const filtered = filtro === 'todos' ? playbooks : playbooks.filter(p => p.category === filtro)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: T.text }}>Playbooks Operacionais</h1>
                <p className="text-xs mt-0.5" style={{ color: T.textSub }}>SOPs e checklists para operações padrão IMI</p>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                {categorias.map(c => (
                    <button key={c} onClick={() => setFiltro(c)}
                        className="h-8 px-3 rounded-xl text-xs font-medium border transition-colors"
                        style={{
                            background: filtro === c ? T.gold : 'transparent',
                            color: filtro === c ? 'white' : T.textSub,
                            borderColor: filtro === c ? T.gold : T.border,
                        }}>
                        {c === 'todos' ? 'Todos' : c}
                    </button>
                ))}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl h-20 animate-pulse"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="rounded-2xl p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-2xl mb-2">📋</p>
                    <p className="text-sm font-semibold" style={{ color: T.text }}>Nenhum playbook encontrado</p>
                    <p className="text-xs mt-1" style={{ color: T.textSub }}>
                        {filtro !== 'todos' ? `Nenhum SOP na categoria "${filtro}"` : 'Adicione seu primeiro SOP'}
                    </p>
                </div>
            )}

            {/* Playbook list */}
            {!loading && (
                <div className="space-y-3">
                    {filtered.map(pb => {
                        const isOpen = aberto === pb.id
                        const done = concluidos[pb.id] || new Set()
                        const steps: PlaybookStep[] = Array.isArray(pb.steps) ? pb.steps : []
                        const pct = steps.length > 0 ? Math.round((done.size / steps.length) * 100) : 0

                        return (
                            <div key={pb.id} className="rounded-2xl overflow-hidden"
                                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <button onClick={() => toggle(pb.id)}
                                    className="w-full flex items-center gap-4 p-4 text-left transition-colors"
                                    style={{ background: isOpen ? T.elevated : 'transparent' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                                        style={{ background: 'rgba(72,101,129,0.12)' }}>
                                        {pb.icon || '📋'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold" style={{ color: T.text }}>{pb.name}</p>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                style={{ background: 'rgba(72,101,129,0.12)', color: T.gold }}>
                                                {pb.category}
                                            </span>
                                            {pb.norm_reference && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                    style={{ background: 'rgba(168,158,196,0.12)', color: '#A89EC4' }}>
                                                    {pb.norm_reference}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            {pb.estimated_time && (
                                                <span className="flex items-center gap-1 text-xs" style={{ color: T.textSub }}>
                                                    <Clock size={11} /> {pb.estimated_time}
                                                </span>
                                            )}
                                            <span className="text-xs" style={{ color: T.textSub }}>{steps.length} etapas</span>
                                            {done.size > 0 && (
                                                <span className="text-xs font-medium" style={{ color: T.gold }}>{pct}% concluído</span>
                                            )}
                                        </div>
                                        {done.size > 0 && (
                                            <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div className="h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, background: T.gold }} />
                                            </div>
                                        )}
                                    </div>
                                    {isOpen
                                        ? <ChevronDown size={16} style={{ color: T.textSub }} className="flex-shrink-0" />
                                        : <ChevronRight size={16} style={{ color: T.textSub }} className="flex-shrink-0" />
                                    }
                                </button>

                                {/* Etapas */}
                                {isOpen && (
                                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                                        {steps.map((step, i) => {
                                            const isConcluida = done.has(step.id)
                                            return (
                                                <div key={step.id}
                                                    className="flex gap-3 px-5 py-3 last:border-0 transition-colors"
                                                    style={{
                                                        borderBottom: `1px solid ${T.border}`,
                                                        background: isConcluida ? 'rgba(107,184,123,0.06)' : 'transparent',
                                                    }}>
                                                    <button onClick={() => toggleStep(pb.id, step.id)} className="mt-0.5 flex-shrink-0">
                                                        {isConcluida
                                                            ? <CheckCircle2 size={18} style={{ color: '#6BB87B' }} />
                                                            : <Circle size={18} style={{ color: T.textSub }} />
                                                        }
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold" style={{ color: T.textSub }}>#{i + 1}</span>
                                                            <p className="text-sm font-semibold"
                                                                style={{ color: isConcluida ? T.textSub : T.text, textDecoration: isConcluida ? 'line-through' : 'none' }}>
                                                                {step.titulo}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: T.textSub }}>{step.desc}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Info */}
            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.borderGold}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: T.gold }}>Playbooks Customizados</p>
                <p className="text-xs leading-relaxed" style={{ color: T.textSub }}>
                    Os playbooks são checklists interativos — marque cada etapa como concluída durante a execução.
                    Novos SOPs podem ser adicionados conforme o crescimento operacional da IMI. O progresso é salvo localmente na sessão.
                </p>
            </div>
        </div>
    )
}
