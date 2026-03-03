'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Search,
    Building2,
    Phone,
    Mail,
    MapPin,
    Eye,
    Edit,
    Star,
    TrendingUp,
} from 'lucide-react'

// Interface para os dados reias do Supabase
export interface Developer {
    id: string; // or number depending on DB, uuid
    name: string;
    legal_name: string | null;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    logo_url?: string | null;
    // Stats mockadas momentaneamente por não ter na tabela raw
    empreendimentosAtivos?: number;
    unidadesVendidas?: number;
    receitaTotal?: number;
    rating?: number;
    parceriaDuracao?: string;
}

export default function ConstrutorasClient({ initialData }: { initialData: Developer[] }) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredConstrutoras = initialData.filter(constItem => {
        const matchesSearch =
            constItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (constItem.legal_name && constItem.legal_name.toLowerCase().includes(searchTerm.toLowerCase()))

        const statusText = constItem.is_active ? 'ativa' : 'inativa';
        const matchesStatus = statusFilter === 'all' || statusText === statusFilter;

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: initialData.length,
        ativas: initialData.filter(c => c.is_active).length,
        projetos: initialData.reduce((acc, c) => acc + (c.empreendimentosAtivos || 0), 0),
        vendas: initialData.reduce((acc, c) => acc + (c.unidadesVendidas || 0), 0),
        receita: initialData.reduce((acc, c) => acc + (c.receitaTotal || 0), 0),
    }

    const formatPrice = (price: number) => {
        if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
        if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
        return `R$ ${price.toFixed(0)}`
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Construtoras Parceiras</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gestão real integrada: {initialData.length} parceiros do portfólio IMI encontrados
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/construtoras/nova')}
                    className="flex items-center gap-2 h-11 px-6 bg-[#C49D5B] text-white rounded-xl font-medium hover:bg-[#b08a4a] transition-colors"
                >
                    <Plus size={20} />
                    Nova Construtora
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-green-600 mb-1">Ativas</p>
                    <p className="text-2xl font-bold text-green-700">{stats.ativas}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Projetos Ativos</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.projetos}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Unidades Vendidas</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.vendas}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Receita Total</p>
                    <p className="text-xl font-bold text-green-700">{formatPrice(stats.receita)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar pelo nome ou razão social..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B] focus:border-transparent transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B] bg-white transition-all"
                    >
                        <option value="all">Todos os status</option>
                        <option value="ativa">Ativa</option>
                        <option value="inativa">Inativa</option>
                    </select>
                </div>
            </div>

            {/* Grid de Construtoras */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredConstrutoras.map((construtora) => (
                    <div
                        key={construtora.id}
                        className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                        onClick={() => router.push(`/backoffice/construtoras/${construtora.id}`)}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                    {construtora.logo_url ? (
                                        <img src={construtora.logo_url} alt={construtora.name} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Building2 size={24} className="text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{construtora.name}</h3>
                                    <p className="text-xs text-gray-500 mb-1">{construtora.legal_name || 'Sem Razão Social'}</p>
                                    <p className="text-[10px] text-gray-400 font-mono tracking-wider">{construtora.cnpj || 'CNPJ NÃO CADASTRADO'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${construtora.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                    {construtora.is_active ? 'Ativa' : 'Inativa'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    <span className="text-sm font-bold text-gray-900">{construtora.rating?.toFixed(1) || '4.0'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-50">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Projetos</p>
                                <p className="text-lg font-bold text-blue-700">{construtora.empreendimentosAtivos || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Vendas</p>
                                <p className="text-lg font-bold text-[#C49D5B]">{construtora.unidadesVendidas || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">VGV / Receita</p>
                                <p className="text-sm font-bold text-emerald-600">{construtora.receitaTotal ? formatPrice(construtora.receitaTotal) : 'R$ 0'}</p>
                            </div>
                        </div>

                        {/* Contato */}
                        <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                <MapPin size={14} className="text-gray-400 shrink-0" />
                                <span className="line-clamp-1 truncate">{construtora.address || 'Endereço não cadastrado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                <Phone size={14} className="text-gray-400 shrink-0" />
                                <span>{construtora.phone || 'Sem telefone'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                <Mail size={14} className="text-gray-400 shrink-0" />
                                <span className="truncate">{construtora.email || 'Sem e-mail'}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 mt-auto">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span>Parceria: {construtora.parceriaDuracao || 'Nova'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/backoffice/construtoras/${construtora.id}`)
                                    }}
                                    className="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                >
                                    <Eye size={14} className="text-gray-600" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/backoffice/construtoras/${construtora.id}/editar`)
                                    }}
                                    className="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                >
                                    <Edit size={14} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredConstrutoras.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhuma construtora encontrada</h3>
                    <p className="text-xs text-gray-500 mb-6">Cadastre construtoras para que elas sejam exibidas na página pública de Empreendimentos.</p>
                    <button
                        onClick={() => router.push('/backoffice/construtoras/nova')}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-[#C49D5B] text-white rounded-xl text-sm font-medium hover:bg-[#b08a4a]"
                    >
                        <Plus size={16} />
                        Nova Construtora
                    </button>
                </div>
            )}
        </div>
    )
}
