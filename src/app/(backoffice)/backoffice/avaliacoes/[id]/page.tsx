'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, FileText, MapPin, Bed, Bath, Ruler, Car,
    DollarSign, Calendar, CheckCircle, Award, User, Phone, Mail,
    Download, Edit, Loader2, AlertTriangle, Trash2, Home
} from 'lucide-react'
import { toast } from 'sonner'

const T = {
    surface: 'var(--bo-surface)', surfaceAlt: 'var(--bo-surface-alt)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textMuted: 'var(--bo-text-muted)',
    accent: '#486581',
}

const STATUS_CFG: Record<string, { label: string; text: string; bg: string }> = {
    concluida: { label: 'Concluída', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    em_andamento: { label: 'Em Andamento', text: '#486581', bg: 'rgba(26,26,46,0.12)' },
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

    useEffect(() => {
        async function fetchAvaliacao() {
            try {
                const res = await fetch(`/api/avaliacoes?id=${params.id}`)
                if (!res.ok) throw new Error('Falha ao carregar avaliação')
                const result = await res.json()
                setData(result)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAvaliacao()
    }, [params.id])

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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                    <button onClick={() => router.back()}
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-80"
                        style={{ border: `1px solid ${T.border}`, color: T.text }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h1 className="text-2xl font-bold" style={{ color: T.text }}>{data.protocolo || `AVL-${data.id?.slice(0, 8)}`}</h1>
                            <span className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ color: sc.text, background: sc.bg }}>
                                {sc.label}
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: T.textMuted }}>
                            {data.cliente_nome} · {data.tipo_imovel} - {data.bairro}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {data.laudo_url && (
                        <a href={data.laudo_url} target="_blank" rel="noopener noreferrer"
                            className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium hover:opacity-80"
                            style={{ border: `1px solid ${T.border}`, color: T.text }}>
                            <Download size={16} /> PDF
                        </a>
                    )}
                    <button onClick={() => setShowDeleteConfirm(true)}
                        className="h-10 px-4 rounded-xl text-sm font-medium hover:bg-red-500/20"
                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

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
                    <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Valor Avaliado</p>
                        <p className="text-xl font-bold" style={{ color: '#10B981' }}>{formatPrice(Number(data.valor_estimado))}</p>
                    </div>
                )}
                {data.valor_m2 && (
                    <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Preço/m²</p>
                        <p className="text-xl font-bold" style={{ color: '#486581' }}>{formatPrice(Number(data.valor_m2))}</p>
                    </div>
                )}
                {data.area_privativa && (
                    <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Área</p>
                        <p className="text-xl font-bold" style={{ color: T.text }}>{data.area_privativa}m²</p>
                    </div>
                )}
                {data.honorarios && (
                    <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <p className="text-xs mb-1" style={{ color: T.textMuted }}>Honorários</p>
                        <p className="text-xl font-bold" style={{ color: T.accent }}>{formatPrice(Number(data.honorarios))}</p>
                        {data.honorarios_status && (
                            <p className="text-[10px] font-bold mt-1" style={{
                                color: data.honorarios_status === 'pago' ? '#6BB87B' : data.honorarios_status === 'parcial' ? '#486581' : '#E8A87C'
                            }}>
                                {data.honorarios_status === 'pago' ? 'Pago' : data.honorarios_status === 'parcial' ? 'Parcial' : 'Pendente'}
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
                                            <Bed size={24} className="mx-auto mb-2" style={{ color: '#486581' }} />
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
                                            style={{ background: 'rgba(59,130,246,0.1)', color: '#486581' }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Value Range */}
                        {(data.valor_minimo || data.valor_maximo || data.valor_estimado) && (
                            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Intervalo de Valores</h2>
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
                                            <span className="font-bold" style={{ color: T.accent }}>{formatPrice(Number(data.valor_estimado))}</span>
                                        </div>
                                    )}
                                    {data.valor_maximo && (
                                        <div className="flex justify-between">
                                            <span style={{ color: T.textMuted }}>Máximo</span>
                                            <span className="font-medium" style={{ color: T.text }}>{formatPrice(Number(data.valor_maximo))}</span>
                                        </div>
                                    )}
                                </div>
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
