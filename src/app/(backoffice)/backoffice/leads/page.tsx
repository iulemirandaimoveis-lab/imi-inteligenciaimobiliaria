'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search,
    Filter,
    Download,
    Plus,
    Mail,
    Phone,
    MapPin,
    Building2,
    Calendar,
    DollarSign,
    TrendingUp,
    Star,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Send,
} from 'lucide-react'

// Dados reais de Recife/PE
const leadsData = [
    {
        id: 1,
        name: 'Maria Santos Silva',
        email: 'maria.santos@gmail.com',
        phone: '(81) 99845-3421',
        score: 92,
        status: 'hot',
        source: 'Instagram',
        interest: 'Apartamento 3Q',
        location: 'Boa Viagem',
        budget: '450k-600k',
        created: '2026-02-14T10:30:00',
        lastContact: '2026-02-14T15:20:00',
        notes: 'Interessada em empreendimentos próximos ao mar. Preferência por acabamento premium.',
    },
    {
        id: 2,
        name: 'João Pedro Almeida',
        email: 'joao.almeida@hotmail.com',
        phone: '(81) 98732-1098',
        score: 85,
        status: 'hot',
        source: 'Google Ads',
        interest: 'Casa 4Q',
        location: 'Piedade',
        budget: '800k-1M',
        created: '2026-02-14T08:15:00',
        lastContact: '2026-02-14T14:45:00',
        notes: 'Procura casa com quintal. Família com 2 filhos.',
    },
    {
        id: 3,
        name: 'Ana Carolina Ferreira',
        email: 'anacarolina.f@outlook.com',
        phone: '(81) 99234-5678',
        score: 78,
        status: 'warm',
        source: 'Site',
        interest: 'Apartamento 2Q',
        location: 'Pina',
        budget: '300k-400k',
        created: '2026-02-13T16:20:00',
        lastContact: '2026-02-14T10:30:00',
        notes: 'Primeiro imóvel. Compradora atenciosa e detalhista.',
    },
    {
        id: 4,
        name: 'Roberto Carlos Mendes',
        email: 'roberto.mendes@empresarial.com.br',
        phone: '(81) 98123-4567',
        score: 88,
        status: 'hot',
        source: 'Indicação',
        interest: 'Sala Comercial',
        location: 'Boa Viagem',
        budget: '250k-350k',
        created: '2026-02-13T11:00:00',
        lastContact: '2026-02-13T17:15:00',
        notes: 'Empresário buscando ponto comercial. Decisão rápida.',
    },
    {
        id: 5,
        name: 'Patricia Lima Costa',
        email: 'patricia.lima@gmail.com',
        phone: '(81) 99876-5432',
        score: 65,
        status: 'warm',
        source: 'Facebook',
        interest: 'Apartamento 3Q',
        location: 'Setúbal',
        budget: '350k-450k',
        created: '2026-02-12T14:30:00',
        lastContact: '2026-02-13T09:20:00',
        notes: 'Quer visitar empreendimentos no fim de semana.',
    },
    {
        id: 6,
        name: 'Fernando Augusto Rocha',
        email: 'fernando.rocha@yahoo.com',
        phone: '(81) 98765-4321',
        score: 72,
        status: 'warm',
        source: 'WhatsApp',
        interest: 'Cobertura',
        location: 'Boa Viagem',
        budget: '1.2M-1.5M',
        created: '2026-02-12T09:45:00',
        lastContact: '2026-02-12T16:30:00',
        notes: 'Busca cobertura de alto padrão. Investidor experiente.',
    },
    {
        id: 7,
        name: 'Juliana Oliveira Santos',
        email: 'ju.oliveira@gmail.com',
        phone: '(81) 99654-3210',
        score: 58,
        status: 'cold',
        source: 'Instagram',
        interest: 'Apartamento 2Q',
        location: 'Candeias',
        budget: '200k-280k',
        created: '2026-02-11T13:20:00',
        lastContact: '2026-02-11T13:20:00',
        notes: 'Ainda pesquisando. Não respondeu follow-up.',
    },
    {
        id: 8,
        name: 'Carlos Eduardo Martins',
        email: 'carlos.martins@empresa.com',
        phone: '(81) 98543-2109',
        score: 95,
        status: 'hot',
        source: 'Site',
        interest: 'Apartamento 4Q',
        location: 'Boa Viagem',
        budget: '700k-900k',
        created: '2026-02-11T10:00:00',
        lastContact: '2026-02-14T11:45:00',
        notes: 'Muito interessado. Proposta em análise bancária.',
    },
    {
        id: 9,
        name: 'Mariana Souza Campos',
        email: 'mariana.campos@hotmail.com',
        phone: '(81) 99432-1098',
        score: 70,
        status: 'warm',
        source: 'Google Ads',
        interest: 'Casa 3Q',
        location: 'Piedade',
        budget: '500k-650k',
        created: '2026-02-10T15:30:00',
        lastContact: '2026-02-13T14:20:00',
        notes: 'Prefere casa térrea. Família com pets.',
    },
    {
        id: 10,
        name: 'Rafael Henrique Dias',
        email: 'rafael.dias@gmail.com',
        phone: '(81) 98321-0987',
        score: 82,
        status: 'hot',
        source: 'Indicação',
        interest: 'Apartamento 3Q',
        location: 'Pina',
        budget: '380k-480k',
        created: '2026-02-10T09:15:00',
        lastContact: '2026-02-14T08:30:00',
        notes: 'Indicação de cliente antigo. Alta confiança.',
    },
]

const stats = {
    total: leadsData.length,
    hot: leadsData.filter(l => l.status === 'hot').length,
    warm: leadsData.filter(l => l.status === 'warm').length,
    cold: leadsData.filter(l => l.status === 'cold').length,
    avgScore: Math.round(leadsData.reduce((acc, l) => acc + l.score, 0) / leadsData.length),
}

export default function LeadsPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sourceFilter, setSourceFilter] = useState<string>('all')

    // Filtros
    const filteredLeads = leadsData.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm)

        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
        const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

        return matchesSearch && matchesStatus && matchesSource
    })

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; border: string }> = {
            hot: {
                label: 'Quente',
                color: 'text-red-700',
                bg: 'bg-red-50',
                border: 'border-red-200'
            },
            warm: {
                label: 'Morno',
                color: 'text-orange-700',
                bg: 'bg-orange-50',
                border: 'border-orange-200'
            },
            cold: {
                label: 'Frio',
                color: 'text-blue-700',
                bg: 'bg-blue-50',
                border: 'border-blue-200'
            },
        }
        return configs[status] || configs.cold
    }

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600 bg-green-50'
        if (score >= 70) return 'text-orange-600 bg-orange-50'
        return 'text-gray-600 bg-gray-50'
    }

    const getTimeAgo = (date: string) => {
        const now = new Date()
        const past = new Date(date)
        const diffMs = now.getTime() - past.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins}min atrás`
        if (diffHours < 24) return `${diffHours}h atrás`
        return `${diffDays}d atrás`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gerencie seus leads e oportunidades
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/leads/novo')}
                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all shadow-sm hover:shadow-md"
                >
                    <Plus size={20} />
                    Novo Lead
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-red-600 mb-1">Quentes</p>
                    <p className="text-2xl font-bold text-red-700">{stats.hot}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-orange-600 mb-1">Mornos</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.warm}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-blue-600 mb-1">Frios</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.cold}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Score Médio</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value="hot">Quente</option>
                        <option value="warm">Morno</option>
                        <option value="cold">Frio</option>
                    </select>

                    {/* Source Filter */}
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todas as fontes</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Google Ads">Google Ads</option>
                        <option value="Site">Site</option>
                        <option value="Facebook">Facebook</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Indicação">Indicação</option>
                    </select>

                    <button className="h-11 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Download size={20} />
                        <span className="hidden lg:inline">Exportar</span>
                    </button>
                </div>
            </div>

            {/* Leads List */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {filteredLeads.map((lead) => {
                        const statusConfig = getStatusConfig(lead.status)

                        return (
                            <div
                                key={lead.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/backoffice/leads/${lead.id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                                    {lead.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={14} />
                                                        {lead.email}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={14} />
                                                        {lead.phone}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getScoreColor(lead.score)}`}>
                                                {lead.score}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                {lead.source}
                                            </span>
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                                                <MapPin size={12} />
                                                {lead.location}
                                            </span>
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                                                <Building2 size={12} />
                                                {lead.interest}
                                            </span>
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <DollarSign size={12} />
                                                R$ {lead.budget}
                                            </span>
                                        </div>

                                        {/* Notes Preview */}
                                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                                            {lead.notes}
                                        </p>

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Criado {getTimeAgo(lead.created)}</span>
                                            <span>•</span>
                                            <span>Último contato {getTimeAgo(lead.lastContact)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.location.href = `mailto:${lead.email}`
                                            }}
                                            className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                            title="Enviar email"
                                        >
                                            <Mail size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.location.href = `https://wa.me/55${lead.phone.replace(/\D/g, '')}`
                                            }}
                                            className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                            title="WhatsApp"
                                        >
                                            <Phone size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/backoffice/leads/${lead.id}`)
                                            }}
                                            className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                            title="Ver detalhes"
                                        >
                                            <Eye size={16} className="text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Empty State */}
            {filteredLeads.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum lead encontrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Tente ajustar os filtros ou criar um novo lead
                    </p>
                    <button
                        onClick={() => router.push('/backoffice/leads/novo')}
                        className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all"
                    >
                        <Plus size={20} />
                        Novo Lead
                    </button>
                </div>
            )}
        </div>
    )
}
