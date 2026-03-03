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

// ⚠️ NÃO MODIFICAR - Dados mockados
const projetoData = {
    id: 1,
    nome: 'Reserva Atlantis',
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

    website: 'reservaatlantis.com.br',
    deck: 'IMI_ReservaAtlantis_PitchDeck_v4.pdf',
}

export default function ProjetoDetalhePage() {
    const params = useParams()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'investidores' | 'landing'>('overview')

    const formatCurrency = (v: number) =>
        v >= 1000000 ? `R$ ${(v / 1000000).toFixed(0)}M` : `R$ ${(v / 1000).toFixed(0)}K`

    const progressCaptacao = (projetoData.captacaoAtual / projetoData.captacaoAlvo) * 100

    const milestoneStatus = (s: string) => {
        if (s === 'concluido') return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' }
        if (s === 'andamento') return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' }
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{projetoData.nome}</h1>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                {projetoData.statusLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        className="flex items-center gap-2 h-11 px-5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Globe size={16} />
                        Website
                        <ExternalLink size={14} className="text-gray-400" />
                    </a>
                    <button
                        onClick={() => router.push(`/backoffice/projetos/${params.id}/editar`)}
                        className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
                    >
                        <Edit size={16} />
                        Editar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">VGV</p>
                    <p className="text-2xl font-bold text-accent-700">{formatCurrency(projetoData.vgv)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-green-600 uppercase tracking-wider mb-2">Captação</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(projetoData.captacaoAtual)}</p>
                    <p className="text-xs text-gray-400 mt-1">de {formatCurrency(projetoData.captacaoAlvo)} ({progressCaptacao.toFixed(0)}%)</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Unidades</p>
                    <p className="text-2xl font-bold text-gray-900">{projetoData.unidades}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Área Preservação</p>
                    <p className="text-2xl font-bold text-gray-900">{projetoData.areaPreservacao}</p>
                </div>
            </div>

            {/* Barra de captação */}
            <div className="bg-white rounded-xl p-5 border">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Progresso de Captação — Fase 1</span>
                    <span className="text-sm font-bold text-gray-900">{progressCaptacao.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${progressCaptacao}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{formatCurrency(projetoData.captacaoAtual)} captados</span>
                    <span>Meta: {formatCurrency(projetoData.captacaoAlvo)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
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
                            className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-accent-600 text-accent-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
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
                        <div className="bg-white rounded-2xl p-6 border">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre o Projeto</h2>
                            <p className="text-sm text-gray-700 leading-relaxed">{projetoData.descricao}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Parceiros</h2>
                            <div className="space-y-3">
                                {projetoData.parceiros.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm font-medium text-gray-900">{p.nome}</span>
                                        <span className="text-xs text-gray-500">{p.papel}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Detalhes</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                                    <p className="font-medium text-gray-900">{projetoData.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Área Total</p>
                                    <p className="font-medium text-gray-900">{projetoData.areaTotal}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Lançamento</p>
                                    <p className="font-medium text-gray-900">{new Date(projetoData.dataLancamento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Entrega Prevista</p>
                                    <p className="font-medium text-gray-900">{new Date(projetoData.dataEntrega).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Investidores-Alvo</p>
                                    <p className="font-medium text-gray-900">{projetoData.investidoresAlvo}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Documentos</h2>
                            <button className="flex items-center gap-3 w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                <FileText size={16} className="text-accent-500" />
                                <span>Pitch Deck v4</span>
                                <ExternalLink size={14} className="text-gray-400 ml-auto" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Milestones */}
            {activeTab === 'milestones' && (
                <div className="bg-white rounded-2xl p-6 border">
                    <div className="space-y-4">
                        {projetoData.milestones.map((m, i) => {
                            const sc = milestoneStatus(m.status)
                            const StatusIcon = sc.icon
                            return (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                                        <StatusIcon size={20} className={sc.color} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${m.status === 'concluido' ? 'text-gray-900' : m.status === 'andamento' ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {m.label}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400">
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
                        <div key={i} className="bg-white rounded-xl p-5 border flex items-center gap-4">
                            <span className="text-2xl">{inv.pais}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{inv.nome}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-accent-700">{formatCurrency(inv.alocacao)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${inv.status === 'confirmado' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                }`}>
                                {inv.status === 'confirmado' ? 'Confirmado' : 'Em análise'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab: Landing */}
            {activeTab === 'landing' && (
                <div className="bg-white rounded-2xl p-6 border">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Landing Page do Projeto</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">URL</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={projetoData.website}
                                    readOnly
                                    className="flex-1 h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 text-sm"
                                />
                                <a
                                    href={`https://${projetoData.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-11 px-5 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
                                >
                                    <Globe size={16} />
                                    Abrir
                                </a>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-800">
                                💡 A landing page do Reserva Atlantis é gerenciada separadamente. Para editar o conteúdo, acesse o CMS ou entre em contato com a equipe de desenvolvimento.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
