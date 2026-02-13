'use client'

import { useState, useEffect } from 'react'
import {
    Globe,
    Shield,
    Users,
    Building2,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    DollarSign,
    TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Consultation {
    id: string
    client_name: string
    client_type: string
    consultation_type: string
    jurisdictions: string[]
    status: 'pending' | 'analyzing' | 'structuring' | 'executing' | 'completed'
    needs_lawyer: boolean
    needs_accountant: boolean
    needs_bpo: boolean
    estimated_patrimony: string
    urgency: string
    created_at: string
    updated_at: string
}

const STRUCTURING_FRAMEWORK = [
    {
        phase: 1,
        name: 'Diagnóstico Patrimonial',
        description: 'Análise completa da situação atual',
        duration: '1-2 semanas',
        icon: FileText,
        color: 'blue',
        tasks: [
            'Levantamento de ativos',
            'Análise tributária',
            'Mapeamento de riscos',
            'Identificação de oportunidades'
        ]
    },
    {
        phase: 2,
        name: 'Definição de Jurisdição',
        description: 'Escolha estratégica de territórios',
        duration: '1 semana',
        icon: Globe,
        color: 'purple',
        tasks: [
            'Análise regulatória',
            'Comparativo tributário',
            'Avaliação de custos',
            'Seleção de jurisdições'
        ]
    },
    {
        phase: 3,
        name: 'Estrutura Jurídica',
        description: 'Arquitetura societária e tributária',
        duration: '2-4 semanas',
        icon: Shield,
        color: 'green',
        tasks: [
            'Constituição de holding',
            'Criação de LLC',
            'Estruturas offshore',
            'Contratos e acordos'
        ]
    },
    {
        phase: 4,
        name: 'Aquisição Estratégica',
        description: 'Execução de investimentos',
        duration: '4-8 semanas',
        icon: Building2,
        color: 'orange',
        tasks: [
            'Identificação de ativos',
            'Due diligence',
            'Negociação',
            'Fechamento'
        ]
    },
    {
        phase: 5,
        name: 'Governança e Monitoramento',
        description: 'Gestão contínua do patrimônio',
        duration: 'Contínuo',
        icon: Users,
        color: 'pink',
        tasks: [
            'Compliance internacional',
            'Reporting consolidado',
            'Revisões periódicas',
            'Ajustes estratégicos'
        ]
    }
]

const MULTIDISCIPLINARY_NETWORK = [
    {
        role: 'Advogado Tributarista',
        icon: Shield,
        color: 'blue',
        responsibilities: [
            'Estruturação jurídica',
            'Compliance tributário',
            'Contratos internacionais',
            'Proteção patrimonial'
        ]
    },
    {
        role: 'Contador Internacional',
        icon: FileText,
        color: 'green',
        responsibilities: [
            'Holdings e LLCs',
            'Declarações fiscais',
            'Transfer pricing',
            'Consolidação contábil'
        ]
    },
    {
        role: 'BPO Financeiro',
        icon: DollarSign,
        color: 'purple',
        responsibilities: [
            'Gestão patrimonial',
            'Consolidação de ativos',
            'Reporting executivo',
            'KPIs financeiros'
        ]
    },
    {
        role: 'IMI (Coordenação)',
        icon: TrendingUp,
        color: 'yellow',
        responsibilities: [
            'Estratégia geral',
            'Coordenação multidisciplinar',
            'Aquisição de ativos',
            'Governança integrada'
        ]
    }
]

export default function StructuringDashboard({ consultationId }: { consultationId: string }) {
    const [consultation, setConsultation] = useState<Consultation | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentPhase, setCurrentPhase] = useState(1)

    useEffect(() => {
        loadConsultation()
    }, [consultationId])

    const loadConsultation = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('id', consultationId)
            .single()

        if (!error && data) {
            setConsultation(data)
            // Determinar fase atual baseado no status
            const phaseMap: Record<string, number> = {
                'pending': 1,
                'analyzing': 1,
                'structuring': 3,
                'executing': 4,
                'completed': 5
            }
            setCurrentPhase(phaseMap[data.status] || 1)
        }
        setLoading(false)
    }

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { label: string; color: string }> = {
            'pending': { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
            'analyzing': { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
            'structuring': { label: 'Estruturando', color: 'bg-purple-100 text-purple-700' },
            'executing': { label: 'Executando', color: 'bg-orange-100 text-orange-700' },
            'completed': { label: 'Concluído', color: 'bg-green-100 text-green-700' }
        }
        const config = configs[status] || configs.pending
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        )
    }

    const getJurisdictionFlag = (jurisdiction: string) => {
        const flags: Record<string, string> = {
            'brasil': '🇧🇷',
            'usa': '🇺🇸',
            'dubai': '🇦🇪',
            'paraguai': '🇵🇾',
            'panama': '🇵🇦'
        }
        return flags[jurisdiction] || '🌍'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-imi-600">Carregando estruturação...</p>
                </div>
            </div>
        )
    }

    if (!consultation) return null

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent-50 to-blue-50 rounded-2xl border border-accent-200 p-8 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-imi-900 mb-2">
                            {consultation.client_name}
                        </h1>
                        <p className="text-imi-600">
                            Estruturação Patrimonial Internacional
                        </p>
                    </div>
                    {getStatusBadge(consultation.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Globe size={24} className="text-accent-600" />
                        </div>
                        <div>
                            <div className="text-sm text-imi-600">Jurisdições</div>
                            <div className="font-medium text-imi-900">
                                {consultation.jurisdictions?.map(j => getJurisdictionFlag(j)).join(' ') || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Clock size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-imi-600">Urgência</div>
                            <div className="font-medium text-imi-900 capitalize">
                                {consultation.urgency?.replace('_', ' ') || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <DollarSign size={24} className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-imi-600">Patrimônio</div>
                            <div className="font-medium text-imi-900">
                                {consultation.estimated_patrimony || 'Não informado'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Framework de Estruturação */}
            <div className="bg-white rounded-2xl border border-imi-100 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-imi-900 mb-6">
                    Framework IMI de Estruturação
                </h2>

                <div className="space-y-4">
                    {STRUCTURING_FRAMEWORK.map((phase) => {
                        const Icon = phase.icon
                        const isCompleted = currentPhase > phase.phase
                        const isCurrent = currentPhase === phase.phase
                        const isPending = currentPhase < phase.phase

                        // Dynamic classes for colors to avoid PurgeCSS/JIT issues if not safe-listed
                        // Using fixed classes based on phase color would be better, but inline logic here simulates that.
                        let phaseColorClass = 'bg-gray-100 text-gray-600';
                        if (phase.color === 'blue') phaseColorClass = 'bg-blue-100 text-blue-600';
                        if (phase.color === 'purple') phaseColorClass = 'bg-purple-100 text-purple-600';
                        if (phase.color === 'green') phaseColorClass = 'bg-green-100 text-green-600';
                        if (phase.color === 'orange') phaseColorClass = 'bg-orange-100 text-orange-600';
                        if (phase.color === 'pink') phaseColorClass = 'bg-pink-100 text-pink-600';

                        if (isCurrent) phaseColorClass = 'bg-accent-500 text-white';
                        if (isCompleted) phaseColorClass = 'bg-green-500 text-white';


                        return (
                            <div
                                key={phase.phase}
                                className={`border-2 rounded-2xl p-6 transition-all ${isCurrent
                                        ? 'border-accent-500 bg-accent-50 shadow-lg scale-[1.01]'
                                        : isCompleted
                                            ? 'border-green-200 bg-green-50/50'
                                            : 'border-imi-100 bg-white opacity-60'
                                    }`}
                            >
                                <div className="flex items-start gap-6">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${phaseColorClass}`}>
                                        {isCompleted ? (
                                            <CheckCircle size={32} />
                                        ) : (
                                            <Icon size={32} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-bold text-imi-500">
                                                        FASE {phase.phase}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-2 py-0.5 rounded-full bg-accent-500 text-white text-xs font-medium shadow-sm">
                                                            Em Andamento
                                                        </span>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium shadow-sm">
                                                            Concluída
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-imi-900">
                                                    {phase.name}
                                                </h3>
                                                <p className="text-sm text-imi-600 mt-1">
                                                    {phase.description}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-imi-500">Duração</div>
                                                <div className="font-medium text-imi-700">{phase.duration}</div>
                                            </div>
                                        </div>

                                        {/* Tasks */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                                            {phase.tasks.map((task, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-2 text-sm ${isCompleted ? 'text-green-700' : 'text-imi-700'
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                                    ) : (
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-accent-400' : 'bg-imi-300'}`} />
                                                    )}
                                                    <span>{task}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Rede Multidisciplinar */}
            <div className="bg-white rounded-2xl border border-imi-100 p-8 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-imi-900 mb-2">
                        Rede Técnica Coordenada
                    </h2>
                    <p className="text-sm text-imi-600">
                        Equipe multidisciplinar sob coordenação estratégica da IMI
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MULTIDISCIPLINARY_NETWORK.map((member, index) => {
                        const Icon = member.icon
                        const isActive =
                            (member.role.includes('Advogado') && consultation.needs_lawyer) ||
                            (member.role.includes('Contador') && consultation.needs_accountant) ||
                            (member.role.includes('BPO') && consultation.needs_bpo) ||
                            member.role.includes('IMI')

                        let memberColorClass = 'bg-gray-200 text-gray-400';
                        if (isActive) {
                            if (member.color === 'blue') memberColorClass = 'bg-blue-500 text-white';
                            if (member.color === 'green') memberColorClass = 'bg-green-500 text-white';
                            if (member.color === 'purple') memberColorClass = 'bg-purple-500 text-white';
                            if (member.color === 'yellow') memberColorClass = 'bg-yellow-500 text-white';
                        }

                        return (
                            <div
                                key={index}
                                className={`border-2 rounded-xl p-6 transition-all ${isActive
                                        ? `border-${member.color}-200 bg-${member.color}-50 shadow-sm`
                                        : 'border-imi-100 bg-gray-50 opacity-50'
                                    }`}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${memberColorClass}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-imi-900">{member.role}</h3>
                                        {isActive && (
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                Ativo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {member.responsibilities.map((resp, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-2 text-sm ${isActive ? 'text-imi-700' : 'text-imi-400'
                                                }`}
                                        >
                                            <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-imi-400' : 'bg-imi-200'
                                                }`} />
                                            <span>{resp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-imi-100 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-imi-900 mb-6">
                    Timeline Estimada
                </h2>

                <div className="space-y-4">
                    {[
                        { week: '1-2', task: 'Diagnóstico Patrimonial Completo', status: 'completed' },
                        { week: '3', task: 'Definição de Jurisdições', status: 'completed' },
                        { week: '4-7', task: 'Estruturação Jurídica', status: 'current' },
                        { week: '8-15', task: 'Aquisição de Ativos', status: 'pending' },
                        { week: '16+', task: 'Governança Contínua', status: 'pending' }
                    ].map((item, index) => {
                        // Timeline logic is static in the example, but would be dynamic in real app.
                        // For now, adhering to the static example provided.
                        // Adjusting logic to match `currentPhase` if we wanted dynamic, but for now just rendering as requested.

                        const isCompleted = item.status === 'completed';
                        const isCurrent = item.status === 'current';

                        return (
                            <div key={index} className="flex items-center gap-4 group">
                                <div className={`w-20 text-sm font-medium ${isCompleted ? 'text-green-700' :
                                        isCurrent ? 'text-accent-700' :
                                            'text-imi-500'
                                    }`}>
                                    Sem. {item.week}
                                </div>
                                <div className={`flex-1 h-12 rounded-xl border-2 flex items-center px-4 transition-all ${isCompleted ? 'border-green-200 bg-green-50' :
                                        isCurrent ? 'border-accent-200 bg-accent-50 shadow-sm' :
                                            'border-imi-100 group-hover:bg-gray-50'
                                    }`}>
                                    <span className={`text-sm font-medium ${isCompleted ? 'text-green-700' :
                                            isCurrent ? 'text-accent-700' :
                                                'text-imi-600'
                                        }`}>
                                        {item.task}
                                    </span>
                                </div>
                                {isCompleted && (
                                    <CheckCircle size={20} className="text-green-600" />
                                )}
                                {isCurrent && (
                                    <Clock size={20} className="text-accent-600 animate-pulse" />
                                )}
                                {!isCompleted && !isCurrent && (
                                    <div className="w-5" /> // Spacer
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex gap-3">
                    <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-2">Compliance e Conformidade</p>
                        <p className="text-blue-600">
                            Toda estruturação é construída dentro das normas vigentes de cada jurisdição.
                            A IMI não realiza estruturações ilegais, evasão fiscal ou promessas de blindagem absoluta.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
