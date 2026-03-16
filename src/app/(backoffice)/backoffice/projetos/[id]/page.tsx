'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, MapPin, Edit, Building2, Calendar, Loader2, TrendingUp,
    Layers, DollarSign, Target, FileUp, Ruler, Eye, Upload,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import FloorPlanGallery from '@/app/(backoffice)/components/projetos/FloorPlanGallery'
import PricingTable from '@/app/(backoffice)/components/projetos/PricingTable'
import UnitAvailabilityMatrix from '@/app/(backoffice)/components/projetos/UnitAvailabilityMatrix'
import { toast } from 'sonner'

function fmtCurrency(v: number) {
    if (!v) return '—'
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    if (v >= 1_000) return `R$ ${Math.floor(v / 1_000)}K`
    return `R$ ${v}`
}

function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const STATUS_MAP = Object.fromEntries(
    ['planejamento', 'estruturacao', 'lancamento', 'obras', 'em_andamento', 'concluido', 'pronto', 'cancelado'].map(key => {
        const cfg = getStatusConfig(key)
        return [key, { label: cfg.label, color: cfg.dot, bg: `${cfg.dot}1f` }]
    })
) as Record<string, { label: string; color: string; bg: string }>

type TabKey = 'overview' | 'plantas' | 'precos' | 'disponibilidade'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Visão Geral', icon: Eye },
    { key: 'plantas', label: 'Plantas', icon: Ruler },
    { key: 'precos', label: 'Tabela de Preços', icon: DollarSign },
    { key: 'disponibilidade', label: 'Disponibilidade', icon: Layers },
]

export default function ProjetoDetalhePage() {
    const params = useParams()
    const router = useRouter()
    const [projeto, setProjeto] = useState<any>(null)
    const [unidades, setUnidades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabKey>('overview')
    const [pdfUploading, setPdfUploading] = useState(false)

    const fetchProjeto = useCallback(async () => {
        if (!params.id) return
        try {
            const res = await fetch(`/api/projetos?id=${params.id}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setProjeto(data)
        } catch {
            toast.error('Projeto não encontrado')
            router.push('/backoffice/projetos')
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    const fetchUnidades = useCallback(async () => {
        if (!params.id) return
        try {
            const res = await fetch(`/api/projetos/unidades?projeto_id=${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setUnidades(Array.isArray(data) ? data : [])
            }
        } catch { /* ignore */ }
    }, [params.id])

    useEffect(() => {
        fetchProjeto()
        fetchUnidades()
    }, [fetchProjeto, fetchUnidades])

    const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !params.id) return

        setPdfUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projeto_id', params.id as string)

            const res = await fetch('/api/projetos/pdf-import', { method: 'POST', body: formData })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao importar PDF')
            }

            const { extracted } = await res.json()
            toast.success(`Dados extraídos com sucesso!`)

            // Update projeto with extracted data
            const updates: any = { id: params.id }
            if (extracted.plantas?.length) updates.plantas = extracted.plantas
            if (extracted.tabela_precos?.length) updates.tabela_precos = extracted.tabela_precos
            if (extracted.endereco) updates.endereco = extracted.endereco
            if (extracted.bairro) updates.bairro = extracted.bairro
            if (extracted.diferenciais?.length) updates.descricao = (projeto?.descricao || '') + '\n\nDiferenciais: ' + extracted.diferenciais.join(', ')

            await fetch('/api/projetos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })

            // Bulk insert unidades if extracted
            if (extracted.unidades?.length) {
                await fetch('/api/projetos/unidades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projeto_id: params.id,
                        unidades: extracted.unidades,
                    }),
                })
                toast.success(`${extracted.unidades.length} unidades importadas`)
            }

            // Refresh data
            await fetchProjeto()
            await fetchUnidades()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao processar PDF')
        } finally {
            setPdfUploading(false)
            e.target.value = ''
        }
    }

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
    const plantas = Array.isArray(projeto.plantas) ? projeto.plantas : []
    const tabelaPrecos = Array.isArray(projeto.tabela_precos) ? projeto.tabela_precos : []
    const uSummary = projeto.unidades_summary || { total: 0, disponiveis: 0, reservados: 0, vendidos: 0 }

    return (
        <div className="space-y-6">
            <PageIntelHeader
                title={projeto.nome}
                subtitle={[localizacao, projeto.tipo].filter(Boolean).join(' · ')}
                actions={
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide"
                            style={{ color: statusInfo.color, background: statusInfo.bg }}>
                            {statusInfo.label}
                        </span>

                        {/* PDF Import */}
                        <label
                            className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold transition-all cursor-pointer hover:brightness-110"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                        >
                            {pdfUploading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <FileUp size={16} />
                            )}
                            <span className="text-sm">{pdfUploading ? 'Importando...' : 'Importar PDF'}</span>
                            <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={handlePdfImport}
                                disabled={pdfUploading}
                            />
                        </label>

                        <button
                            onClick={() => router.push(`/backoffice/projetos/${params.id}/editar`)}
                            className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-semibold transition-all hover:brightness-110"
                            style={{ background: T.accent }}
                        >
                            <Edit size={16} />
                            Editar
                        </button>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" data-tour="kpis">
                {[
                    { icon: DollarSign, label: 'VGV', value: fmtCurrency(projeto.vgv), color: T.accent },
                    { icon: Layers, label: 'Unidades', value: `${uSummary.total || projeto.unidades || 0}`, sub: `${uSummary.disponiveis || 0} disponíveis`, color: getStatusConfig('novo').dot },
                    { icon: Target, label: 'Área Total', value: projeto.area_total_m2 ? `${Number(projeto.area_total_m2).toLocaleString('pt-BR')} m²` : '—', color: getStatusConfig('estruturacao').dot },
                    { icon: TrendingUp, label: 'Vendas', value: `${progressVendas}%`, sub: `${projeto.unidades_vendidas ?? 0} vendidas`, color: getStatusConfig('convertido').dot },
                    { icon: Ruler, label: 'Plantas', value: `${plantas.length}`, sub: `tipos disponíveis`, color: T.accent },
                ].map((kpi, i) => (
                    <div key={i} className="rounded-2xl p-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2 mb-3">
                            <kpi.icon size={14} style={{ color: kpi.color }} />
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>{kpi.label}</p>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: T.text }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs mt-1" style={{ color: T.textMuted }}>{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all relative"
                        style={{
                            color: activeTab === tab.key ? T.accent : T.textMuted,
                        }}
                    >
                        <tab.icon size={13} />
                        {tab.label}
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="proj-tab"
                                className="absolute bottom-0 left-0 right-0 h-[2px]"
                                style={{ background: T.accent }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Progresso de vendas */}
                        {projeto.unidades > 0 && (
                            <div className="rounded-xl p-5 mb-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium" style={{ color: T.text }}>Progresso de Vendas</span>
                                    <span className="text-sm font-bold" style={{ color: T.text }}>
                                        {projeto.unidades_vendidas ?? 0} / {projeto.unidades} unidades
                                    </span>
                                </div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${progressVendas}%`, background: 'var(--bo-success)' }} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* About */}
                            {projeto.descricao && (
                                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Sobre o Projeto</h2>
                                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: T.textMuted }}>{projeto.descricao}</p>
                                </div>
                            )}

                            {/* Info */}
                            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Informações</h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Tipo', value: projeto.tipo },
                                        { label: 'Fase', value: projeto.fase },
                                        { label: 'Endereço', value: projeto.endereco },
                                        { label: 'Bairro', value: projeto.bairro },
                                        { label: 'Localização', value: localizacao },
                                        { label: 'Lançamento', value: fmtDate(projeto.data_lancamento) },
                                        { label: 'Entrega', value: fmtDate(projeto.data_entrega_prev) },
                                    ].filter(f => f.value && f.value !== '—').map(field => (
                                        <div key={field.label} className="flex items-start justify-between">
                                            <span className="text-xs" style={{ color: T.textMuted }}>{field.label}</span>
                                            <span className="text-sm font-medium text-right ml-4" style={{ color: T.text }}>{field.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Gallery */}
                        {projeto.gallery_images?.length > 0 && (
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {projeto.gallery_images.map((url: string, i: number) => (
                                    <img key={i} src={url} alt={`Gallery ${i}`} className="w-full h-32 object-cover rounded-xl" />
                                ))}
                            </div>
                        )}

                        {/* Map */}
                        {(projeto.latitude && projeto.longitude) && (
                            <div className="rounded-2xl overflow-hidden mt-6" style={{ border: `1px solid ${T.border}` }}>
                                <iframe
                                    src={`https://www.google.com/maps?q=${projeto.latitude},${projeto.longitude}&z=15&output=embed`}
                                    className="w-full h-64 border-0"
                                    title="Localização do projeto"
                                />
                            </div>
                        )}

                        {/* Image */}
                        {projeto.imagem_url && (
                            <div className="rounded-2xl overflow-hidden mt-6" style={{ border: `1px solid ${T.border}` }}>
                                <img src={projeto.imagem_url} alt={projeto.nome} className="w-full h-64 object-cover" />
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'plantas' && (
                    <motion.div key="plantas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <FloorPlanGallery plantas={plantas} />
                    </motion.div>
                )}

                {activeTab === 'precos' && (
                    <motion.div key="precos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <PricingTable tabela={tabelaPrecos} />
                    </motion.div>
                )}

                {activeTab === 'disponibilidade' && (
                    <motion.div key="disponibilidade" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <UnitAvailabilityMatrix
                            unidades={unidades}
                            onUnitClick={(unit) => {
                                toast.info(`${unit.numero} — ${unit.planta_tipo || 'Sem tipo'}${unit.preco ? ` — R$ ${unit.preco.toLocaleString('pt-BR')}` : ''}`)
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
