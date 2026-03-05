'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    MapPin,
    Edit,
    Globe,
    TrendingUp,
    Users,
    DollarSign,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    ExternalLink,
} from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
}

// ⚠️ NÃO MODIFICAR - Dados mockados
const projetoData = {
    id: 1,
    nome: 'Reserva Imperial',
    tipo: 'Loteamento Premium Costeiro',
    localizacao: 'Litoral Norte PE — Catuama / Goiana',
    status: 'estruturacao',
    statusLabel: 'Estruturação',
    descricao: 'Desenvolvimento imobiliário costeiro de escala territorial posicionado como plataforma de preservação ativa e valorização patrimonial. Primeiro projeto brasileiro a integrar tecnologia REGEN (Regenerative Real Estate Network) para certificação internacional de impacto positivo.',
    areaTotal: '1.200.000 m²',
    areaPrivativa: '340.000 m²',
    areaPreservacao: '860.000 m²',
    unidades: 320,
    unidadesVendidas: 0,
    vgv: 480000000,
    captacaoAlvo: 120000000,
    captacaoAtual: 42000000,
    dataLancamento: '2026-09-01',
    dataEntrega: '2030-12-01',
    cobertura: 'Internacional',
    investidoresAlvo: 'Sovereign Wealth Funds, Family Offices, ESG Funds',
    avatar: 'RA',
    avatarColor: 'bg-blue-600',

    parceiros: [
        { nome: 'Construtora Central', papel: 'Incorporação e Construção' },
        { nome: 'Studio Bioclimático', papel: 'Projeto Arquitetônico' },
        { nome: 'REGEN Institute', papel: 'Certificação Sustentável' },
    ],

    milestones: [
        { label: 'Due Diligence Fundiária', status: 'concluido', data: '2025-09-01' },
        { label: 'Estruturação Jurídica (SPE)', status: 'concluido', data: '2025-11-15' },
        { label: 'Projeto Arquitetônico Aprovado', status: 'concluido', data: '2026-01-20' },
        { label: 'Captação Fase 1 (R$ 42M)', status: 'andamento', data: '2026-06-30' },
        { label: 'Licença Ambiental (CPRH)', status: 'andamento', data: '2026-07-01' },
        { label: 'Lançamento Comercial', status: 'pendente', data: '2026-09-01' },
        { label: 'Início das Obras', status: 'pendente', data: '2027-03-01' },
    ],

    investidores: [
        { nome: 'Qatar Investment Authority', pais: '🇶🇦', alocacao: 15000000, status: 'confirmado' },
        { nome: 'Opportunity Capital — Family Office', pais: '🇧🇷', alocacao: 12000000, status: 'confirmado' },
        { nome: 'GIC Singapore (exploratory)', pais: '🇸🇬', alocacao: 25000000, status: 'interesse' },
        { nome: 'Azimuth Capital', pais: '🇧🇷', alocacao: 15000000, status: 'confirmado' },
    ],

    website: 'reservaimperial.com.br',
    deck: 'IMI_ReservaImperial_PitchDeck_v4.pdf',
}

export default function ProjetoDetalhePage() {
    const params = useParams()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'investidores' | 'landing'>('overview')

    const formatCurrency = (v: number) =>
        v >= 1000000 ? `R$ ${(v / 1000000).toFixed(0)}M` : `R$ ${(v / 1000).toFixed(0)}K`

    const progressCaptacao = (projetoData.captacaoAtual / projetoData.captacaoAlvo) * 100

    const milestoneStatus = (s: string) => {
        if (s === 'concluido') return { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)' }
        if (s === 'andamento') return { icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }
        return { icon: Clock, color: T.textMuted, bg: T.elevated }
    }

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
                            <h1 className="text-2xl font-bold" style={{ color: T.text }}>{projetoData.nome}</h1>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400">
                                {projetoData.statusLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                            <MapPin size={14} />
                            {projetoData.localizacao}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={`https://${projetoData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium transition-colors"
                        style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
                    >
                        <Globe size={16} />
                        Website
                        <ExternalLink size={14} style={{ color: T.textMuted }} />
                    </a>
                    <button
                        onClick={() => router.push(`/backoffice/projetos/${params.id}/editar`)}
                        className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium transition-colors hover:brightness-110"
                        style={{ background: T.accent }}
                    >
                        <Edit size={16} />
                        Editar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>VGV</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{formatCurrency(projetoData.vgv)}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs uppercase tracking-wider mb-2 text-green-500">Captação</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(projetoData.captacaoAtual)}</p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>de {formatCurrency(projetoData.captacaoAlvo)} ({progressCaptacao.toFixed(0)}%)</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Unidades</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{projetoData.unidades}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Área Preservação</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{projetoData.areaPreservacao}</p>
                </div>
            </div>

            {/* Barra de captação */}
            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: T.text }}>Progresso de Captação — Fase 1</span>
                    <span className="text-sm font-bold" style={{ color: T.text }}>{progressCaptacao.toFixed(0)}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progressCaptacao}%`, background: T.accent }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs" style={{ color: T.textMuted }}>
                    <span>{formatCurrency(projetoData.captacaoAtual)} captados</span>
                    <span>Meta: {formatCurrency(projetoData.captacaoAlvo)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex gap-6">
                    {[
                        { key: 'overview', label: 'Visão Geral' },
                        { key: 'milestones', label: 'Milestones' },
                        { key: 'investidores', label: 'Investidores' },
                        { key: 'landing', label: 'Landing Page' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className="pb-4 px-2 text-sm font-medium border-b-2 transition-colors"
                            style={{
                                borderBottomColor: activeTab === tab.key ? T.accent : 'transparent',
                                color: activeTab === tab.key ? T.accent : T.textMuted,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Sobre o Projeto</h2>
                            <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{projetoData.descricao}</p>
                        </div>
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Parceiros</h2>
                            <div className="space-y-3">
                                {projetoData.parceiros.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-2"
                                        style={{ borderBottom: i < projetoData.parceiros.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                        <span className="text-sm font-medium" style={{ color: T.text }}>{p.nome}</span>
                                        <span className="text-xs" style={{ color: T.textMuted }}>{p.papel}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Detalhes</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Tipo</p>
                                    <p className="font-medium" style={{ color: T.text }}>{projetoData.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Área Total</p>
                                    <p className="font-medium" style={{ color: T.text }}>{projetoData.areaTotal}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Lançamento</p>
                                    <p className="font-medium" style={{ color: T.text }}>{new Date(projetoData.dataLancamento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Entrega Prevista</p>
                                    <p className="font-medium" style={{ color: T.text }}>{new Date(projetoData.dataEntrega).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Investidores-Alvo</p>
                                    <p className="font-medium" style={{ color: T.text }}>{projetoData.investidoresAlvo}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Documentos</h2>
                            <button className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-sm"
                                style={{ border: `1px solid ${T.border}`, color: T.text, background: T.elevated }}>
                                <FileText size={16} style={{ color: T.accent }} />
                                <span>Pitch Deck v4</span>
                                <ExternalLink size={14} className="ml-auto" style={{ color: T.textMuted }} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Milestones */}
            {activeTab === 'milestones' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="space-y-4">
                        {projetoData.milestones.map((m, i) => {
                            const sc = milestoneStatus(m.status)
                            const StatusIcon = sc.icon
                            return (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                                    style={{ background: T.elevated }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: sc.bg }}>
                                        <StatusIcon size={20} style={{ color: sc.color }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium"
                                            style={{ color: m.status === 'pendente' ? T.textMuted : T.text }}>
                                            {m.label}
                                        </p>
                                    </div>
                                    <span className="text-xs" style={{ color: T.textMuted }}>
                                        {new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tab: Investidores */}
            {activeTab === 'investidores' && (
                <div className="space-y-4">
                    {projetoData.investidores.map((inv, i) => (
                        <div key={i} className="rounded-xl p-5 flex items-center gap-4"
                            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <span className="text-2xl">{inv.pais}</span>
                            <div className="flex-1">
                                <p className="font-semibold" style={{ color: T.text }}>{inv.nome}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold" style={{ color: T.text }}>{formatCurrency(inv.alocacao)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${inv.status === 'confirmado' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                                }`}>
                                {inv.status === 'confirmado' ? 'Confirmado' : 'Em análise'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab: Landing */}
            {activeTab === 'landing' && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Landing Page do Projeto</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>URL</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={projetoData.website}
                                    readOnly
                                    className="flex-1 h-11 px-4 rounded-xl text-sm outline-none"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                                />
                                <a
                                    href={`https://${projetoData.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-11 px-5 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 hover:brightness-110"
                                    style={{ background: T.accent }}
                                >
                                    <Globe size={16} />
                                    Abrir
                                </a>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <p className="text-sm" style={{ color: '#93C5FD' }}>
                                💡 A landing page do Reserva Imperial é gerenciada separadamente. Para editar o conteúdo, acesse o CMS ou entre em contato com a equipe de desenvolvimento.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
