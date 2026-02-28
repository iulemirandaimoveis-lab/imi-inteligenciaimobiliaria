'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Download,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Logs mockados
const logsData = [
  {
    id: 1,
    timestamp: '2026-02-18T15:30:45',
    user: 'Iule Miranda',
    action: 'login',
    module: 'Auth',
    details: 'Login bem-sucedido via email',
    ip: '177.123.45.67',
    status: 'success',
  },
  {
    id: 2,
    timestamp: '2026-02-18T15:28:12',
    user: 'Carlos Mendonça',
    action: 'update',
    module: 'Leads',
    details: 'Atualizou lead #LDS-2026-045 - Status: pendente → qualificado',
    ip: '177.123.45.68',
    status: 'success',
  },
  {
    id: 3,
    timestamp: '2026-02-18T15:25:33',
    user: 'Fernanda Lima',
    action: 'create',
    module: 'Avaliações',
    details: 'Criou nova avaliação AVL-2026-008 - Reserva Atlantis Apto 905',
    ip: '177.123.45.69',
    status: 'success',
  },
  {
    id: 4,
    timestamp: '2026-02-18T15:20:15',
    user: 'Roberto Silva',
    action: 'failed_login',
    module: 'Auth',
    details: 'Tentativa de login com senha incorreta',
    ip: '177.123.45.70',
    status: 'error',
  },
  {
    id: 5,
    timestamp: '2026-02-18T15:18:42',
    user: 'Patricia Costa',
    action: 'delete',
    module: 'Campanhas',
    details: 'Excluiu campanha rascunho "Test Campaign Draft"',
    ip: '177.123.45.71',
    status: 'warning',
  },
  {
    id: 6,
    timestamp: '2026-02-18T15:15:20',
    user: 'João Santos',
    action: 'view',
    module: 'Relatórios',
    details: 'Visualizou relatório executivo de Fevereiro 2026',
    ip: '177.123.45.72',
    status: 'info',
  },
  {
    id: 7,
    timestamp: '2026-02-18T15:12:05',
    user: 'Ana Paula Rodrigues',
    action: 'update',
    module: 'Campanhas',
    details: 'Atualizou orçamento da campanha Instagram Reserva Atlantis',
    ip: '177.123.45.73',
    status: 'success',
  },
  {
    id: 8,
    timestamp: '2026-02-18T15:08:30',
    user: 'Iule Miranda',
    action: 'create',
    module: 'Imóveis',
    details: 'Cadastrou novo empreendimento "Península Blue"',
    ip: '177.123.45.67',
    status: 'success',
  },
  {
    id: 9,
    timestamp: '2026-02-18T15:05:18',
    user: 'Carlos Mendonça',
    action: 'export',
    module: 'Leads',
    details: 'Exportou 127 leads para CSV',
    ip: '177.123.45.68',
    status: 'success',
  },
  {
    id: 10,
    timestamp: '2026-02-18T15:02:45',
    user: 'System',
    action: 'backup',
    module: 'System',
    details: 'Backup automático do banco de dados concluído',
    ip: '127.0.0.1',
    status: 'success',
  },
  {
    id: 11,
    timestamp: '2026-02-18T14:58:12',
    user: 'Fernanda Lima',
    action: 'failed_upload',
    module: 'Avaliações',
    details: 'Falha ao fazer upload de arquivo (tamanho excede 10MB)',
    ip: '177.123.45.69',
    status: 'error',
  },
  {
    id: 12,
    timestamp: '2026-02-18T14:55:30',
    user: 'Roberto Silva',
    action: 'send_email',
    module: 'Leads',
    details: 'Enviou email de follow-up para Maria Santos Silva',
    ip: '177.123.45.70',
    status: 'success',
  },
]

export default function LogsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const filteredLogs = logsData.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm)
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesModule && matchesStatus && matchesAction
  })

  const stats = {
    total: logsData.length,
    success: logsData.filter(l => l.status === 'success').length,
    errors: logsData.filter(l => l.status === 'error').length,
    warnings: logsData.filter(l => l.status === 'warning').length,
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      success: { label: 'Sucesso', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
      error: { label: 'Erro', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
      warning: { label: 'Aviso', color: 'text-orange-700', bg: 'bg-orange-50', icon: AlertCircle },
      info: { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-50', icon: Info },
    }
    return configs[status] || configs.info
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
      view: 'Visualizar',
      export: 'Exportar',
      upload: 'Upload',
      failed_login: 'Login Falhou',
      failed_upload: 'Upload Falhou',
      send_email: 'Enviar Email',
      backup: 'Backup',
    }
    return labels[action] || action
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="text-sm text-gray-600 mt-1">
            Auditoria e histórico de atividades
          </p>
        </div>
        <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          <Download size={20} />
          Exportar Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-green-600 mb-1">Sucesso</p>
          <p className="text-2xl font-bold text-green-700">{stats.success}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-red-600 mb-1">Erros</p>
          <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-xs text-orange-600 mb-1">Avisos</p>
          <p className="text-2xl font-bold text-orange-700">{stats.warnings}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuário, ação ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
          >
            <option value="all">Todos os módulos</option>
            <option value="Auth">Auth</option>
            <option value="Leads">Leads</option>
            <option value="Imóveis">Imóveis</option>
            <option value="Avaliações">Avaliações</option>
            <option value="Campanhas">Campanhas</option>
            <option value="Relatórios">Relatórios</option>
            <option value="System">System</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
          >
            <option value="all">Todas as ações</option>
            <option value="login">Login</option>
            <option value="create">Criar</option>
            <option value="update">Atualizar</option>
            <option value="delete">Excluir</option>
            <option value="view">Visualizar</option>
            <option value="export">Exportar</option>
          </select>
        </div>
      </div>

      {/* Timeline de Logs */}
      <div className="bg-white rounded-xl border">
        <div className="divide-y divide-gray-100">
          {filteredLogs.map((log, idx) => {
            const statusConfig = getStatusConfig(log.status)
            const StatusIcon = statusConfig.icon

            return (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                      <StatusIcon size={20} className={statusConfig.color} />
                    </div>
                    {idx < filteredLogs.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {log.module}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity size={12} />
                            {log.ip}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Retenção:</strong> Logs são mantidos por 90 dias. Exportações são recomendadas para auditoria de longo prazo.
        </p>
      </div>
    </div>
  )
}
