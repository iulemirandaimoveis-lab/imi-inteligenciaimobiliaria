'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

export default function LogsPage() {
  const router = useRouter()
  const [logsData, setLogsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogsData(data)
      setLoading(false)
    }
    loadLogs()
  }, [])

  const filteredLogs = logsData.filter(log => {
    const matchesSearch =
      (log.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesModule = moduleFilter === 'all' || log.entity_type === moduleFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter

    return matchesSearch && matchesModule && matchesAction
  })

  const stats = {
    total: logsData.length,
    create: logsData.filter(l => l.action === 'create').length,
    update: logsData.filter(l => l.action === 'update' || l.action === 'edit').length,
    delete: logsData.filter(l => l.action === 'delete').length,
  }

  const getStatusConfig = (action: string) => {
    return { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-50', icon: Info }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      create: 'Criar',
      update: 'Atualizar',
      edit: 'Editar',
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
    if (!timestamp) return '-'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="text-sm text-gray-600 mt-1">
            Auditoria e histórico de atividades reais do sistema
          </p>
        </div>
        <button className="flex items-center gap-2 h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          <Download size={20} />
          Exportar Logs
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-gray-500">
          Carregando logs...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-gray-600 mb-1">Total (Últimos)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-green-600 mb-1">Criações</p>
              <p className="text-2xl font-bold text-green-700">{stats.create}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-blue-600 mb-1">Atualizações</p>
              <p className="text-2xl font-bold text-blue-700">{stats.update}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-xs text-red-600 mb-1">Exclusões</p>
              <p className="text-2xl font-bold text-red-700">{stats.delete}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por módulo, ação ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B]"
                />
              </div>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B] bg-white"
              >
                <option value="all">Todos os módulos</option>
                {Array.from(new Set(logsData.map(l => l.entity_type).filter(Boolean))).map(mod => (
                  <option key={String(mod)} value={String(mod)}>{String(mod)}</option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C49D5B] bg-white"
              >
                <option value="all">Todas as ações</option>
                <option value="create">Criar</option>
                <option value="update">Atualizar</option>
                <option value="edit">Editar</option>
                <option value="delete">Excluir</option>
                <option value="view">Visualizar</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border">
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log, idx) => {
                const statusConfig = getStatusConfig(log.action)
                const StatusIcon = statusConfig.icon

                return (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                          <StatusIcon size={20} className={statusConfig.color} />
                        </div>
                        {idx < filteredLogs.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                {getActionLabel(log.action)}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {log.entity_type || 'Geral'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium mb-1">Entidade ID: {log.entity_id || 'N/A'}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {log.user_id || 'System'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity size={12} />
                                {log.ip_address || '127.0.0.1'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatTimestamp(log.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhum log encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Retenção:</strong> Logs são mantidos por 90 dias. Exportações são recomendadas para auditoria de longo prazo.
        </p>
      </div>
    </div>
  )
}

