'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Save,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Roles e permissões mockadas
const rolesData = [
  {
    id: 1,
    name: 'Admin',
    description: 'Acesso completo ao sistema',
    usuarios: 2,
    color: 'red',
    permissions: {
      leads: { view: true, create: true, edit: true, delete: true },
      imoveis: { view: true, create: true, edit: true, delete: true },
      avaliacoes: { view: true, create: true, edit: true, delete: true },
      campanhas: { view: true, create: true, edit: true, delete: true },
      financeiro: { view: true, create: true, edit: true, delete: true },
      relatorios: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
      equipe: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 2,
    name: 'Gestor',
    description: 'Gestão de operações e equipe',
    usuarios: 3,
    color: 'orange',
    permissions: {
      leads: { view: true, create: true, edit: true, delete: false },
      imoveis: { view: true, create: true, edit: true, delete: false },
      avaliacoes: { view: true, create: true, edit: true, delete: false },
      campanhas: { view: true, create: true, edit: true, delete: false },
      financeiro: { view: true, create: false, edit: false, delete: false },
      relatorios: { view: true, create: true, edit: true, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
      equipe: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 3,
    name: 'Corretor',
    description: 'Vendas e atendimento de leads',
    usuarios: 8,
    color: 'blue',
    permissions: {
      leads: { view: true, create: true, edit: true, delete: false },
      imoveis: { view: true, create: false, edit: false, delete: false },
      avaliacoes: { view: true, create: false, edit: false, delete: false },
      campanhas: { view: false, create: false, edit: false, delete: false },
      financeiro: { view: false, create: false, edit: false, delete: false },
      relatorios: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      equipe: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    id: 4,
    name: 'Avaliador',
    description: 'Avaliações e laudos técnicos',
    usuarios: 2,
    color: 'purple',
    permissions: {
      leads: { view: true, create: false, edit: false, delete: false },
      imoveis: { view: true, create: false, edit: false, delete: false },
      avaliacoes: { view: true, create: true, edit: true, delete: false },
      campanhas: { view: false, create: false, edit: false, delete: false },
      financeiro: { view: false, create: false, edit: false, delete: false },
      relatorios: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      equipe: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 5,
    name: 'Marketing',
    description: 'Campanhas e conteúdo',
    usuarios: 2,
    color: 'green',
    permissions: {
      leads: { view: true, create: false, edit: false, delete: false },
      imoveis: { view: true, create: false, edit: false, delete: false },
      avaliacoes: { view: false, create: false, edit: false, delete: false },
      campanhas: { view: true, create: true, edit: true, delete: false },
      financeiro: { view: false, create: false, edit: false, delete: false },
      relatorios: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      equipe: { view: false, create: false, edit: false, delete: false },
    },
  },
]

const modules = [
  { key: 'leads', label: 'Leads' },
  { key: 'imoveis', label: 'Imóveis' },
  { key: 'avaliacoes', label: 'Avaliações' },
  { key: 'campanhas', label: 'Campanhas' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'settings', label: 'Configurações' },
  { key: 'equipe', label: 'Equipe' },
]

const actions = [
  { key: 'view', label: 'Visualizar', icon: Eye },
  { key: 'create', label: 'Criar', icon: Edit },
  { key: 'edit', label: 'Editar', icon: Edit },
  { key: 'delete', label: 'Excluir', icon: Trash2 },
]

export default function PermissoesPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState(rolesData[0])
  const [hasChanges, setHasChanges] = useState(false)

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-50 text-red-700 border-red-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      green: 'bg-green-50 text-green-700 border-green-200',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissões e Roles</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie permissões de acesso por função
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasChanges(false)}
              className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={20} />
              Descartar
            </button>
            <button
              onClick={() => setHasChanges(false)}
              className="flex items-center gap-2 h-11 px-6 bg-[#16162A] text-white rounded-xl font-medium hover:bg-[#0F0F1E] transition-colors"
            >
              <Save size={20} />
              Salvar Alterações
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total Roles</p>
          <p className="text-2xl font-bold text-gray-900">{rolesData.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total Usuários</p>
          <p className="text-2xl font-bold text-gray-900">
            {rolesData.reduce((acc, r) => acc + r.usuarios, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Módulos</p>
          <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Ações</p>
          <p className="text-2xl font-bold text-gray-900">{actions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 border sticky top-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Roles
            </h2>
            <div className="space-y-2">
              {rolesData.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${selectedRole.id === role.id
                      ? 'bg-accent-50 border-2 border-[#3B82F6]'
                      : 'border border-gray-200 hover:border-accent-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{role.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(role.color)}`}>
                      {role.usuarios}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{role.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={24} className="text-[#3B82F6]" />
                <h2 className="text-lg font-bold text-gray-900">{selectedRole.name}</h2>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleColor(selectedRole.color)}`}>
                  {selectedRole.usuarios} usuários
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedRole.description}</p>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">
                      Módulo
                    </th>
                    {actions.map((action) => (
                      <th key={action.key} className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-1">
                          <action.icon size={14} />
                          <span>{action.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modules.map((module) => {
                    const perms = selectedRole.permissions[module.key as keyof typeof selectedRole.permissions]

                    return (
                      <tr key={module.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {module.label}
                        </td>
                        {actions.map((action) => {
                          const hasPermission = perms[action.key as keyof typeof perms]

                          return (
                            <td key={action.key} className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                {hasPermission ? (
                                  <CheckCircle size={20} className="text-green-600" />
                                ) : (
                                  <XCircle size={20} className="text-gray-300" />
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Sobre Permissões</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Admin:</strong> Acesso completo a todos os módulos</li>
          <li>• <strong>Gestor:</strong> Pode gerenciar operações mas não pode excluir dados críticos</li>
          <li>• <strong>Corretor:</strong> Foco em leads e vendas, acesso limitado a relatórios</li>
          <li>• <strong>Avaliador:</strong> Especializado em avaliações técnicas</li>
          <li>• <strong>Marketing:</strong> Gestão de campanhas e conteúdo</li>
        </ul>
      </div>
    </div>
  )
}
