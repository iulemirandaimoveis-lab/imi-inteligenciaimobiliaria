'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ChevronLeft, ChevronRight, Plus, Instagram, Linkedin,
    Facebook, Mail, Globe, Youtube, Calendar, Clock,
    CheckCircle, AlertCircle, Edit, Eye, Loader2, RefreshCw,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { createClient } from '@/lib/supabase/client'

interface ConteudoItem {
    id: string
    titulo: string
    tipo: string
    canal: string | null
    status: string
    agendado_para: string | null
    publicado_em: string | null
    data_publicacao: string | null
}

const TIPO_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    instagram: { icon: Instagram, label: 'Instagram', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
    linkedin:  { icon: Linkedin,  label: 'LinkedIn',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    facebook:  { icon: Facebook,  label: 'Facebook',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    email:     { icon: Mail,      label: 'E-mail',    color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    blog:      { icon: Globe,     label: 'Blog',      color: 'var(--bo-accent)', bg: 'rgba(72,101,129,0.12)' },
    youtube:   { icon: Youtube,   label: 'YouTube',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    publicado: { label: 'Publicado', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
    agendado:  { label: 'Agendado',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Clock },
    rascunho:  { label: 'Rascunho',  color: 'var(--bo-text-muted)', bg: 'var(--bo-elevated)', icon: AlertCircle },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDiasDoMes(ano: number, mes: number) {
    const primeiro = new Date(ano, mes, 1)
    const ultimo = new Date(ano, mes + 1, 0)
    const dias: (number | null)[] = []
    for (let i = 0; i < primeiro.getDay(); i++) dias.push(null)
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
    return dias
}

function getDateStr(item: ConteudoItem): string | null {
    const ts = item.agendado_para || item.publicado_em || item.data_publicacao
    if (!ts) return null
    return ts.split('T')[0]
}

function getHora(item: ConteudoItem): string {
    const ts = item.agendado_para || item.publicado_em
    if (!ts || !ts.includes('T')) return ''
    return ts.split('T')[1].slice(0, 5)
}

function getTipoKey(item: ConteudoItem): string {
    return (item.canal || item.tipo || 'blog').toLowerCase()
}

export default function CalendarioPage() {
    const router = useRouter()
    const hoje = new Date()
    const [anoMes, setAnoMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() })
    const [view, setView] = useState<'mes' | 'semana' | 'lista'>('mes')
    const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
    const [filtroStatus, setFiltroStatus] = useState<string | null>(null)
    const [conteudos, setConteudos] = useState<ConteudoItem[]>([])
    const [loading, setLoading] = useState(true)

    const dias = getDiasDoMes(anoMes.ano, anoMes.mes)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const supabase = createClient()
                const mesInicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString()
                const mesFim = new Date(anoMes.ano, anoMes.mes + 1, 0, 23, 59, 59).toISOString()

                const { data } = await supabase
                    .from('conteudos')
                    .select('id, titulo, tipo, canal, status, agendado_para, publicado_em, data_publicacao')
                    .or(`agendado_para.gte.${mesInicio},publicado_em.gte.${mesInicio},data_publicacao.gte.${mesInicio}`)
                    .or(`agendado_para.lte.${mesFim},publicado_em.lte.${mesFim},data_publicacao.lte.${mesFim}`)
                    .order('agendado_para', { ascending: true })

                setConteudos(data || [])
            } catch {
                // silently handle — show empty state
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [anoMes])

    const proximoMes = () => {
        setAnoMes(({ ano, mes }) => mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 })
        setDiaSelecionado(null)
    }
    const mesAnterior = () => {
        setAnoMes(({ ano, mes }) => mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 })
        setDiaSelecionado(null)
    }

    const conteudosFiltrados = conteudos.filter(c => {
        if (filtroTipo && getTipoKey(c) !== filtroTipo) return false
        if (filtroStatus && c.status !== filtroStatus) return false
        const dataStr = getDateStr(c)
        if (!dataStr) return false
        const [yr, mo] = dataStr.split('-').map(Number)
        return yr === anoMes.ano && mo - 1 === anoMes.mes
    })

    const conteudosDoDia = (dia: number) => {
        const dataStr = `${anoMes.ano}-${String(anoMes.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        return conteudosFiltrados.filter(c => getDateStr(c) === dataStr)
    }

    const conteudosDiaSelecionado = diaSelecionado ? conteudosDoDia(diaSelecionado) : []

    const stats = {
        total: conteudosFiltrados.length,
        publicados: conteudosFiltrados.filter(c => c.status === 'publicado').length,
        agendados: conteudosFiltrados.filter(c => c.status === 'agendado').length,
        rascunhos: conteudosFiltrados.filter(c => c.status === 'rascunho').length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONTEÚDO"
                title="Calendário Editorial"
                subtitle="Planejamento e agendamento de conteúdo"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAnoMes({ ano: hoje.getFullYear(), mes: hoje.getMonth() })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
                            title="Ir para hoje"
                        >
                            <RefreshCw size={15} />
                        </button>
                        <div className="flex rounded-xl p-1" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                            {(['mes', 'lista'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
                                    style={view === v
                                        ? { background: T.surface, color: T.text, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }
                                        : { color: T.textMuted }
                                    }
                                >
                                    {v === 'mes' ? 'Mês' : 'Lista'}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push('/backoffice/conteudo/novo')}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
                            style={{ background: T.accent, boxShadow: '0 0 16px rgba(59,130,246,0.28)' }}
                        >
                            <Plus size={16} />
                            Novo
                        </button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total no Mês', value: stats.total, color: T.text, bg: T.elevated, accent: 'rgba(59,130,246,0.08)' },
                    { label: 'Publicados', value: stats.publicados, color: '#10B981', bg: 'rgba(16,185,129,0.10)', accent: 'rgba(16,185,129,0.08)' },
                    { label: 'Agendados', value: stats.agendados, color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', accent: 'rgba(96,165,250,0.08)' },
                    { label: 'Rascunhos', value: stats.rascunhos, color: T.textMuted, bg: T.elevated, accent: 'rgba(59,130,246,0.04)' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4 transition-all" style={{
                        background: s.bg,
                        border: `1px solid ${T.border}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        backgroundImage: `linear-gradient(135deg, ${s.accent} 0%, transparent 60%)`,
                    }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: T.textMuted }}>{s.label}</p>
                        <p className="text-4xl font-bold mt-1" style={{ color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                            {loading ? '—' : s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Canal:</span>
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

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : (
                <>
                    {view === 'mes' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendário */}
                            <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: 'var(--bo-card-shadow, 0 4px 24px rgba(0,0,0,0.18))', backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 50%)' }}>
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={mesAnterior} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: T.textMuted }}>
                                        <ChevronLeft size={18} />
                                    </button>
                                    <h2 className="text-lg font-bold" style={{ color: T.text }}>
                                        {MESES[anoMes.mes]} {anoMes.ano}
                                    </h2>
                                    <button onClick={proximoMes} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ color: T.textMuted }}>
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-7 mb-2">
                                    {DIAS_SEMANA.map(d => (
                                        <div key={d} className="text-center text-xs font-bold py-1" style={{ color: T.textMuted }}>{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {dias.map((dia, idx) => {
                                        if (dia === null) return <div key={`empty-${idx}`} />
                                        const items = conteudosDoDia(dia)
                                        const isHoje = anoMes.ano === hoje.getFullYear() && anoMes.mes === hoje.getMonth() && dia === hoje.getDate()
                                        const isSel = diaSelecionado === dia
                                        return (
                                            <button
                                                key={dia}
                                                onClick={() => setDiaSelecionado(isSel ? null : dia)}
                                                className="relative aspect-square p-1 rounded-xl text-sm transition-all"
                                                style={
                                                    isSel ? { background: T.accent, color: '#fff' }
                                                    : isHoje ? { background: 'rgba(72,101,129,0.2)', border: `1px solid ${T.accent}`, color: T.text, fontWeight: 700 }
                                                    : { color: items.length > 0 ? T.text : T.textMuted }
                                                }
                                            >
                                                <span className="text-xs">{dia}</span>
                                                {items.length > 0 && (
                                                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                                                        {items.slice(0, 3).map((c, i) => {
                                                            const cfg = TIPO_CONFIG[getTipoKey(c)] ?? TIPO_CONFIG.blog
                                                            return <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? 'rgba(255,255,255,0.7)' : cfg.color }} />
                                                        })}
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Painel lateral */}
                            <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: 'var(--bo-card-shadow, 0 4px 24px rgba(0,0,0,0.18)), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                                {diaSelecionado ? (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold" style={{ color: T.text }}>
                                                {diaSelecionado} de {MESES[anoMes.mes]}
                                            </h3>
                                            <button onClick={() => router.push('/backoffice/conteudo/novo')}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg"
                                                style={{ background: 'rgba(72,101,129,0.12)', color: T.accent }}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        {conteudosDiaSelecionado.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Calendar size={32} className="mx-auto mb-2" style={{ color: T.border }} />
                                                <p className="text-sm" style={{ color: T.textMuted }}>Nenhum conteúdo neste dia</p>
                                                <button onClick={() => router.push('/backoffice/conteudo/novo')} className="mt-3 text-xs font-medium hover:opacity-80" style={{ color: T.accent }}>
                                                    + Adicionar conteúdo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {conteudosDiaSelecionado.map(c => {
                                                    const tKey = getTipoKey(c)
                                                    const tCfg = TIPO_CONFIG[tKey] ?? TIPO_CONFIG.blog
                                                    const sCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.rascunho
                                                    const TIcon = tCfg.icon
                                                    const hora = getHora(c)
                                                    return (
                                                        <div key={c.id} className="p-3 rounded-xl border" style={{ background: tCfg.bg, borderColor: T.border }}>
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <TIcon size={14} style={{ color: tCfg.color }} />
                                                                    <span className="text-xs font-medium" style={{ color: tCfg.color }}>{tCfg.label}</span>
                                                                </div>
                                                                <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: sCfg.color, background: sCfg.bg }}>{sCfg.label}</span>
                                                            </div>
                                                            <p className="text-sm font-medium leading-tight" style={{ color: T.text }}>{c.titulo}</p>
                                                            {hora && (
                                                                <div className="flex items-center gap-1 mt-1.5">
                                                                    <Clock size={11} style={{ color: T.textMuted }} />
                                                                    <span className="text-xs" style={{ color: T.textMuted }}>{hora}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1 mt-2">
                                                                <button className="flex items-center gap-1 text-xs h-6 px-2 rounded-lg hover:opacity-80" style={{ color: T.textMuted }}>
                                                                    <Eye size={11} />Ver
                                                                </button>
                                                                <button onClick={() => router.push(`/backoffice/conteudo/${c.id}/editar`)} className="flex items-center gap-1 text-xs h-6 px-2 rounded-lg hover:opacity-80" style={{ color: T.textMuted }}>
                                                                    <Edit size={11} />Editar
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
                                        <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Próximas Publicações</h3>
                                        {conteudosFiltrados.filter(c => c.status !== 'publicado').length === 0 ? (
                                            <div className="text-center py-8">
                                                <Calendar size={28} className="mx-auto mb-2 opacity-30" style={{ color: T.textMuted }} />
                                                <p className="text-sm" style={{ color: T.textMuted }}>Nenhum agendamento pendente</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {conteudosFiltrados.filter(c => c.status !== 'publicado')
                                                    .sort((a, b) => (getDateStr(a) ?? '').localeCompare(getDateStr(b) ?? ''))
                                                    .slice(0, 6)
                                                    .map(c => {
                                                        const tKey = getTipoKey(c)
                                                        const tCfg = TIPO_CONFIG[tKey] ?? TIPO_CONFIG.blog
                                                        const sCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.rascunho
                                                        const TIcon = tCfg.icon
                                                        const dateStr = getDateStr(c)
                                                        const dia = dateStr ? parseInt(dateStr.split('-')[2]) : null
                                                        return (
                                                            <button key={c.id} onClick={() => dia && setDiaSelecionado(dia)}
                                                                className="w-full text-left p-3 rounded-xl transition-all"
                                                                style={{ border: `1px solid ${T.border}` }}>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <TIcon size={12} style={{ color: tCfg.color }} />
                                                                        <span className="text-xs font-medium" style={{ color: tCfg.color }}>{tCfg.label}</span>
                                                                    </div>
                                                                    {dia && <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: sCfg.color }}>dia {dia}</span>}
                                                                </div>
                                                                <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: T.text }}>{c.titulo}</p>
                                                            </button>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'lista' && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: 'var(--bo-card-shadow, 0 4px 24px rgba(0,0,0,0.18))', backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 40%)' }}>
                            {conteudosFiltrados.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar size={40} className="mx-auto mb-3" style={{ color: T.border }} />
                                    <p style={{ color: T.textMuted }}>Nenhum conteúdo neste mês</p>
                                    <button onClick={() => router.push('/backoffice/conteudo/novo')} className="mt-3 text-sm font-medium hover:opacity-80" style={{ color: T.accent }}>
                                        + Criar conteúdo
                                    </button>
                                </div>
                            ) : (
                                conteudosFiltrados
                                    .sort((a, b) => (getDateStr(a) ?? '').localeCompare(getDateStr(b) ?? ''))
                                    .map(c => {
                                        const tKey = getTipoKey(c)
                                        const tCfg = TIPO_CONFIG[tKey] ?? TIPO_CONFIG.blog
                                        const sCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.rascunho
                                        const TIcon = tCfg.icon
                                        const StatusIcon = sCfg.icon
                                        const dateStr = getDateStr(c)
                                        const hora = getHora(c)
                                        return (
                                            <div key={c.id} className="p-4 flex items-center justify-between group" style={{ borderBottom: `1px solid ${T.border}`, transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tCfg.bg }}>
                                                        <TIcon size={18} style={{ color: tCfg.color }} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: T.text }}>{c.titulo}</p>
                                                        {hora && (
                                                            <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: T.textMuted }}>
                                                                <Clock size={10} />
                                                                {hora}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {dateStr && (
                                                        <span className="text-sm font-medium" style={{ color: T.textMuted }}>
                                                            {new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ color: sCfg.color, background: sCfg.bg }}>
                                                        <StatusIcon size={11} />
                                                        {sCfg.label}
                                                    </span>
                                                    <button onClick={() => router.push(`/backoffice/conteudo/${c.id}/editar`)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: T.textMuted }}>
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
