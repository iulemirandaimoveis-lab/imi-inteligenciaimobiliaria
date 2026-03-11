'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, FileText, CheckCircle, Clock, AlertCircle,
    Globe, Download, ExternalLink, Loader2, AlertTriangle,
    FileSignature, Mail, Send, Trash2, Copy, X
} from 'lucide-react'
import { toast } from 'sonner'
import { IDIOMAS_LABEL } from '@/lib/modelos-contratos'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const STATUS_CFG: Record<string, { label: string; text: string; bg: string }> = {
    rascunho: { label: 'Rascunho', text: '#4E5669', bg: 'rgba(78,86,105,0.15)' },
    gerado: { label: 'Gerado', text: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
    aguardando_assinatura: { label: 'Aguard. Assinatura', text: 'var(--bo-accent)', bg: 'var(--bo-active-bg)' },
    assinado_parcial: { label: 'Parcialmente Assinado', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
    assinado: { label: 'Assinado', text: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
    cancelado: { label: 'Cancelado', text: '#E57373', bg: 'rgba(229,115,115,0.12)' },
}

export default function ContratoDetalhePage() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'conteudo' | 'info'>('overview')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        async function fetchContrato() {
            try {
                const res = await fetch(`/api/contratos?id=${params.id}`)
                if (!res.ok) throw new Error('Falha ao carregar contrato')
                const result = await res.json()
                setData(result)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchContrato()
    }, [params.id])

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/contratos?id=${params.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao cancelar')
            toast.success('Contrato cancelado com sucesso')
            router.push('/backoffice/contratos')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const res = await fetch('/api/contratos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: params.id, status: newStatus }),
            })
            if (!res.ok) throw new Error('Falha ao atualizar')
            const result = await res.json()
            setData({ ...data, ...result.data, status: newStatus })
            toast.success(`Status atualizado para ${STATUS_CFG[newStatus]?.label || newStatus}`)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const copyMarkdown = () => {
        if (data?.conteudo_markdown) {
            navigator.clipboard.writeText(data.conteudo_markdown)
            toast.success('Conteúdo copiado')
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
                    <p className="text-lg font-bold mb-2" style={{ color: T.text }}>{error || 'Contrato não encontrado'}</p>
                    <button onClick={() => router.push('/backoffice/contratos')}
                        className="mt-4 px-4 py-2 rounded-xl text-white text-sm" style={{ backgroundColor: T.accent }}>
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    const sc = STATUS_CFG[data.status] || STATUS_CFG.rascunho
    const contratante = data.contratante || {}
    const contratado = data.contratado || {}
    const dadosContrato = data.dados_contrato || {}

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="CONTRATOS · DETALHES"
                title={data.numero}
                subtitle={`${data.modelo_nome || 'Contrato'}${IDIOMAS_LABEL[data.idioma] ? ` · ${IDIOMAS_LABEL[data.idioma]?.flag} ${IDIOMAS_LABEL[data.idioma]?.label}` : ''}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.back()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <ArrowLeft size={18} style={{ color: T.text }} />
                        </button>
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ color: sc.text, background: sc.bg }}>
                            {sc.label}
                        </span>
                        {data.pdf_url && (
                            <a href={data.pdf_url} target="_blank" rel="noopener noreferrer"
                                className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium hover:opacity-80"
                                style={{ border: `1px solid ${T.border}`, color: T.text }}>
                                <Download size={16} /> PDF
                            </a>
                        )}
                        {data.drive_url && (
                            <a href={data.drive_url} target="_blank" rel="noopener noreferrer"
                                className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium hover:opacity-80"
                                style={{ border: `1px solid ${T.border}`, color: T.text }}>
                                <ExternalLink size={16} /> Drive
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

            {/* Delete Confirm */}
            {showDeleteConfirm && (
                <div className="rounded-xl p-4 flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-sm" style={{ color: T.text }}>Cancelar contrato <strong>{data.numero}</strong>?</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: T.textMuted }}>Não</button>
                        <button onClick={handleDelete} disabled={deleting}
                            className="px-4 py-2 rounded-lg text-white text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50">
                            {deleting ? 'Cancelando...' : 'Sim, cancelar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Workflow */}
            {data.status !== 'cancelado' && data.status !== 'assinado' && (
                <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Atualizar Status</p>
                    <div className="flex gap-2 flex-wrap">
                        {['gerado', 'aguardando_assinatura', 'assinado_parcial', 'assinado'].map(s => {
                            const cfg = STATUS_CFG[s]
                            if (!cfg || s === data.status) return null
                            return (
                                <button key={s} onClick={() => handleStatusUpdate(s)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                    style={{ color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.text}30` }}>
                                    {cfg.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex gap-6">
                    {([
                        { key: 'overview', label: 'Visão Geral' },
                        { key: 'conteudo', label: 'Conteúdo' },
                        { key: 'info', label: 'Informações' },
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

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contratante */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Contratante</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Nome</p>
                                <p className="text-sm font-bold" style={{ color: T.text }}>{contratante.nome || '—'}</p>
                            </div>
                            {contratante.email && (
                                <div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>Email</p>
                                    <p className="text-sm" style={{ color: T.text }}>{contratante.email}</p>
                                </div>
                            )}
                            {contratante.cpf_cnpj && (
                                <div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>CPF/CNPJ</p>
                                    <p className="text-sm font-mono" style={{ color: T.text }}>{contratante.cpf_cnpj}</p>
                                </div>
                            )}
                            {contratante.tipo && (
                                <div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>Tipo</p>
                                    <p className="text-sm" style={{ color: T.text }}>
                                        {contratante.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contratado */}
                    <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Contratado</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Nome</p>
                                <p className="text-sm font-bold" style={{ color: T.text }}>{contratado.nome || '—'}</p>
                            </div>
                            {contratado.email && (
                                <div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>Email</p>
                                    <p className="text-sm" style={{ color: T.text }}>{contratado.email}</p>
                                </div>
                            )}
                            {contratado.cpf_cnpj && (
                                <div>
                                    <p className="text-xs" style={{ color: T.textMuted }}>CPF/CNPJ</p>
                                    <p className="text-sm font-mono" style={{ color: T.text }}>{contratado.cpf_cnpj}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contract Data */}
                    {Object.keys(dadosContrato).length > 0 && (
                        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Dados do Contrato</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(dadosContrato).map(([key, value]) => (
                                    <div key={key}>
                                        <p className="text-xs" style={{ color: T.textMuted }}>{key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-medium" style={{ color: T.text }}>
                                            {typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : String(value || '—')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Metadados</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Modelo</p>
                                <p className="text-sm" style={{ color: T.text }}>{data.modelo_nome || data.modelo_id || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Categoria</p>
                                <p className="text-sm" style={{ color: T.text }}>{data.categoria || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Criado por</p>
                                <p className="text-sm" style={{ color: T.text }}>{data.criado_por_nome || data.criado_por || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Plataforma Assinatura</p>
                                <p className="text-sm" style={{ color: T.text }}>{data.plataforma_assinatura || 'Nenhuma'}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Criado em</p>
                                <p className="text-sm" style={{ color: T.text }}>
                                    {data.criado_em ? new Date(data.criado_em).toLocaleString('pt-BR') : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: T.textMuted }}>Atualizado em</p>
                                <p className="text-sm" style={{ color: T.text }}>
                                    {data.atualizado_em ? new Date(data.atualizado_em).toLocaleString('pt-BR') : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTEUDO TAB */}
            {activeTab === 'conteudo' && (
                <div className="space-y-4">
                    {data.conteudo_markdown ? (
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold" style={{ color: T.text }}>Conteúdo do Contrato</h2>
                                <button onClick={copyMarkdown}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}>
                                    <Copy size={14} /> Copiar
                                </button>
                            </div>
                            <div className="prose prose-sm max-w-none prose-invert"
                                style={{ color: T.textMuted }}>
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-xl overflow-auto"
                                    style={{ background: T.elevated, maxHeight: '70vh' }}>
                                    {data.conteudo_markdown}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16" style={{ color: T.textMuted }}>
                            <FileText size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Conteúdo ainda não gerado</p>
                        </div>
                    )}
                </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'info' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Todas as Informações</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(data).filter(([key]) => !['conteudo_markdown', 'conteudo_adicional'].includes(key)).map(([key, value]) => {
                            if (value == null || value === '') return null
                            const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
                            return (
                                <div key={key} className={typeof value === 'object' ? 'md:col-span-2' : ''}>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>{key}</p>
                                    {typeof value === 'object' ? (
                                        <pre className="text-xs p-3 rounded-xl overflow-auto" style={{ background: T.elevated, color: T.text, maxHeight: '200px' }}>
                                            {display}
                                        </pre>
                                    ) : (
                                        <p className="text-sm font-medium break-all" style={{ color: T.text }}>{display}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
