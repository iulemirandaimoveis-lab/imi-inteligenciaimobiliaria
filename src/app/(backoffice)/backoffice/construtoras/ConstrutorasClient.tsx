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

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
}

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
                    <h1 className="text-2xl font-bold" style={{ color: T.text }}>Construtoras Parceiras</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                        Gestão real integrada: {initialData.length} parceiros do portfólio IMI encontrados
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/construtoras/nova')}
                    className="flex items-center gap-2 h-11 px-6 text-white rounded-xl font-medium transition-colors hover:brightness-110"
                    style={{ background: T.accent }}
                >
                    <Plus size={20} />
                    Nova Construtora
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Total</p>
                    <p className="text-2xl font-bold" style={{ color: T.text }}>{stats.total}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1 text-green-500">Ativas</p>
                    <p className="text-2xl font-bold text-green-500">{stats.ativas}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Projetos Ativos</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.projetos}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Unidades Vendidas</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.vendas}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Receita Total</p>
                    <p className="text-xl font-bold text-green-500">{formatPrice(stats.receita)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={20} style={{ color: T.textMuted }} />
                        <input
                            type="text"
                            placeholder="Buscar pelo nome ou razão social..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-[#334E68] transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#334E68] transition-all"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
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
                        className="rounded-2xl p-6 transition-all cursor-pointer flex flex-col h-full hover:brightness-105"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                        onClick={() => router.push(`/backoffice/construtoras/${construtora.id}`)}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                    {construtora.logo_url ? (
                                        <img src={construtora.logo_url} alt={construtora.name} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Building2 size={24} style={{ color: T.textMuted }} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold leading-tight mb-1" style={{ color: T.text }}>{construtora.name}</h3>
                                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>{construtora.legal_name || 'Sem Razão Social'}</p>
                                    <p className="text-[10px] font-mono tracking-wider" style={{ color: T.textMuted }}>{construtora.cnpj || 'CNPJ NÃO CADASTRADO'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${construtora.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    }`}>
                                    {construtora.is_active ? 'Ativa' : 'Inativa'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    <span className="text-sm font-bold" style={{ color: T.text }}>{construtora.rating?.toFixed(1) || '4.0'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 py-4"
                            style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>Projetos</p>
                                <p className="text-lg font-bold text-blue-400">{construtora.empreendimentosAtivos || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>Vendas</p>
                                <p className="text-lg font-bold" style={{ color: T.accent }}>{construtora.unidadesVendidas || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.textMuted }}>VGV / Receita</p>
                                <p className="text-sm font-bold text-emerald-400">{construtora.receitaTotal ? formatPrice(construtora.receitaTotal) : 'R$ 0'}</p>
                            </div>
                        </div>

                        {/* Contato */}
                        <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: T.elevated, color: T.textMuted }}>
                                <MapPin size={14} style={{ color: T.textMuted }} className="shrink-0" />
                                <span className="line-clamp-1 truncate">{construtora.address || 'Endereço não cadastrado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: T.elevated, color: T.textMuted }}>
                                <Phone size={14} style={{ color: T.textMuted }} className="shrink-0" />
                                <span>{construtora.phone || 'Sem telefone'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: T.elevated, color: T.textMuted }}>
                                <Mail size={14} style={{ color: T.textMuted }} className="shrink-0" />
                                <span className="truncate">{construtora.email || 'Sem e-mail'}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 mt-auto" style={{ borderTop: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md"
                                style={{ background: T.elevated, color: T.textMuted }}>
                                <TrendingUp size={12} className="text-emerald-400" />
                                <span>Parceria: {construtora.parceriaDuracao || 'Nova'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/backoffice/construtoras/${construtora.id}`)
                                    }}
                                    className="w-8 h-8 flex justify-center items-center rounded-lg transition-colors"
                                    style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/backoffice/construtoras/${construtora.id}/editar`)
                                    }}
                                    className="w-8 h-8 flex justify-center items-center rounded-lg transition-colors"
                                    style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredConstrutoras.length === 0 && (
                <div className="rounded-2xl p-12 text-center"
                    style={{ background: T.surface, border: `1px dashed ${T.border}` }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: T.elevated }}>
                        <Building2 size={24} style={{ color: T.textMuted }} />
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Nenhuma construtora encontrada</h3>
                    <p className="text-xs mb-6" style={{ color: T.textMuted }}>Cadastre construtoras para que elas sejam exibidas na página pública de Empreendimentos.</p>
                    <button
                        onClick={() => router.push('/backoffice/construtoras/nova')}
                        className="inline-flex items-center gap-2 h-10 px-5 text-white rounded-xl text-sm font-medium hover:brightness-110 transition-colors"
                        style={{ background: T.accent }}
                    >
                        <Plus size={16} />
                        Nova Construtora
                    </button>
                </div>
            )}
        </div>
    )
}
