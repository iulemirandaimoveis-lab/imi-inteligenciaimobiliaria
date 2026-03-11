'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, FileText, MapPin, Bed, Bath, Ruler, Car,
    DollarSign, Calendar, CheckCircle, Award, User, Phone, Mail,
    Download, Edit, Loader2, AlertTriangle, Trash2, Home,
    TrendingUp, BarChart2, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const STATUS_CFG: Record<string, { label: string; text: string; bg: string }> = {
    concluida: { label: 'Concluída', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    em_andamento: { label: 'Em Andamento', text: 'var(--bo-accent)', bg: 'var(--bo-active-bg)' },
    aguardando_docs: { label: 'Aguard. Docs', text: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
    cancelada: { label: 'Cancelada', text: '#E57373', bg: 'rgba(229,115,115,0.12)' },
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)

export default function AvaliacaoDetalhesPage() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'info'>('overview')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [comps, setComps] = useState<{ count: number; avgM2: number; minM2: number; maxM2: number } | null>(null)
    const [aiAnalysis, setAiAnalysis] = useState<any>(null)
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        async function fetchAvaliacao() {
            try {
                const res = await fetch(`/api/avaliacoes?id=${params.id}`)
                if (!res.ok) throw new Error('Falha ao carregar avaliação')
                const result = await res.json()
                setData(result)
                // Fire Claude analysis
                setAiLoading(true)
                fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'avaliacao', data: result }),
                })
                    .then(r => r.json())
                    .then(res2 => { if (res2.analysis) setAiAnalysis(res2.analysis) })
                    .catch(() => {})
                    .finally(() => setAiLoading(false))
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAvaliacao()
    }, [params.id])

    // Fetch neighborhood comps from developments table
    useEffect(() => {
        if (!data?.bairro) return
        const supabase = createClient()
        supabase
            .from('developments')
            .select('price_min, price_max, area_min_sqm, area_max_sqm')
            .eq('bairro', data.bairro)
            .eq('status_commercial', 'published')
            .then(({ data: devs }) => {
                if (!devs?.length) return
                const prices = devs
                    .map(d => {
                        const price = (Number(d.price_min || 0) + Number(d.price_max || d.price_min || 0)) / 2
                        const area = (Number(d.area_min_sqm || 0) + Number(d.area_max_sqm || d.area_min_sqm || 0)) / 2
                        return area > 0 ? price / area : 0
                    })
                    .filter(p => p > 1000 && p < 100000) // sanity range
                if (prices.length < 2) return
                const avg = prices.reduce((s, p) => s + p, 0) / prices.length
                setComps({
                    count: prices.length,
                    avgM2: Math.round(avg),
                    minM2: Math.round(Math.min(...prices)),
                    maxM2: Math.round(Math.max(...prices)),
                })
            })
    }, [data?.bairro])

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/avaliacoes?id=${params.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao cancelar')
            toast.success('Avaliação cancelada')
            router.push('/backoffice/avaliacoes')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const res = await fetch('/api/avaliacoes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: params.id, status: newStatus }),
            })
            if (!res.ok) throw new Error('Falha ao atualizar')
            setData({ ...data, status: newStatus })
            toast.success(`Status atualizado para ${STATUS_CFG[newStatus]?.label || newStatus}`)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                    <p className="text-lg font-bold mb-2" style={{ color: T.text }}>{error || 'Avaliação não encontrada'}</p>
                    <button onClick={() => router.push('/backoffice/avaliacoes')}
                        className="mt-4 px-4 py-2 rounded-xl text-white text-sm" style={{ backgroundColor: T.accent }}>
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    const sc = STATUS_CFG[data.status] || STATUS_CFG.em_andamento
    const caracteristicas = Array.isArray(data.caracteristicas) ? data.caracteristicas : []

    // Value range derived values for confidence bar
    const rangeMin = Number(data.valor_minimo || 0)
    const rangeMax = Number(data.valor_maximo || 0)
    const rangeEst = Number(data.valor_estimado || 0)
    const hasRange = rangeMin > 0 && rangeMax > 0 && rangeEst > 0 && rangeMax > rangeMin
    const rangePct = hasRange
        ? Math.max(5, Math.min(95, ((rangeEst - rangeMin) / (rangeMax - rangeMin)) * 100))
        : 50
    const rangeSpread = hasRange ? ((rangeMax - rangeMin) / rangeEst * 100) : 0
    const rangeConf = rangeSpread < 10
        ? { label: 'Alta Confiança', color: '#10B981', bg: 'rgba(16,185,129,0.12)' }
        : rangeSpread < 20
        ? { label: 'Média Confiança', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
        : { label: 'Confiança Baixa', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="AVALIAÇÕES · DETALHES"
                title={data.protocolo || `AVL-${data.id?.slice(0, 8)}`}
                subtitle={`${data.cliente_nome || '—'} · ${data.tipo_imovel || ''} — ${data.bairro || ''}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: T.card, border: `1px solid ${T.border}` }}
                        >
                            <ArrowLeft size={18} style={{ color: T.text }} />
                        </button>
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ color: sc.text, background: sc.bg }}>
                            {sc.label}
                        </span>
                        {data.laudo_url && (
                            <a href={data.laudo_url} target="_blank" rel="noopener noreferrer"
                                className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium hover:opacity-80"
                                style={{ border: `1px solid ${T.border}`, color: T.text }}>
                                <Download size={16} /> PDF
                            </a>
                        )}
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="h-10 px-3 rounded-xl text-sm font-medium hover:bg-red-500/20"
                            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                }
            />

            {showDeleteConfirm && (
                <div className="rounded-xl p-4 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-sm" style={{ color: T.text }}>Cancelar avaliação <strong>{data.protocolo}</strong>?</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: T.textMuted }}>Não</button>
                        <button onClick={handleDelete} disabled={deleting}
                            className="px-4 py-2 rounded-lg text-white text-sm bg-red-500 disabled:opacity-50">
                            {deleting ? 'Cancelando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Workflow */}
            {data.status !== 'cancelada' && data.status !== 'concluida' && (
                <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Atualizar Status</p>
                    <div className="flex gap-2 flex-wrap">
                        {['aguardando_docs', 'em_andamento', 'concluida'].map(s => {
                            const cfg = STATUS_CFG[s]
                            if (!cfg || s === data.status) return null
                            return (
                                <button key={s} onClick={() => handleStatusUpdate(s)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80"
                                    style={{ color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.text}30` }}>
                                    {cfg.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.valor_estimado && (
                    <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight" style={{ color: T.textDim }}>Valor Avaliado</p>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
                                <TrendingUp size={14} style={{ color: '#10B981' }} />
                            </div>
                        </div>
                        <p className="text-lg font-bold leading-tight" style={{ color: '#10B981' }}>{formatPrice(Number(data.valor_estimado))}</p>
                    </div>
                )}
                {data.valor_m2 && (
                    <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight" style={{ color: T.textDim }}>Preço/m²</p>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
                                <BarChart2 size={14} style={{ color: '#8B5CF6' }} />
                            </div>
                        </div>
                        <p className="text-lg font-bold leading-tight" style={{ color: 'var(--bo-accent)' }}>{formatPrice(Number(data.valor_m2))}/m²</p>
                    </div>
                )}
                {data.area_privativa && (
                    <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight" style={{ color: T.textDim }}>Área Privativa</p>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.08)' }}>
                                <Ruler size={14} style={{ color: '#10B981' }} />
                            </div>
                        </div>
                        <p className="text-lg font-bold leading-tight" style={{ color: T.text }}>{data.area_privativa} m²</p>
                    </div>
                )}
                {data.honorarios && (
                    <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight" style={{ color: T.textDim }}>Honorários</p>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                                <DollarSign size={14} style={{ color: '#F59E0B' }} />
                            </div>
                        </div>
                        <p className="text-lg font-bold leading-tight" style={{ color: T.accent }}>{formatPrice(Number(data.honorarios))}</p>
                        {data.honorarios_status && (
                            <p className="text-[10px] font-bold mt-1.5" style={{
                                color: data.honorarios_status === 'pago' ? '#6BB87B' : data.honorarios_status === 'parcial' ? 'var(--bo-accent)' : '#E8A87C'
                            }}>
                                ● {data.honorarios_status === 'pago' ? 'Pago' : data.honorarios_status === 'parcial' ? 'Parcial' : 'Pendente'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex gap-6">
                    {([
                        { key: 'overview', label: 'Visão Geral' },
                        { key: 'info', label: 'Todas Informações' },
                    ] as const).map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className="pb-4 px-2 text-sm font-medium transition-colors"
                            style={{
                                borderBottom: `2px solid ${activeTab === tab.key ? T.accent : 'transparent'}`,
                                color: activeTab === tab.key ? T.accent : T.textMuted,
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Property Data */}
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Dados do Imóvel</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Endereço</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>
                                        {data.endereco}{data.complemento ? ` - ${data.complemento}` : ''}
                                    </p>
                                    <p className="text-sm" style={{ color: T.textMuted }}>
                                        {data.bairro}, {data.cidade}/{data.estado}{data.cep ? ` - CEP: ${data.cep}` : ''}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                    {data.quartos != null && (
                                        <div className="text-center">
                                            <Bed size={24} className="mx-auto mb-2" style={{ color: 'var(--bo-accent)' }} />
                                            <p className="text-xl font-bold" style={{ color: T.text }}>{data.quartos}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>Quartos</p>
                                        </div>
                                    )}
                                    {data.banheiros != null && (
                                        <div className="text-center">
                                            <Bath size={24} className="mx-auto mb-2" style={{ color: '#8B5CF6' }} />
                                            <p className="text-xl font-bold" style={{ color: T.text }}>{data.banheiros}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>Banheiros</p>
                                        </div>
                                    )}
                                    {data.area_privativa != null && (
                                        <div className="text-center">
                                            <Ruler size={24} className="mx-auto mb-2" style={{ color: '#10B981' }} />
                                            <p className="text-xl font-bold" style={{ color: T.text }}>{data.area_privativa}m²</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>Área</p>
                                        </div>
                                    )}
                                    {data.vagas != null && (
                                        <div className="text-center">
                                            <Car size={24} className="mx-auto mb-2" style={{ color: '#F59E0B' }} />
                                            <p className="text-xl font-bold" style={{ color: T.text }}>{data.vagas}</p>
                                            <p className="text-xs" style={{ color: T.textMuted }}>Vagas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        {caracteristicas.length > 0 && (
                            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Características</h2>
                                <div className="flex flex-wrap gap-2">
                                    {caracteristicas.map((f: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg text-sm"
                                            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--bo-accent)' }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Value Range — Zillow-style confidence bar */}
                        {(data.valor_minimo || data.valor_maximo || data.valor_estimado) && (
                            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Intervalo de Valores</h2>
                                    {hasRange && (
                                        <span className="text-xs font-bold px-3 py-1 rounded-full"
                                            style={{ color: rangeConf.color, background: rangeConf.bg }}>
                                            {rangeConf.label}
                                        </span>
                                    )}
                                </div>

                                {hasRange ? (
                                    <>
                                        {/* Range bar with floating label */}
                                        <div className="pt-14 relative mb-1">
                                            {/* Floating estimated value label above marker */}
                                            <div className="absolute top-0 text-center pointer-events-none"
                                                style={{ left: `${rangePct}%`, transform: 'translateX(-50%)' }}>
                                                <p className="text-sm font-bold whitespace-nowrap" style={{ color: '#10B981' }}>
                                                    {formatPrice(rangeEst)}
                                                </p>
                                                <p className="text-[10px] mb-1" style={{ color: T.textDim }}>Avaliado</p>
                                                <div className="mx-auto w-px h-3" style={{ background: 'rgba(16,185,129,0.45)' }} />
                                            </div>

                                            {/* Gradient bar */}
                                            <div className="relative h-3 rounded-full"
                                                style={{ background: 'rgba(99,102,241,0.12)' }}>
                                                {/* Filled portion */}
                                                <div className="absolute inset-y-0 left-0 rounded-full"
                                                    style={{
                                                        width: `${rangePct}%`,
                                                        background: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
                                                    }} />
                                                {/* Marker dot */}
                                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{
                                                        left: `${rangePct}%`,
                                                        background: 'white',
                                                        border: '2.5px solid #10B981',
                                                        boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                                                    }}>
                                                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Min / Max labels */}
                                        <div className="flex justify-between mt-3">
                                            <div>
                                                <p className="text-xs font-semibold" style={{ color: T.text }}>{formatPrice(rangeMin)}</p>
                                                <p className="text-[10px]" style={{ color: T.textDim }}>Mínimo</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold" style={{ color: T.text }}>{formatPrice(rangeMax)}</p>
                                                <p className="text-[10px]" style={{ color: T.textDim }}>Máximo</p>
                                            </div>
                                        </div>

                                        {/* Stats strip */}
                                        <div className="grid grid-cols-2 gap-3 mt-5 pt-4"
                                            style={{ borderTop: `1px solid ${T.border}` }}>
                                            <div className="rounded-xl p-3 text-center"
                                                style={{ background: 'rgba(99,102,241,0.06)' }}>
                                                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textDim }}>Spread</p>
                                                <p className="text-sm font-bold" style={{ color: T.text }}>{rangeSpread.toFixed(1)}%</p>
                                            </div>
                                            <div className="rounded-xl p-3 text-center"
                                                style={{ background: 'rgba(99,102,241,0.06)' }}>
                                                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textDim }}>Margem</p>
                                                <p className="text-sm font-bold" style={{ color: T.text }}>
                                                    ±{((rangeMax - rangeEst) / rangeEst * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Fallback: show available values as rows */
                                    <div className="space-y-2 text-sm">
                                        {data.valor_minimo && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textMuted }}>Mínimo</span>
                                                <span className="font-medium" style={{ color: T.text }}>{formatPrice(Number(data.valor_minimo))}</span>
                                            </div>
                                        )}
                                        {data.valor_estimado && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textMuted }}>Avaliado</span>
                                                <span className="font-bold" style={{ color: '#10B981' }}>{formatPrice(Number(data.valor_estimado))}</span>
                                            </div>
                                        )}
                                        {data.valor_maximo && (
                                            <div className="flex justify-between">
                                                <span style={{ color: T.textMuted }}>Máximo</span>
                                                <span className="font-medium" style={{ color: T.text }}>{formatPrice(Number(data.valor_maximo))}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Neighborhood price benchmark — Comparativo de Bairro */}
                        {comps && data.valor_m2 && (
                            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-bold" style={{ color: T.text }}>Comparativo de Bairro</h2>
                                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                        style={{ background: 'rgba(72,101,129,0.12)', color: T.textMuted }}>
                                        {comps.count} empreend. em {data.bairro}
                                    </span>
                                </div>

                                {/* Price/m² comparison grid */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="rounded-xl p-3 text-center"
                                        style={{ background: 'rgba(16,185,129,0.06)' }}>
                                        <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textDim }}>Mín. Bairro</p>
                                        <p className="text-sm font-bold" style={{ color: T.text }}>
                                            R$ {comps.minM2.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>/m²</p>
                                    </div>
                                    <div className="rounded-xl p-3 text-center"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                        <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textDim }}>Média Bairro</p>
                                        <p className="text-sm font-bold" style={{ color: T.accent }}>
                                            R$ {comps.avgM2.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>/m²</p>
                                    </div>
                                    <div className="rounded-xl p-3 text-center"
                                        style={{ background: 'rgba(239,68,68,0.06)' }}>
                                        <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textDim }}>Máx. Bairro</p>
                                        <p className="text-sm font-bold" style={{ color: T.text }}>
                                            R$ {comps.maxM2.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-[10px]" style={{ color: T.textDim }}>/m²</p>
                                    </div>
                                </div>

                                {/* Verdict: this property vs neighborhood avg */}
                                {(() => {
                                    const propM2 = Number(data.valor_m2)
                                    const ratio = propM2 / comps.avgM2
                                    const isPremium = ratio > 1.1
                                    const isBelowMarket = ratio < 0.9
                                    const verdictLabel = isPremium
                                        ? `${((ratio - 1) * 100).toFixed(0)}% acima da média`
                                        : isBelowMarket
                                        ? `${((1 - ratio) * 100).toFixed(0)}% abaixo da média`
                                        : 'Na média do bairro'
                                    const verdictColor = isPremium ? '#F59E0B' : isBelowMarket ? '#10B981' : '#3B82F6'
                                    return (
                                        <div className="flex items-center gap-3 p-3 rounded-xl"
                                            style={{ background: `${verdictColor}12`, border: `1px solid ${verdictColor}30` }}>
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${verdictColor}20` }}>
                                                <MapPin size={15} style={{ color: verdictColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold" style={{ color: verdictColor }}>
                                                    {verdictLabel}
                                                </p>
                                                <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>
                                                    Este imóvel: R$ {propM2.toLocaleString('pt-BR')}/m² · Média {data.bairro}: R$ {comps.avgM2.toLocaleString('pt-BR')}/m²
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Client */}
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Cliente</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Nome</p>
                                    <p className="font-medium" style={{ color: T.text }}>{data.cliente_nome || '—'}</p>
                                </div>
                                {data.cliente_email && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>E-mail</p>
                                        <p className="text-sm" style={{ color: T.accent }}>{data.cliente_email}</p>
                                    </div>
                                )}
                                {data.cliente_telefone && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Telefone</p>
                                        <p className="text-sm" style={{ color: T.accent }}>{data.cliente_telefone}</p>
                                    </div>
                                )}
                                {data.cliente_cpf_cnpj && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>CPF/CNPJ</p>
                                        <p className="text-sm font-mono" style={{ color: T.text }}>{data.cliente_cpf_cnpj}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Evaluation Details */}
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Avaliação</h3>
                            <div className="space-y-3">
                                {data.finalidade && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Finalidade</p>
                                        <p className="text-sm font-medium" style={{ color: T.text }}>{data.finalidade}</p>
                                    </div>
                                )}
                                {data.metodologia && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Metodologia</p>
                                        <p className="text-sm font-medium" style={{ color: T.text }}>{data.metodologia}</p>
                                    </div>
                                )}
                                {data.grau_fundamentacao && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Grau Fundamentação</p>
                                        <p className="text-sm font-medium" style={{ color: T.text }}>Grau {data.grau_fundamentacao}</p>
                                    </div>
                                )}
                                {data.prazo_entrega && (
                                    <div>
                                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Prazo Entrega</p>
                                        <p className="text-sm font-medium" style={{ color: T.text }}>
                                            {new Date(data.prazo_entrega).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Intelligence Card */}
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: '1px solid var(--bo-border-gold)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,166,90,0.15)' }}>
                                    {aiLoading ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--imi-ai-gold)' }} /> : <Sparkles size={13} style={{ color: 'var(--imi-ai-gold)' }} />}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--imi-ai-gold)' }}>
                                    AI Valuation Intelligence
                                </span>
                            </div>
                            {aiLoading ? (
                                <p className="text-xs" style={{ color: T.textMuted }}>Analisando imóvel com Claude AI...</p>
                            ) : aiAnalysis ? (
                                <>
                                    <p className="text-xs mb-3" style={{ color: T.text, lineHeight: 1.65 }}>{aiAnalysis.insight}</p>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {aiAnalysis.investmentGrade && (
                                            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textMuted }}>Grau Invest.</p>
                                                <p className="text-lg font-bold" style={{
                                                    color: aiAnalysis.investmentGrade === 'A' ? '#10B981' : aiAnalysis.investmentGrade === 'B' ? '#3B82F6' : aiAnalysis.investmentGrade === 'C' ? '#F59E0B' : '#EF4444'
                                                }}>{aiAnalysis.investmentGrade}</p>
                                            </div>
                                        )}
                                        {aiAnalysis.marketTrend && (
                                            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textMuted }}>Tendência</p>
                                                <p className="text-sm font-bold" style={{
                                                    color: aiAnalysis.marketTrend === 'alta' ? '#10B981' : aiAnalysis.marketTrend === 'queda' ? '#EF4444' : '#F59E0B'
                                                }}>{aiAnalysis.marketTrend}</p>
                                            </div>
                                        )}
                                    </div>
                                    {aiAnalysis.priceAnalysis && (
                                        <p className="text-[11px] mb-2" style={{ color: T.textMuted }}>💰 {aiAnalysis.priceAnalysis}</p>
                                    )}
                                    {aiAnalysis.recommendation && (
                                        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>Recomendação</p>
                                            <p className="text-xs" style={{ color: T.text }}>{aiAnalysis.recommendation}</p>
                                        </div>
                                    )}
                                    {aiAnalysis.keyFactor && (
                                        <p className="text-[11px] mt-2" style={{ color: T.textMuted }}>🔑 {aiAnalysis.keyFactor}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs" style={{ color: T.textMuted }}>Análise IA não disponível.</p>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Cronograma</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Criada em</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>
                                        {data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Atualizada em</p>
                                    <p className="text-sm font-medium" style={{ color: T.text }}>
                                        {data.updated_at ? new Date(data.updated_at).toLocaleDateString('pt-BR') : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'info' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Todas as Informações</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(data).map(([key, value]) => {
                            if (value == null || value === '' || value === '{}') return null
                            const display = typeof value === 'object' ? JSON.stringify(value) : String(value)
                            return (
                                <div key={key} className={key === 'observacoes' || key === 'caracteristicas' ? 'md:col-span-2' : ''}>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>{key}</p>
                                    <p className="text-sm font-medium break-all" style={{ color: T.text }}>{display}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
