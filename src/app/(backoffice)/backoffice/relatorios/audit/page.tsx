'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Search, User, Settings, Trash2, Plus, Edit, Eye,
  LogIn, LogOut, Download, AlertTriangle, CheckCircle, Clock, Lock,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

// DB action → UI action
function mapAction(action: string): string {
  switch (action?.toUpperCase()) {
    case 'INSERT': return 'create'
    case 'UPDATE': return 'update'
    case 'DELETE': return 'delete'
    default: return action?.toLowerCase() || 'view'
  }
}

// DB action → severidade
function mapSeveridade(action: string): string {
  switch (action?.toUpperCase()) {
    case 'INSERT': return 'success'
    case 'UPDATE': return 'info'
    case 'DELETE': return 'danger'
    default: return 'info'
  }
}

// DB entity_type → UI modulo
function mapModulo(entityType: string): string {
  const map: Record<string, string> = {
    leads: 'leads',
    developments: 'imoveis',
    contratos: 'contratos',
    financial_transactions: 'financeiro',
    campaigns: 'campanhas',
    automation_workflows: 'automacoes',
    avaliacoes: 'avaliacoes',
    consultorias: 'consultorias',
    conteudos: 'conteudos',
    settings: 'settings',
    notifications: 'sistema',
    playbooks: 'settings',
    brokers: 'equipe',
    developers: 'construtoras',
    projetos: 'projetos',
  }
  return map[entityType] || entityType || 'sistema'
}

function extractName(data: any): string | null {
  if (!data) return null
  return data.nome || data.name || data.titulo || data.title || data.email || null
}

function buildDescricao(action: string, entityType: string, newData: any, oldData: any): string {
  const acao = mapAction(action)
  const nome = extractName(newData) || extractName(oldData)
  const modulo = mapModulo(entityType)
  const acaoLabels: Record<string, string> = { create: 'criado', update: 'atualizado', delete: 'excluído' }
  const acaoLabel = acaoLabels[acao] || acao
  if (nome) return `${modulo.charAt(0).toUpperCase() + modulo.slice(1)} ${acaoLabel}: ${nome}`
  return `Registro ${acaoLabel} em ${modulo}`
}

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return 'Desconhecido'
  if (userAgent.includes('iPhone')) return 'iPhone · Safari'
  if (userAgent.includes('Android')) return 'Android · Chrome'
  if (userAgent.includes('Windows')) return 'Windows · Chrome'
  if (userAgent.includes('Mac')) return 'macOS · Chrome'
  if (userAgent.includes('curl')) return 'API · curl'
  return userAgent.slice(0, 30)
}

interface RawAuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: any
  new_data: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface UILog {
  id: string
  usuario: string
  acao: string
  modulo: string
  descricao: string
  ip: string
  dispositivo: string
  severidade: string
  timestamp: string
  entidade_id: string | null
}

function transformLog(raw: RawAuditLog): UILog {
  const usuario = raw.user_id ? `ID: ${raw.user_id.slice(0, 8)}…` : 'Sistema'
  return {
    id: raw.id,
    usuario,
    acao: mapAction(raw.action),
    modulo: mapModulo(raw.entity_type),
    descricao: buildDescricao(raw.action, raw.entity_type, raw.new_data, raw.old_data),
    ip: raw.ip_address || '—',
    dispositivo: parseDevice(raw.user_agent),
    severidade: mapSeveridade(raw.action),
    timestamp: raw.created_at,
    entidade_id: raw.entity_id,
  }
}

const ACAO_CONFIG: Record<string, { label: string; icon: any; textColor: string; bgColor: string }> = {
  login:  { label: 'Login',         icon: LogIn,    textColor: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)'  },
  logout: { label: 'Logout',        icon: LogOut,   textColor: '#94A3B8', bgColor: 'rgba(148,163,184,0.10)' },
  create: { label: 'Criação',       icon: Plus,     textColor: 'var(--bo-success)', bgColor: 'rgba(107,184,123,0.10)' },
  update: { label: 'Edição',        icon: Edit,     textColor: '#E8A87C', bgColor: 'rgba(232,168,124,0.10)' },
  delete: { label: 'Exclusão',      icon: Trash2,   textColor: 'var(--bo-error)', bgColor: 'rgba(229,115,115,0.10)' },
  view:   { label: 'Visualização',  icon: Eye,      textColor: '#94A3B8', bgColor: 'rgba(148,163,184,0.10)' },
  export: { label: 'Exportação',    icon: Download, textColor: '#C084FC', bgColor: 'rgba(192,132,252,0.10)' },
  sync:   { label: 'Sync',          icon: Settings, textColor: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)'  },
  backup: { label: 'Backup',        icon: Shield,   textColor: 'var(--bo-success)', bgColor: 'rgba(107,184,123,0.10)' },
}

const SEVERIDADE_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; icon: any }> = {
  info:    { label: 'Info',    textColor: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)',   icon: CheckCircle  },
  success: { label: 'Sucesso', textColor: 'var(--bo-success)', bgColor: 'rgba(107,184,123,0.10)', icon: CheckCircle  },
  warning: { label: 'Atenção', textColor: '#FCD34D', bgColor: 'rgba(252,211,77,0.10)',  icon: AlertTriangle },
  danger:  { label: 'Crítico', textColor: 'var(--bo-error)', bgColor: 'rgba(229,115,115,0.10)', icon: AlertTriangle },
}

const MODULOS = ['todos', 'auth', 'imoveis', 'leads', 'campanhas', 'avaliacoes', 'financeiro', 'contratos', 'automacoes', 'settings', 'sistema']

export default function AuditPage() {
  const [logs, setLogs] = useState<UILog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [moduloFiltro, setModuloFiltro] = useState('todos')
  const [severidadeFiltro, setSeveridadeFiltro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/audit?limit=100')
      .then(r => r.json())
      .then(json => {
        const raw: RawAuditLog[] = json.data || []
        setLogs(raw.map(transformLog))
        setTotal(json.total ?? raw.length)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const logsFiltrados = logs.filter(log => {
    const matchBusca =
      log.usuario.toLowerCase().includes(busca.toLowerCase()) ||
      log.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      log.modulo.toLowerCase().includes(busca.toLowerCase())
    const matchModulo = moduloFiltro === 'todos' || log.modulo === moduloFiltro
    const matchSeveridade = !severidadeFiltro || log.severidade === severidadeFiltro
    return matchBusca && matchModulo && matchSeveridade
  })

  const stats = {
    total,
    criticos: logs.filter(l => l.severidade === 'danger').length,
    atencao: logs.filter(l => l.severidade === 'warning').length,
    usuarios: [...new Set(logs.map(l => l.usuario))].length,
  }

  const exportCSV = () => {
    const headers = ['ID', 'Usuário', 'Ação', 'Módulo', 'Descrição', 'IP', 'Dispositivo', 'Status', 'Timestamp']
    const rows = logsFiltrados.map(l => [
      l.id,
      l.usuario,
      l.acao,
      l.modulo,
      `"${l.descricao.replace(/"/g, '""')}"`,
      l.ip,
      l.dispositivo,
      l.severidade,
      l.timestamp,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const getInitials = (nome: string) =>
    nome === 'Sistema'
      ? 'SYS'
      : nome.startsWith('ID:')
      ? nome.slice(4, 6).toUpperCase()
      : nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="RELATÓRIOS"
        title="Trilha de Auditoria"
        subtitle="Registro imutável de todas as ações no sistema"
        actions={
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}>
            <Download size={16} />
            Exportar CSV
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Eventos',  value: loading ? '…' : stats.total,    textColor: T.text,      bg: T.elevated,                      icon: Shield },
          { label: 'Críticos',          value: loading ? '…' : stats.criticos,  textColor: 'var(--bo-error)',   bg: 'rgba(239,68,68,0.08)',           icon: AlertTriangle },
          { label: 'Atenção',           value: loading ? '…' : stats.atencao,   textColor: '#FCD34D',   bg: 'rgba(245,158,11,0.08)',          icon: AlertTriangle },
          { label: 'Usuários Ativos',   value: loading ? '…' : stats.usuarios,  textColor: '#60A5FA',   bg: 'rgba(59,130,246,0.08)',          icon: User },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{s.label}</p>
                <Icon size={14} style={{ color: s.textColor }} />
              </div>
              <p className="text-3xl font-bold mt-1" style={{ color: s.textColor }}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por usuário, ação, módulo..."
            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>

        <select
          value={moduloFiltro}
          onChange={e => setModuloFiltro(e.target.value)}
          className="h-11 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#334E68]"
          style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
        >
          {MODULOS.map(m => (
            <option key={m} value={m}>
              {m === 'todos' ? 'Todos os módulos' : m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          {Object.entries(SEVERIDADE_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setSeveridadeFiltro(severidadeFiltro === k ? null : k)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={severidadeFiltro === k
                ? { background: v.bgColor, color: v.textColor, border: `1px solid ${v.textColor}` }
                : { background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }
              }
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3" style={{ background: T.elevated, borderBottom: `1px solid ${T.border}` }}>
          <div className="col-span-3 text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Usuário</div>
          <div className="col-span-2 text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Ação</div>
          <div className="col-span-4 text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Descrição</div>
          <div className="col-span-1 text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Status</div>
          <div className="col-span-2 text-xs font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Timestamp</div>
        </div>

        {/* Linhas */}
        <div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 animate-pulse items-center"
                style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none' }}>
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full" style={{ background: T.elevated }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded" style={{ background: T.elevated, width: '70%' }} />
                    <div className="h-2 rounded" style={{ background: T.elevated, width: '50%' }} />
                  </div>
                </div>
                <div className="col-span-2"><div className="h-6 w-20 rounded-lg" style={{ background: T.elevated }} /></div>
                <div className="col-span-4 space-y-1.5">
                  <div className="h-3 rounded" style={{ background: T.elevated, width: '90%' }} />
                  <div className="h-3 rounded" style={{ background: T.elevated, width: '60%' }} />
                </div>
                <div className="col-span-1"><div className="h-6 w-16 rounded-lg" style={{ background: T.elevated }} /></div>
                <div className="col-span-2 space-y-1.5">
                  <div className="h-3 rounded" style={{ background: T.elevated, width: '80%' }} />
                  <div className="h-2 rounded" style={{ background: T.elevated, width: '60%' }} />
                </div>
              </div>
            ))
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto mb-3" style={{ color: T.textMuted, opacity: 0.3 }} />
              <p className="font-medium" style={{ color: T.textMuted }}>Nenhum evento encontrado</p>
            </div>
          ) : (
            logsFiltrados.map((log, index) => {
              const acaoCfg = ACAO_CONFIG[log.acao] || ACAO_CONFIG['view']
              const sevCfg = SEVERIDADE_CONFIG[log.severidade] || SEVERIDADE_CONFIG['info']
              const AcaoIcon = acaoCfg.icon
              const SevIcon = sevCfg.icon

              return (
                <div key={log.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 transition-colors items-center"
                  style={{ borderTop: index > 0 ? `1px solid ${T.border}` : 'none' }}>

                  {/* Usuário */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{
                        background: log.usuario === 'Sistema' ? T.elevated : `${T.accent}20`,
                        color: log.usuario === 'Sistema' ? T.textMuted : T.accent,
                      }}>
                      {getInitials(log.usuario)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: T.text }}>{log.usuario}</p>
                      <p className="text-[10px] truncate" style={{ color: T.textMuted }}>{log.ip}</p>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: acaoCfg.bgColor, color: acaoCfg.textColor }}>
                      <AcaoIcon size={12} />
                      {acaoCfg.label}
                    </span>
                  </div>

                  {/* Descrição */}
                  <div className="col-span-4">
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{log.descricao}</p>
                    {log.entidade_id && (
                      <p className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded inline-block"
                        style={{ background: T.elevated, color: T.textMuted }}>
                        ID: {log.entidade_id.slice(0, 12)}…
                      </p>
                    )}
                  </div>

                  {/* Severidade */}
                  <div className="col-span-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: sevCfg.bgColor, color: sevCfg.textColor }}>
                      <SevIcon size={12} />
                      {sevCfg.label}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: T.text }}>
                      <Clock size={12} style={{ color: T.textMuted }} />
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <p className="text-[10px] truncate mt-1" style={{ color: T.textMuted }}>{log.dispositivo}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}`, background: T.elevated }}>
          <span className="text-xs font-medium" style={{ color: T.textMuted }}>
            {loading ? 'Carregando…' : `${logsFiltrados.length} de ${total} eventos registrados`}
          </span>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
            <Lock size={12} />
            Logs Imutáveis — Supabase DB
          </div>
        </div>
      </div>
    </div>
  )
}
