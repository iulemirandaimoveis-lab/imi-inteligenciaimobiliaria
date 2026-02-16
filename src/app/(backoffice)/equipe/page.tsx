'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users,
    Plus,
    Search,
    Mail,
    Phone,
    Shield,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Award,
    TrendingUp,
} from 'lucide-react'

type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'
type UserStatus = 'active' | 'inactive' | 'pending'

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string
    role: UserRole
    status: UserStatus
    avatar?: string
    joinedAt: string
    lastActive: string
    stats: {
        leads: number
        sales: number
        revenue: number
    }
}

const mockTeam: TeamMember[] = [
    {
        id: '1',
        name: 'Laila Miranda',
        email: 'laila@iulemirandaimoveis.com.br',
        phone: '(81) 99999-9999',
        role: 'admin',
        status: 'active',
        joinedAt: '2024-01-01',
        lastActive: '2026-02-15T18:30:00',
        stats: { leads: 145, sales: 23, revenue: 15600000 },
    },
    {
        id: '2',
        name: 'Carlos Eduardo Silva',
        email: 'carlos@iulemirandaimoveis.com.br',
        phone: '(81) 98888-8888',
        role: 'manager',
        status: 'active',
        joinedAt: '2024-03-15',
        lastActive: '2026-02-15T17:45:00',
        stats: { leads: 98, sales: 15, revenue: 9800000 },
    },
    {
        id: '3',
        name: 'Ana Paula Costa',
        email: 'ana@iulemirandaimoveis.com.br',
        phone: '(81) 97777-7777',
        role: 'agent',
        status: 'active',
        joinedAt: '2024-06-01',
        lastActive: '2026-02-15T16:20:00',
        stats: { leads: 67, sales: 9, revenue: 5400000 },
    },
    {
        id: '4',
        name: 'Roberto Mendes',
        email: 'roberto@iulemirandaimoveis.com.br',
        phone: '(81) 96666-6666',
        role: 'agent',
        status: 'active',
        joinedAt: '2024-08-10',
        lastActive: '2026-02-15T14:10:00',
        stats: { leads: 52, sales: 7, revenue: 4200000 },
    },
    {
        id: '5',
        name: 'Juliana Santos',
        email: 'juliana@iulemirandaimoveis.com.br',
        phone: '(81) 95555-5555',
        role: 'viewer',
        status: 'pending',
        joinedAt: '2026-02-14',
        lastActive: '2026-02-14T10:00:00',
        stats: { leads: 0, sales: 0, revenue: 0 },
    },
]

export default function EquipePage() {
    const router = useRouter()
    const [team, setTeam] = useState(mockTeam)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
    const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')

    const getRoleBadge = (role: UserRole) => {
        const badges = {
            admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700', icon: Shield },
            manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-700', icon: Award },
            agent: { label: 'Corretor', color: 'bg-green-100 text-green-700', icon: Users },
            viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-700', icon: Users },
        }
        return badges[role]
    }

    const getStatusBadge = (status: UserStatus) => {
        const badges = {
            active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
            inactive: { label: 'Inativo', color: 'bg-red-100 text-red-700', icon: XCircle },
            pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        }
        return badges[status]
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const formatLastActive = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)

        if (minutes < 60) return `${minutes}m atrás`
        if (hours < 24) return `${hours}h atrás`
        return date.toLocaleDateString('pt-BR')
    }

    const filteredTeam = team
        .filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(member => roleFilter === 'all' || member.role === roleFilter)
        .filter(member => statusFilter === 'all' || member.status === statusFilter)

    const totalStats = team.reduce(
        (acc, member) => ({
            leads: acc.leads + member.stats.leads,
            sales: acc.sales + member.stats.sales,
            revenue: acc.revenue + member.stats.revenue,
        }),
        { leads: 0, sales: 0, revenue: 0 }
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {team.length} membro{team.length !== 1 ? 's' : ''} • {team.filter(m => m.status === 'active').length} ativo{team.filter(m => m.status === 'active').length !== 1 ? 's' : ''}
                    </p>
                </div>

                <button className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    <Plus size={18} />
                    Adicionar Membro
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalStats.leads}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalStats.sales}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Receita Total</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.revenue)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou email..."
                            className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Todas as funções</option>
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="agent">Corretor</option>
                        <option value="viewer">Visualizador</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                        className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Todos os status</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="pending">Pendente</option>
                    </select>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Membro
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Função
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Status
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Performance
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Última Atividade
                                </th>
                                <th className="text-right py-4 px-6 text-xs font-medium text-gray-600 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTeam.map((member) => {
                                const roleBadge = getRoleBadge(member.role)
                                const statusBadge = getStatusBadge(member.status)
                                const RoleIcon = roleBadge.icon
                                const StatusIcon = statusBadge.icon

                                return (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Member */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-600 flex items-center gap-1">
                                                            <Mail size={12} />
                                                            {member.email}
                                                        </span>
                                                        <span className="text-xs text-gray-600 flex items-center gap-1">
                                                            <Phone size={12} />
                                                            {member.phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1.5 ${roleBadge.color} rounded-lg text-xs font-medium flex items-center gap-1.5 w-fit`}>
                                                <RoleIcon size={14} />
                                                {roleBadge.label}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1.5 ${statusBadge.color} rounded-lg text-xs font-medium flex items-center gap-1.5 w-fit`}>
                                                <StatusIcon size={14} />
                                                {statusBadge.label}
                                            </span>
                                        </td>

                                        {/* Performance */}
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-600">
                                                    {member.stats.leads} leads • {member.stats.sales} vendas
                                                </p>
                                                <p className="text-xs font-medium text-gray-900">
                                                    {formatCurrency(member.stats.revenue)}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Last Active */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Clock size={12} />
                                                {formatLastActive(member.lastActive)}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTeam.length === 0 && (
                    <div className="py-12 text-center">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Nenhum membro encontrado
                        </h3>
                        <p className="text-sm text-gray-600">
                            Tente ajustar os filtros de busca
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
