'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Usuários mockados
const usuariosData = [
  {
    id: 1,
    name: 'Iule Miranda',
    email: 'iule@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0001',
    role: 'Admin',
    roleColor: 'red',
    avatar: 'IM',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T15:30:00',
    criadoEm: '2025-01-15',
  },
  {
    id: 2,
    name: 'Carlos Mendonça',
    email: 'carlos@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0002',
    role: 'Gestor',
    roleColor: 'orange',
    avatar: 'CM',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T14:20:00',
    criadoEm: '2025-02-10',
  },
  {
    id: 3,
    name: 'Fernanda Lima',
    email: 'fernanda@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0003',
    role: 'Gestor',
    roleColor: 'orange',
    avatar: 'FL',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T13:45:00',
    criadoEm: '2025-02-15',
  },
  {
    id: 4,
    name: 'Roberto Silva',
    email: 'roberto@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0004',
    role: 'Corretor',
    roleColor: 'blue',
    avatar: 'RS',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T12:10:00',
    criadoEm: '2025-03-01',
  },
  {
    id: 5,
    name: 'Patricia Costa',
    email: 'patricia@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0005',
    role: 'Corretor',
    roleColor: 'blue',
    avatar: 'PC',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T11:30:00',
    criadoEm: '2025-03-05',
  },
  {
    id: 6,
    name: 'João Santos',
    email: 'joao@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0006',
    role: 'Avaliador',
    roleColor: 'purple',
    avatar: 'JS',
    status: 'ativo',
    ultimoAcesso: '2026-02-17T16:00:00',
    criadoEm: '2025-04-10',
  },
  {
    id: 7,
    name: 'Ana Paula Rodrigues',
    email: 'ana@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0007',
    role: 'Marketing',
    roleColor: 'green',
    avatar: 'AP',
    status: 'ativo',
    ultimoAcesso: '2026-02-18T10:15:00',
    criadoEm: '2025-05-20',
  },
  {
    id: 8,
    name: 'Ricardo Ferreira',
    email: 'ricardo@iulemirandaimoveis.com.br',
    phone: '(81) 99999-0008',
    role: 'Corretor',
    roleColor: 'blue',
    avatar: 'RF',
    status: 'inativo',
    ultimoAcesso: '2026-01-15T09:00:00',
    criadoEm: '2025-03-15',
  },
]

export default function UsuariosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsuarios = usuariosData.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: usuariosData.length,
    ativos: usuariosData.filter(u => u.status === 'ativo').length,
    inativos: usuariosData.filter(u => u.status === 'inativo').length,
    porRole: {
      Admin: usuariosData.filter(u => u.role === 'Admin').length,
      Gestor: usuariosData.filter(u => u.role === 'Gestor').length,
      Corretor: usuariosData.filter(u => u.role === 'Corretor').length,
      Avaliador: usuariosData.filter(u => u.role === 'Avaliador').length,
      Marketing: usuariosData.filter(u => u.role === 'Marketing').length,
    },
  }

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-50 text-red-700',
      orange: 'bg-orange-50 text-orange-700',
      blue: 'bg-blue-50 text-blue-700',
      purple: 'bg-purple-50 text-purple-700',
      green: 'bg-green-50 text-green-700',
    }
    return colors[color] || colors.blue
  }

  const getTimeAgo = (dateStr: string) => {
    const now = new Date()
    const past = new Date(dateStr)
    const diffMinutes = Math.floor((now.getTime() - past.getTime()) / 60000)

    if (diffMinutes < 60) return `${diffMinutes}min atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return `${Math.floor(diffMinutes / 1440)}d atrás`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie usuários e acessos</p>
        </div>
        <button
          onClick={() => router.push('/backoffice/settings/usuarios/novo')}
          className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-green-600 mb-1">Ativos</p>
          <p className="text-2xl font-bold text-green-700">{stats.ativos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Admin</p>
          <p className="text-2xl font-bold text-red-700">{stats.porRole.Admin}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Gestor</p>
          <p className="text-2xl font-bold text-orange-700">{stats.porRole.Gestor}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Corretor</p>
          <p className="text-2xl font-bold text-blue-700">{stats.porRole.Corretor}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Avaliador</p>
          <p className="text-2xl font-bold text-purple-700">{stats.porRole.Avaliador}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Marketing</p>
          <p className="text-2xl font-bold text-green-700">{stats.porRole.Marketing}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todas as roles</option>
            <option value="Admin">Admin</option>
            <option value="Gestor">Gestor</option>
            <option value="Corretor">Corretor</option>
            <option value="Avaliador">Avaliador</option>
            <option value="Marketing">Marketing</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredUsuarios.map((user) => (
            <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.roleColor)}`}>
                      {user.role}
                    </span>
                    {user.status === 'ativo' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} />
                      {user.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      Último acesso: {getTimeAgo(user.ultimoAcesso)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/backoffice/settings/usuarios/${user.id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
