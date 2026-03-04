'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  RefreshCw,
} from 'lucide-react'

const T = {
  bg: 'var(--bo-surface)',
  card: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  sub: 'var(--bo-text-muted)',
}

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  new_data: any
  old_data: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

function getModuleLabel(entity_type: string): string {
  const map: Record<string, string> = {
    lead: 'Leads', leads: 'Leads',
    imovel: 'Imóveis', development: 'Imóveis', developments: 'Imóveis',
    avaliacao: 'Avaliações', evaluation: 'Avaliações', avaliacoes: 'Avaliações',
    campanha: 'Campanhas', campaign: 'Campanhas', campaigns: 'Campanhas',
    contrato: 'Contratos', contract: 'Contratos',
    financeiro: 'Financeiro', transaction: 'Financeiro', transactions: 'Financeiro',
    auth: 'Auth', user: 'Usuários', broker: 'Corretores',
  }
  return map[entity_type?.toLowerCase()] || entity_type || 'Sistema'
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    login: 'Login', logout: 'Logout',
    create: 'Criar', update: 'Atualizar', delete: 'Excluir',
    view: 'Visualizar', export: 'Exportar', upload: 'Upload',
    failed_login: 'Login Falhou', failed_upload: 'Upload Falhou',
    send_email: 'Enviar Email', backup: 'Backup',
  }
  return labels[action] || action
}

function inferStatus(action: string): 'success' | 'error' | 'warning' | 'info' {
  const a = action?.toLowerCase() || ''
  if (a.includes('fail') || a.includes('error')) return 'error'
  if (a === 'delete') return 'warning'
  if (a === 'view' || a === 'export') return 'info'
  return 'success'
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function userDisplay(user_id: string | null): string {
  if (!user_id) return 'Sistema'
  return '…' + user_id.slice(-8)
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit?limit=100')
      const json = await res.json()
      if (json.data && Array.isArray(json.data)) {
        setLogs(json.data)
        setTotal(json.total || json.data.length)
      }
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const enriched = logs.map(log => ({
    ...log,
    module: getModuleLabel(log.entity_type),
    status: inferStatus(log.action),
    user: userDisplay(log.user_id),
    details: (() => {
      const action = getActionLabel(log.action)
      const entity = log.entity_type || ''
      const id = log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''
      const name = log.new_data?.name || log.new_data?.title || log.old_data?.name || ''
      return `${action}: ${entity}${id}${name ? ` — ${name}` : ''}`
    })(),
    ip: log.ip_address || '—',
  }))

  const filtered = enriched.filter(log => {
    const s = searchTerm.toLowerCase()
    const matchesSearch =
      log.user.toLowerCase().includes(s) ||
      log.details.toLowerCase().includes(s) ||
      (log.ip !== '—' && log.ip.includes(s)) ||
      log.entity_type.toLowerCase().includes(s)
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesModule && matchesStatus && matchesAction
  })

  const stats = {
    total,
    success: enriched.filter(l => l.status === 'success').length,
    errors: enriched.filter(l => l.status === 'error').length,
    warnings: enriched.filter(l => l.status === 'warning').length,
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    success: { label: 'Sucesso', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', icon: CheckCircle },
    error: { label: 'Erro', color: '#E57373', bg: 'rgba(229,115,115,0.12)', icon: XCircle },
    warning: { label: 'Aviso', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)', icon: AlertCircle },
    info: { label: 'Info', color: '#486581', bg: 'rgba(72,101,129,0.12)', icon: Info },
  }

  const inputBase: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.border}`,
    color: T.text,
    height: '40px',
    borderRadius: '10px',
    padding: '0 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  const selectOptions = {
    module: [
      { value: 'all', label: 'Todos os módulos' },
      { value: 'Leads', label: 'Leads' }, { value: 'Imóveis', label: 'Imóveis' },
      { value: 'Avaliações', label: 'Avaliações' }, { value: 'Campanhas', label: 'Campanhas' },
      { value: 'Contratos', label: 'Contratos' }, { value: 'Financeiro', label: 'Financeiro' },
      { value: 'Auth', label: 'Auth' }, { value: 'Sistema', label: 'Sistema' },
    ],
    status: [
      { value: 'all', label: 'Todos os status' },
      { value: 'success', label: 'Sucesso' }, { value: 'error', label: 'Erro' },
      { value: 'warning', label: 'Aviso' }, { value: 'info', label: 'Info' },
    ],
    action: [
      { value: 'all', label: 'Todas as ações' },
      { value: 'create', label: 'Criar' }, { value: 'update', label: 'Atualizar' },
      { value: 'delete', label: 'Excluir' }, { value: 'login', label: 'Login' },
      { value: 'view', label: 'Visualizar' }, { value: 'export', label: 'Exportar' },
    ],
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Logs do Sistema</h1>
          <p className="text-sm mt-1" style={{ color: T.sub }}>Auditoria e histórico de atividades</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 h-10 px-4 rounded-xl font-medium text-sm transition-all"
            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            className="flex items-center gap-2 h-10 px-4 rounded-xl font-medium text-sm transition-all"
            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}
          >
            <Download size={15} />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: T.text },
          { label: 'Sucesso', value: stats.success, color: '#6BB87B' },
          { label: 'Erros', value: stats.errors, color: '#E57373' },
          { label: 'Avisos', value: stats.warnings, color: '#E8A87C' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-xs mb-1" style={{ color: T.sub }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.sub }} />
            <input
              type="text"
              placeholder="Buscar por usuário, ação ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputBase, paddingLeft: '36px' }}
            />
          </div>
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={inputBase}>
            {selectOptions.module.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bo-elevated)' }}>{o.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputBase}>
            {selectOptions.status.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bo-elevated)' }}>{o.label}</option>)}
          </select>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={inputBase}>
            {selectOptions.action.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bo-elevated)' }}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
        {loading ? (
          <div className="py-16 text-center" style={{ color: T.sub }}>
            <RefreshCw size={28} className="animate-spin mx-auto mb-3" style={{ opacity: 0.4 }} />
            <p className="text-sm">Carregando logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: T.sub }}>
            <Activity size={36} className="mx-auto mb-3" style={{ opacity: 0.3 }} />
            <p className="text-sm font-medium mb-1" style={{ color: T.text }}>Nenhum log encontrado</p>
            <p className="text-xs">
              {logs.length === 0
                ? 'Ainda não há registros de auditoria no sistema.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((log, idx) => {
              const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.info
              const StatusIcon = cfg.icon
              return (
                <div
                  key={log.id}
                  className="p-5 transition-all hover:opacity-90"
                  style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : 'none' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <StatusIcon size={17} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {getActionLabel(log.action)}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: T.sub }}
                        >
                          {log.module}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1.5" style={{ color: T.text }}>{log.details}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: T.sub }}>
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {log.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={11} />
                          {log.ip}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}
      >
        <p className="text-sm" style={{ color: '#8CA4B8' }}>
          💡 <strong>Retenção:</strong> Logs são mantidos por 90 dias. Exportações são recomendadas para auditoria de longo prazo.
        </p>
      </div>
    </div>
  )
}
