'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, MapPin, Edit, Building2, Calendar,
    Loader2, TrendingUp, Layers, DollarSign, Target,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function fmtCurrency(v: number) {
    if (!v) return '—'
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(0)}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
    return `R$ ${v}`
}

function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    planejamento:  { label: 'Planejamento',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    estruturacao:  { label: 'Estruturação',  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    em_andamento:  { label: 'Em Andamento',  color: T.accent, bg: 'rgba(72,101,129,0.12)' },
    concluido:     { label: 'Concluído',     color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    cancelado:     { label: 'Cancelado',     color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
}

export default function ProjetoDetalhePage() {
    const params = useParams()
    const router = useRouter()
    const [projeto, setProjeto] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            if (!params.id) return
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('projetos')
                    .select('*')
                    .eq('id', params.id)
                    .single()
                if (error) throw error
                setProjeto(data)
            } catch {
                toast.error('Projeto não encontrado')
                router.push('/backoffice/projetos')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [params.id, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (!projeto) {
        return (
            <div className="text-center py-32" style={{ color: T.textMuted }}>
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>Projeto não encontrado</p>
                <button onClick={() => router.back()} className="mt-4 text-sm font-medium hover:opacity-80" style={{ color: T.accent }}>
                    Voltar
                </button>
            </div>
        )
    }

    const statusInfo = STATUS_MAP[projeto.status] ?? { label: projeto.status ?? 'Indefinido', color: T.textMuted, bg: T.elevated }
    const progressVendas = projeto.unidades > 0
        ? Math.round((projeto.unidades_vendidas / projeto.unidades) * 100)
        : 0
    const localizacao = [projeto.cidade, projeto.estado].filter(Boolean).join(', ') || '—'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <button onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                        style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold" style={{ color: T.text }}>{projeto.nome}</h1>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                            <MapPin size={14} />
                            {localizacao}
                            {projeto.tipo && <span className="ml-1 opacity-60">· {projeto.tipo}</span>}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => router.push(`/backoffice/projetos/${params.id}/editar`)}
                    className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium transition-colors hover:brightness-110"
                    style={{ background: T.accent }}
                >
                    <Edit size={16} />
                    Editar
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} style={{ color: T.accent }} />
                        <p className="text-xs uppercase tracking-wider" style={{ color: T.textMuted }}>VGV</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{fmtCurrency(projeto.vgv)}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Layers size={16} className="text-blue-400" />
                        <p className="text-xs uppercase tracking-wider" style={{ color: T.textMuted }}>Unidades</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{projeto.unidades ?? '—'}</p>
                    {projeto.unidades > 0 && (
                        <p className="text-xs mt-1 text-green-500">{projeto.unidades_vendidas ?? 0} vendidas</p>
                    )}
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-purple-400" />
                        <p className="text-xs uppercase tracking-wider" style={{ color: T.textMuted }}>Área Total</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>
                        {projeto.area_total_m2 ? `${Number(projeto.area_total_m2).toLocaleString('pt-BR')} m²` : '—'}
                    </p>
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <p className="text-xs uppercase tracking-wider" style={{ color: T.textMuted }}>Vendas</p>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{progressVendas}%</p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>do total vendido</p>
                </div>
            </div>

            {/* Progresso de vendas */}
            {projeto.unidades > 0 && (
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium" style={{ color: T.text }}>Progresso de Vendas</span>
                        <span className="text-sm font-bold" style={{ color: T.text }}>
                            {projeto.unidades_vendidas ?? 0} / {projeto.unidades} unidades
                        </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                        <div className="h-full rounded-full transition-all bg-green-500" style={{ width: `${progressVendas}%` }} />
                    </div>
                </div>
            )}

            {/* Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sobre */}
                {projeto.descricao && (
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Sobre o Projeto</h2>
                        <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{projeto.descricao}</p>
                    </div>
                )}

                {/* Info lateral */}
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Informações</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Tipo', value: projeto.tipo },
                            { label: 'Fase', value: projeto.fase },
                            { label: 'Localização', value: localizacao },
                            { label: 'Data de Lançamento', value: fmtDate(projeto.data_lancamento), icon: Calendar },
                            { label: 'Entrega Prevista', value: fmtDate(projeto.data_entrega_prev), icon: Calendar },
                        ].filter(f => f.value && f.value !== '—').map(field => (
                            <div key={field.label} className="flex items-start justify-between">
                                <span className="text-xs" style={{ color: T.textMuted }}>{field.label}</span>
                                <span className="text-sm font-medium text-right ml-4" style={{ color: T.text }}>{field.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mapa */}
            {(projeto.latitude && projeto.longitude) && (
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                    <iframe
                        src={`https://www.google.com/maps?q=${projeto.latitude},${projeto.longitude}&z=15&output=embed`}
                        className="w-full h-64 border-0"
                        title="Localização do projeto"
                    />
                </div>
            )}

            {/* Imagem */}
            {projeto.imagem_url && (
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                    <img src={projeto.imagem_url} alt={projeto.nome} className="w-full h-64 object-cover" />
                </div>
            )}
        </div>
    )
}
