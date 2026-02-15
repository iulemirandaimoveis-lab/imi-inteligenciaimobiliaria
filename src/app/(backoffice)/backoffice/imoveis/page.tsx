'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search,
    Filter,
    Download,
    Plus,
    MapPin,
    Building2,
    Bed,
    Bath,
    Ruler,
    Car,
    DollarSign,
    TrendingUp,
    Eye,
    Edit,
    MoreVertical,
    Heart,
    Share2,
    Calendar,
    Users,
    CheckCircle,
    Clock,
    Tag,
} from 'lucide-react'
import Image from 'next/image'

// ⚠️ NÃO MODIFICAR ESTES DADOS - SÃO REAIS DE RECIFE
const imoveisData = [
    {
        id: 1,
        name: 'Reserva Atlantis',
        type: 'Apartamento',
        status: 'lancamento',
        location: 'Boa Viagem',
        address: 'Av. Boa Viagem, 5420',
        price: 650000,
        pricePerM2: 8125,
        area: 80,
        bedrooms: 3,
        bathrooms: 2,
        parking: 2,
        units: 120,
        unitsSold: 45,
        leads: 67,
        views: 1234,
        image: '/images/imoveis/reserva-atlantis.jpg',
        features: ['Vista Mar', 'Varanda Gourmet', 'Piscina', 'Academia'],
        developer: 'Grupo IMI',
        completion: '2027-06',
        created: '2026-02-01',
    },
    {
        id: 2,
        name: 'Villa Jardins',
        type: 'Apartamento',
        status: 'obras',
        location: 'Piedade',
        address: 'R. Real da Torre, 890',
        price: 480000,
        pricePerM2: 7059,
        area: 68,
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        units: 80,
        unitsSold: 52,
        leads: 43,
        views: 876,
        image: '/images/imoveis/villa-jardins.jpg',
        features: ['Área Verde', 'Pet Place', 'Salão Festas'],
        developer: 'Construtora Central',
        completion: '2026-12',
        created: '2025-11-15',
    },
    {
        id: 3,
        name: 'Smart Pina',
        type: 'Apartamento',
        status: 'pronto',
        location: 'Pina',
        address: 'Av. Herculano Bandeira, 234',
        price: 420000,
        pricePerM2: 7000,
        area: 60,
        bedrooms: 2,
        bathrooms: 1,
        parking: 1,
        units: 60,
        unitsSold: 58,
        leads: 12,
        views: 456,
        image: '/images/imoveis/smart-pina.jpg',
        features: ['Smart Home', 'Bike Place', 'Coworking'],
        developer: 'Urbana Empreendimentos',
        completion: '2025-08',
        created: '2025-03-10',
    },
    {
        id: 4,
        name: 'Península Gardens',
        type: 'Casa',
        status: 'lancamento',
        location: 'Setúbal',
        address: 'R. Setúbal Premium',
        price: 1200000,
        pricePerM2: 6000,
        area: 200,
        bedrooms: 4,
        bathrooms: 4,
        parking: 4,
        units: 24,
        unitsSold: 8,
        leads: 28,
        views: 623,
        image: '/images/imoveis/peninsula-gardens.jpg',
        features: ['Quintal', 'Churrasqueira', 'Piscina', 'Segurança 24h'],
        developer: 'Premium Construções',
        completion: '2027-03',
        created: '2026-01-20',
    },
    {
        id: 5,
        name: 'Ocean Blue',
        type: 'Cobertura',
        status: 'obras',
        location: 'Boa Viagem',
        address: 'Av. Conselheiro Aguiar, 3344',
        price: 1850000,
        pricePerM2: 11562,
        area: 160,
        bedrooms: 4,
        bathrooms: 5,
        parking: 3,
        units: 12,
        unitsSold: 7,
        leads: 19,
        views: 891,
        image: '/images/imoveis/ocean-blue.jpg',
        features: ['Vista 360°', 'Piscina Privativa', 'Adega', 'Home Theater'],
        developer: 'Luxury Incorporadora',
        completion: '2026-09',
        created: '2025-09-05',
    },
    {
        id: 6,
        name: 'Candeias Park',
        type: 'Apartamento',
        status: 'lancamento',
        location: 'Candeias',
        address: 'Av. Caxangá, 5678',
        price: 280000,
        pricePerM2: 5600,
        area: 50,
        bedrooms: 2,
        bathrooms: 1,
        parking: 1,
        units: 150,
        unitsSold: 23,
        leads: 89,
        views: 1567,
        image: '/images/imoveis/candeias-park.jpg',
        features: ['Preço Acessível', 'Perto Metrô', 'Playground'],
        developer: 'Habitare Construtora',
        completion: '2027-12',
        created: '2026-02-10',
    },
]

// ⚠️ NÃO MODIFICAR CÁLCULOS
const stats = {
    total: imoveisData.length,
    lancamento: imoveisData.filter(i => i.status === 'lancamento').length,
    obras: imoveisData.filter(i => i.status === 'obras').length,
    pronto: imoveisData.filter(i => i.status === 'pronto').length,
    totalUnits: imoveisData.reduce((acc, i) => acc + i.units, 0),
    totalSold: imoveisData.reduce((acc, i) => acc + i.unitsSold, 0),
    totalLeads: imoveisData.reduce((acc, i) => acc + i.leads, 0),
    avgPrice: Math.round(imoveisData.reduce((acc, i) => acc + i.price, 0) / imoveisData.length),
}

export default function ImoveisPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [locationFilter, setLocationFilter] = useState<string>('all')

    // ⚠️ NÃO MODIFICAR LÓGICA DE FILTROS
    const filteredImoveis = imoveisData.filter(imovel => {
        const matchesSearch =
            imovel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            imovel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            imovel.developer.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || imovel.status === statusFilter
        const matchesType = typeFilter === 'all' || imovel.type === typeFilter
        const matchesLocation = locationFilter === 'all' || imovel.location === locationFilter

        return matchesSearch && matchesStatus && matchesType && matchesLocation
    })

    // ⚠️ NÃO MODIFICAR FUNÇÃO getStatusConfig
    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string; border: string }> = {
            lancamento: {
                label: 'Lançamento',
                color: 'text-blue-700',
                bg: 'bg-blue-50',
                border: 'border-blue-200'
            },
            obras: {
                label: 'Em Obras',
                color: 'text-orange-700',
                bg: 'bg-orange-50',
                border: 'border-orange-200'
            },
            pronto: {
                label: 'Pronto',
                color: 'text-green-700',
                bg: 'bg-green-50',
                border: 'border-green-200'
            },
        }
        return configs[status] || configs.lancamento
    }

    // ⚠️ NÃO MODIFICAR FUNÇÃO formatPrice
    const formatPrice = (price: number) => {
        if (price >= 1000000) {
            return `R$ ${(price / 1000000).toFixed(1)}M`
        }
        return `R$ ${(price / 1000).toFixed(0)}k`
    }

    // ⚠️ NÃO MODIFICAR FUNÇÃO getVelocity
    const getVelocity = (sold: number, total: number) => {
        const percentage = (sold / total) * 100
        if (percentage >= 70) return { label: 'Alta', color: 'text-green-600', bg: 'bg-green-50' }
        if (percentage >= 40) return { label: 'Média', color: 'text-orange-600', bg: 'bg-orange-50' }
        return { label: 'Baixa', color: 'text-red-600', bg: 'bg-red-50' }
    }

    return (
        <div className="space-y-6">
            {/* ⚠️ NÃO MODIFICAR HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Gerencie seu portfólio de empreendimentos
                    </p>
                </div>
                <button
                    onClick={() => router.push('/backoffice/imoveis/novo')}
                    className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all shadow-sm hover:shadow-md"
                >
                    <Plus size={20} />
                    Novo Imóvel
                </button>
            </div>

            {/* ⚠️ NÃO MODIFICAR STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2 md:col-span-2 lg:col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Total Empreendimentos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-blue-600 mb-1">Lançamentos</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.lancamento}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-orange-600 mb-1">Em Obras</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.obras}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-green-600 mb-1">Prontos</p>
                    <p className="text-2xl font-bold text-green-700">{stats.pronto}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Unidades</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Vendidas</p>
                    <p className="text-2xl font-bold text-green-700">{stats.totalSold}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">Leads</p>
                    <p className="text-2xl font-bold text-accent-700">{stats.totalLeads}</p>
                </div>
            </div>

            {/* ⚠️ NÃO MODIFICAR FILTROS */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, local ou construtora..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value="lancamento">Lançamento</option>
                        <option value="obras">Em Obras</option>
                        <option value="pronto">Pronto</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Casa">Casa</option>
                        <option value="Cobertura">Cobertura</option>
                    </select>

                    <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                    >
                        <option value="all">Todas as regiões</option>
                        <option value="Boa Viagem">Boa Viagem</option>
                        <option value="Pina">Pina</option>
                        <option value="Piedade">Piedade</option>
                        <option value="Setúbal">Setúbal</option>
                        <option value="Candeias">Candeias</option>
                    </select>
                </div>
            </div>

            {/* ⚠️ NÃO MODIFICAR GRID DE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredImoveis.map((imovel) => {
                    const statusConfig = getStatusConfig(imovel.status)
                    const soldPercentage = (imovel.unitsSold / imovel.units) * 100
                    const velocity = getVelocity(imovel.unitsSold, imovel.units)

                    return (
                        <div
                            key={imovel.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => router.push(`/backoffice/imoveis/${imovel.id}`)}
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                                {/* Placeholder - substitua por Image quando tiver imagens */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Building2 size={48} className="text-gray-400" />
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} backdrop-blur-sm`}>
                                        {statusConfig.label}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            console.log('Favoritar', imovel.id)
                                        }}
                                        className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <Heart size={16} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            console.log('Compartilhar', imovel.id)
                                        }}
                                        className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <Share2 size={16} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Title */}
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {imovel.name}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mb-4">
                                    <MapPin size={14} />
                                    {imovel.location} • {imovel.type}
                                </p>

                                {/* Price */}
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-2xl font-bold text-accent-700">
                                        {formatPrice(imovel.price)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        R$ {imovel.pricePerM2.toLocaleString('pt-BR')}/m²
                                    </span>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-100">
                                    <div className="text-center">
                                        <Bed size={18} className="text-gray-400 mx-auto mb-1" />
                                        <p className="text-sm font-medium text-gray-900">{imovel.bedrooms}</p>
                                    </div>
                                    <div className="text-center">
                                        <Bath size={18} className="text-gray-400 mx-auto mb-1" />
                                        <p className="text-sm font-medium text-gray-900">{imovel.bathrooms}</p>
                                    </div>
                                    <div className="text-center">
                                        <Ruler size={18} className="text-gray-400 mx-auto mb-1" />
                                        <p className="text-sm font-medium text-gray-900">{imovel.area}m²</p>
                                    </div>
                                    <div className="text-center">
                                        <Car size={18} className="text-gray-400 mx-auto mb-1" />
                                        <p className="text-sm font-medium text-gray-900">{imovel.parking}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Vendas</span>
                                        <span className="font-medium text-gray-900">
                                            {imovel.unitsSold}/{imovel.units} unidades
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent-500 rounded-full transition-all duration-500"
                                            style={{ width: `${soldPercentage}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${velocity.bg} ${velocity.color}`}>
                                            Velocidade {velocity.label}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {imovel.leads} leads
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} />
                                                {imovel.views}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ⚠️ NÃO MODIFICAR EMPTY STATE */}
            {filteredImoveis.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum imóvel encontrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Tente ajustar os filtros ou adicionar um novo imóvel
                    </p>
                    <button
                        onClick={() => router.push('/backoffice/imoveis/novo')}
                        className="inline-flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-all"
                    >
                        <Plus size={20} />
                        Novo Imóvel
                    </button>
                </div>
            )}
        </div>
    )
}
