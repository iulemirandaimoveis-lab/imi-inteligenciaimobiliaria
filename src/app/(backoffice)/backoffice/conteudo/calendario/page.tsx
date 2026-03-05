// ============================================
// BLOCO 4 — SCRIPT 7: CALENDÁRIO EDITORIAL
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/conteudo/calendario/page.tsx
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Instagram,
    Linkedin,
    Facebook,
    Mail,
    Globe,
    Youtube,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Edit,
    Eye,
} from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: 'var(--bo-accent)',
}

// ⚠️ NÃO MODIFICAR - Conteúdos mockados calendário contextualizados Recife
const CONTEUDOS_CALENDARIO = [
    {
        id: 1,
        titulo: 'Reserva Imperial — Lançamento Fase 2',
        tipo: 'instagram',
        status: 'agendado',
        data: '2026-02-20',
        horario: '09:00',
        autor: 'IA + Ana Paula Ferreira',
    },
    {
        id: 2,
        titulo: 'Guia: Investir em Boa Viagem 2026',
        tipo: 'blog',
        status: 'publicado',
        data: '2026-02-18',
        horario: '08:00',
        autor: 'IA + Carlos Eduardo',
    },
    {
        id: 3,
        titulo: 'Por que Family Offices olham para Recife',
        tipo: 'linkedin',
        status: 'publicado',
        data: '2026-02-17',
        horario: '11:00',
        autor: 'IA',
    },
    {
        id: 4,
        titulo: 'Newsletter: Oportunidades Fevereiro',
        tipo: 'email',
        status: 'agendado',
        data: '2026-02-21',
        horario: '07:30',
        autor: 'IA + Equipe IMI',
    },
    {
        id: 5,
        titulo: 'Pina: O Novo Polo Premium de Recife',
        tipo: 'instagram',
        status: 'rascunho',
        data: '2026-02-24',
        horario: '10:00',
        autor: 'IA',
    },
    {
        id: 6,
        titulo: 'Tour Virtual: Ocean Blue Cobertura',
        tipo: 'youtube',
        status: 'agendado',
        data: '2026-02-25',
        horario: '15:00',
        autor: 'IA + Produção',
    },
    {
        id: 7,
        titulo: 'Post Facebook: Candeias Valorização',
        tipo: 'facebook',
        status: 'publicado',
        data: '2026-02-14',
        horario: '12:00',
        autor: 'IA',
    },
    {
        id: 8,
        titulo: 'Artigo: Estruturação Patrimonial PE',
        tipo: 'blog',
        status: 'agendado',
        data: '2026-02-28',
        horario: '08:00',
        autor: 'IA + Dr. Roberto Mendes',
    },
    {
        id: 9,
        titulo: 'LinkedIn: Relatório Mercado Imobiliário Q1',
        tipo: 'linkedin',
        status: 'rascunho',
        data: '2026-03-03',
        horario: '09:00',
        autor: 'IA',
    },
    {
        id: 10,
        titulo: 'Instagram: Setúbal — Vida Tranquila Premium',
        tipo: 'instagram',
        status: 'agendado',
        data: '2026-03-05',
        horario: '10:30',
        autor: 'IA + Ana Paula',
    },
]

const TIPO_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    instagram: { icon: Instagram, label: 'Instagram', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
    linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    facebook: { icon: Facebook, label: 'Facebook', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    email: { icon: Mail, label: 'E-mail', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    blog: { icon: Globe, label: 'Blog', color: 'var(--bo-accent)', bg: 'rgba(72,101,129,0.12)' },
    youtube: { icon: Youtube, label: 'YouTube', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    publicado: { label: 'Publicado', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
    agendado: { label: 'Agendado', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Clock },
    rascunho: { label: 'Rascunho', color: 'var(--bo-text-muted)', bg: 'var(--bo-elevated)', icon: AlertCircle },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDiasDoMes(ano: number, mes: number) {
    const primeiro = new Date(ano, mes, 1)
    const ultimo = new Date(ano, mes + 1, 0)
    const dias = []
    // Preenche dias anteriores
    for (let i = 0; i < primeiro.getDay(); i++) {
        dias.push(null)
    }
    for (let d = 1; d <= ultimo.getDate(); d++) {
        dias.push(d)
    }
    return dias
}

export default function CalendarioPage() {
    const router = useRouter()
    const hoje = new Date()
    const [anoMes, setAnoMes] = useState({ ano: 2026, mes: 1 }) // Fevereiro 2026
    const [view, setView] = useState<'mes' | 'semana' | 'lista'>('mes')
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
    const [filtroStatus, setFiltroStatus] = useState<string | null>(null)

    const dias = getDiasDoMes(anoMes.ano, anoMes.mes)

    const proximoMes = () => {
        setAnoMes(({ ano, mes }) => mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 })
        setDiaSelecionado(null)
    }
    const mesAnterior = () => {
        setAnoMes(({ ano, mes }) => mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 })
        setDiaSelecionado(null)
    }

    const conteudosDoDia = (dia: number) => {
        const dataStr = `${anoMes.ano}-${String(anoMes.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        return CONTEUDOS_CALENDARIO.filter(c => c.data === dataStr)
    }

    const conteudosFiltrados = CONTEUDOS_CALENDARIO.filter(c => {
        if (filtroTipo && c.tipo !== filtroTipo) return false
        if (filtroStatus && c.status !== filtroStatus) return false
        const mesConteudo = parseInt(c.data.split('-')[1]) - 1
        return mesConteudo === anoMes.mes
    })

    const conteudosDiaSelecionado = diaSelecionado
        ? conteudosDoDia(diaSelecionado)
        : []

    // Stats do mês
    const stats = {
        total: conteudosFiltrados.length,
        publicados: CONTEUDOS_CALENDARIO.filter(c => c.status === 'publicado' && parseInt(c.data.split('-')[1]) - 1 === anoMes.mes).length,
        agendados: CONTEUDOS_CALENDARIO.filter(c => c.status === 'agendado' && parseInt(c.data.split('-')[1]) - 1 === anoMes.mes).length,
        rascunhos: CONTEUDOS_CALENDARIO.filter(c => c.status === 'rascunho' && parseInt(c.data.split('-')[1]) - 1 === anoMes.mes).length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: T.text }}>Calendário Editorial</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                        Planejamento e agendamento de conteúdo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl p-1" style={{ background: T.elevated }}>
                        {(['mes', 'semana', 'lista'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
                                style={view === v
                                    ? { background: T.surface, color: T.text }
                                    : { color: T.textMuted }
                                }
                            >
                                {v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : 'Lista'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => router.push('/backoffice/conteudo/novo')}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} />
                        Novo
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total no Mês', value: stats.total, color: T.text, bg: T.elevated },
                    { label: 'Publicados', value: stats.publicados, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                    { label: 'Agendados', value: stats.agendados, color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
                    { label: 'Rascunhos', value: stats.rascunhos, color: T.textMuted, bg: T.elevated },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl p-4"
                        style={{ background: s.bg, border: `1px solid ${T.border}` }}
                    >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{s.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Filtrar:</span>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => {
                    const Icon = v.icon
                    const isActive = filtroTipo === k
                    return (
                        <button
                            key={k}
                            onClick={() => setFiltroTipo(isActive ? null : k)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
                            style={isActive
                                ? { background: v.bg, color: v.color, borderColor: v.color }
                                : { background: T.surface, borderColor: T.border, color: T.textMuted }
                            }
                        >
                            <Icon size={12} />
                            {v.label}
                        </button>
                    )
                })}
                <div className="w-px h-5" style={{ background: T.border }} />
                {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                    const isActive = filtroStatus === k
                    return (
                        <button
                            key={k}
                            onClick={() => setFiltroStatus(isActive ? null : k)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
                            style={isActive
                                ? { background: v.bg, color: v.color, borderColor: v.color }
                                : { background: T.surface, borderColor: T.border, color: T.textMuted }
                            }
                        >
                            {v.label}
                        </button>
                    )
                })}
            </div>

            {view === 'mes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Grade do calendário */}
                    <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        {/* Navegação do mês */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={mesAnterior}
                                className="w-9 h-9 flex items-center justify-center rounded-xl"
                                style={{ color: T.textMuted }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="text-lg font-bold" style={{ color: T.text }}>
                                {MESES[anoMes.mes]} {anoMes.ano}
                            </h2>
                            <button
                                onClick={proximoMes}
                                className="w-9 h-9 flex items-center justify-center rounded-xl"
                                style={{ color: T.textMuted }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Dias da semana */}
                        <div className="grid grid-cols-7 mb-2">
                            {DIAS_SEMANA.map(d => (
                                <div key={d} className="text-center text-xs font-bold py-1" style={{ color: T.textMuted }}>{d}</div>
                            ))}
                        </div>

                        {/* Grade de dias */}
                        <div className="grid grid-cols-7 gap-1">
                            {dias.map((dia, idx) => {
                                if (dia === null) return <div key={`empty-${idx}`} />
                                const conteudosDia = conteudosDoDia(dia)
                                const isHoje = anoMes.ano === hoje.getFullYear() &&
                                    anoMes.mes === hoje.getMonth() &&
                                    dia === hoje.getDate()
                                const isSelecionado = diaSelecionado === dia

                                return (
                                    <button
                                        key={dia}
                                        onClick={() => setDiaSelecionado(isSelecionado ? null : dia)}
                                        className="relative aspect-square p-1 rounded-xl text-sm transition-all"
                                        style={
                                            isSelecionado
                                                ? { background: T.accent, color: '#fff' }
                                                : isHoje
                                                    ? { background: 'rgba(72,101,129,0.2)', border: `1px solid ${T.accent}`, color: T.text, fontWeight: 700 }
                                                    : { color: conteudosDia.length > 0 ? T.text : T.textMuted }
                                        }
                                    >
                                        <span className="text-xs">{dia}</span>
                                        {conteudosDia.length > 0 && (
                                            <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                                {conteudosDia.slice(0, 3).map((c, i) => {
                                                    const cfg = TIPO_CONFIG[c.tipo]
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ background: isSelecionado ? 'rgba(255,255,255,0.7)' : cfg.color }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Painel lateral: conteúdos do dia / lista */}
                    <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        {diaSelecionado ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold" style={{ color: T.text }}>
                                        {diaSelecionado} de {MESES[anoMes.mes]}
                                    </h3>
                                    <button
                                        onClick={() => router.push('/backoffice/conteudo/novo')}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                                        style={{ background: 'rgba(72,101,129,0.12)', color: T.accent }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {conteudosDiaSelecionado.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calendar size={32} className="mx-auto mb-2" style={{ color: T.border }} />
                                        <p className="text-sm" style={{ color: T.textMuted }}>Nenhum conteúdo neste dia</p>
                                        <button
                                            onClick={() => router.push('/backoffice/conteudo/novo')}
                                            className="mt-3 text-xs font-medium hover:opacity-80"
                                            style={{ color: T.accent }}
                                        >
                                            + Adicionar conteúdo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {conteudosDiaSelecionado.map(c => {
                                            const tCfg = TIPO_CONFIG[c.tipo]
                                            const sCfg = STATUS_CONFIG[c.status]
                                            const TIcon = tCfg.icon
                                            return (
                                                <div key={c.id} className="p-3 rounded-xl border" style={{ background: tCfg.bg, borderColor: T.border }}>
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <TIcon size={14} style={{ color: tCfg.color }} />
                                                            <span className="text-xs font-medium" style={{ color: tCfg.color }}>{tCfg.label}</span>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: sCfg.color, background: sCfg.bg }}>
                                                            {sCfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium leading-tight" style={{ color: T.text }}>{c.titulo}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Clock size={11} style={{ color: T.textMuted }} />
                                                        <span className="text-xs" style={{ color: T.textMuted }}>{c.horario}</span>
                                                        <span className="text-xs" style={{ color: T.border }}>·</span>
                                                        <span className="text-xs truncate" style={{ color: T.textMuted }}>{c.autor}</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-2">
                                                        <button className="flex items-center gap-1 text-xs h-6 px-2 rounded-lg hover:opacity-80" style={{ color: T.textMuted }}>
                                                            <Eye size={11} />
                                                            Ver
                                                        </button>
                                                        <button className="flex items-center gap-1 text-xs h-6 px-2 rounded-lg hover:opacity-80" style={{ color: T.textMuted }}>
                                                            <Edit size={11} />
                                                            Editar
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>
                                    Próximas Publicações
                                </h3>
                                <div className="space-y-3">
                                    {conteudosFiltrados
                                        .filter(c => c.status !== 'publicado')
                                        .sort((a, b) => a.data.localeCompare(b.data))
                                        .slice(0, 6)
                                        .map(c => {
                                            const tCfg = TIPO_CONFIG[c.tipo]
                                            const sCfg = STATUS_CONFIG[c.status]
                                            const TIcon = tCfg.icon
                                            const dia = parseInt(c.data.split('-')[2])
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setDiaSelecionado(dia)}
                                                    className="w-full text-left p-3 rounded-xl transition-all"
                                                    style={{ border: `1px solid ${T.border}` }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <TIcon size={12} style={{ color: tCfg.color }} />
                                                            <span className="text-xs font-medium" style={{ color: tCfg.color }}>{tCfg.label}</span>
                                                        </div>
                                                        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: sCfg.color }}>
                                                            {dia}/{anoMes.mes + 1}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: T.text }}>{c.titulo}</p>
                                                </button>
                                            )
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {view === 'lista' && (
                <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    {conteudosFiltrados.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={40} className="mx-auto mb-3" style={{ color: T.border }} />
                            <p style={{ color: T.textMuted }}>Nenhum conteúdo encontrado com os filtros selecionados</p>
                        </div>
                    ) : (
                        conteudosFiltrados
                            .sort((a, b) => a.data.localeCompare(b.data))
                            .map(c => {
                                const tCfg = TIPO_CONFIG[c.tipo]
                                const sCfg = STATUS_CONFIG[c.status]
                                const TIcon = tCfg.icon
                                const StatusIcon = sCfg.icon
                                return (
                                    <div
                                        key={c.id}
                                        className="p-4 flex items-center justify-between transition-colors"
                                        style={{ borderBottom: `1px solid ${T.border}` }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tCfg.bg }}>
                                                <TIcon size={18} style={{ color: tCfg.color }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: T.text }}>{c.titulo}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs" style={{ color: T.textMuted }}>{c.autor}</span>
                                                    <span className="text-xs" style={{ color: T.border }}>·</span>
                                                    <div className="flex items-center gap-1 text-xs" style={{ color: T.textMuted }}>
                                                        <Clock size={10} />
                                                        {c.horario}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium" style={{ color: T.textMuted }}>
                                                {new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                                                    day: '2-digit', month: 'short'
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ color: sCfg.color, background: sCfg.bg }}>
                                                <StatusIcon size={11} />
                                                {sCfg.label}
                                            </span>
                                            <button
                                                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                                style={{ color: T.textMuted }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                    )}
                </div>
            )}

            {view === 'semana' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>
                        Vista semanal — implementar quando necessário
                    </p>
                </div>
            )}
        </div>
    )
}
