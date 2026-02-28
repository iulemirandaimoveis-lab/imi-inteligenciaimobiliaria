// ============================================
// BLOCO 4 — SCRIPT 8: TRILHA DE AUDITORIA (LOGS)
// ⚠️ COPIAR EXATAMENTE — NÃO MODIFICAR
// ============================================

/**
 * SALVAR EM: src/app/(backoffice)/backoffice/relatorios/audit/page.tsx
 */

'use client'

import { useState } from 'react'
import {
  Shield,
  Search,
  Filter,
  User,
  Home,
  FileText,
  Settings,
  Trash2,
  Plus,
  Edit,
  Eye,
  LogIn,
  LogOut,
  Download,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
} from 'lucide-react'

// ⚠️ NÃO MODIFICAR - Registros de auditoria mockados contextualizados
const AUDIT_LOGS = [
  {
    id: 1,
    usuario: 'Iule Miranda',
    email: 'iule@imiatlantica.com.br',
    acao: 'login',
    modulo: 'auth',
    descricao: 'Login realizado com sucesso',
    ip: '187.103.45.21',
    dispositivo: 'Chrome 121 · macOS',
    severidade: 'info',
    timestamp: '2026-02-19T14:32:10',
  },
  {
    id: 2,
    usuario: 'Iule Miranda',
    email: 'iule@imiatlantica.com.br',
    acao: 'create',
    modulo: 'imoveis',
    descricao: 'Novo imóvel criado: Ocean Blue Cobertura 1201 — R$ 2,8M',
    ip: '187.103.45.21',
    dispositivo: 'Chrome 121 · macOS',
    severidade: 'success',
    timestamp: '2026-02-19T14:45:22',
    entidade_id: 'imo_8821',
  },
  {
    id: 3,
    usuario: 'Ana Paula Ferreira',
    email: 'anapaula@imiatlantica.com.br',
    acao: 'update',
    modulo: 'leads',
    descricao: 'Lead Maria Santos Silva atualizado: status alterado para "Proposta enviada"',
    ip: '189.77.34.198',
    dispositivo: 'Safari · iPhone 15',
    severidade: 'info',
    timestamp: '2026-02-19T13:15:05',
    entidade_id: 'lead_0042',
  },
  {
    id: 4,
    usuario: 'Carlos Eduardo Silva',
    email: 'carlos@imiatlantica.com.br',
    acao: 'export',
    modulo: 'relatorios',
    descricao: 'Relatório financeiro Q4/2025 exportado em PDF',
    ip: '192.168.1.45',
    dispositivo: 'Chrome 121 · Windows',
    severidade: 'warning',
    timestamp: '2026-02-19T11:30:00',
  },
  {
    id: 5,
    usuario: 'Iule Miranda',
    email: 'iule@imiatlantica.com.br',
    acao: 'delete',
    modulo: 'campanhas',
    descricao: 'Campanha "Verão 2025 — Setúbal" excluída permanentemente',
    ip: '187.103.45.21',
    dispositivo: 'Chrome 121 · macOS',
    severidade: 'danger',
    timestamp: '2026-02-18T16:55:12',
    entidade_id: 'camp_0091',
  },
  {
    id: 6,
    usuario: 'Ana Paula Ferreira',
    email: 'anapaula@imiatlantica.com.br',
    acao: 'create',
    modulo: 'avaliacoes',
    descricao: 'Nova avaliação criada: Villa Jardins Lote 7 — NBR 14653',
    ip: '189.77.34.198',
    dispositivo: 'Safari · iPhone 15',
    severidade: 'success',
    timestamp: '2026-02-18T10:22:44',
    entidade_id: 'aval_0153',
  },
  {
    id: 7,
    usuario: 'Sistema',
    email: 'sistema@imiatlantica.com.br',
    acao: 'sync',
    modulo: 'integracoes',
    descricao: 'Sync automático Meta Ads — 847 eventos importados',
    ip: '10.0.0.1',
    dispositivo: 'Cron Job · Servidor',
    severidade: 'info',
    timestamp: '2026-02-19T06:00:00',
  },
  {
    id: 8,
    usuario: 'Iule Miranda',
    email: 'iule@imiatlantica.com.br',
    acao: 'update',
    modulo: 'settings',
    descricao: 'Permissão do usuário Carlos Eduardo alterada: viewer → editor',
    ip: '187.103.45.21',
    dispositivo: 'Chrome 121 · macOS',
    severidade: 'warning',
    timestamp: '2026-02-17T09:10:33',
  },
  {
    id: 9,
    usuario: 'Carlos Eduardo Silva',
    email: 'carlos@imiatlantica.com.br',
    acao: 'view',
    modulo: 'leads',
    descricao: 'Visualizou lista completa de leads (482 registros)',
    ip: '192.168.1.45',
    dispositivo: 'Chrome 121 · Windows',
    severidade: 'info',
    timestamp: '2026-02-17T08:45:00',
  },
  {
    id: 10,
    usuario: 'Sistema',
    email: 'sistema@imiatlantica.com.br',
    acao: 'backup',
    modulo: 'sistema',
    descricao: 'Backup automático do banco de dados — 2.3GB — Supabase Storage',
    ip: '10.0.0.1',
    dispositivo: 'Cron Job · Servidor',
    severidade: 'success',
    timestamp: '2026-02-19T03:00:00',
  },
]

const ACAO_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  login: { label: 'Login', icon: LogIn, color: 'text-blue-600 bg-blue-50' },
  logout: { label: 'Logout', icon: LogOut, color: 'text-gray-600 bg-gray-100' },
  create: { label: 'Criação', icon: Plus, color: 'text-green-600 bg-green-50' },
  update: { label: 'Edição', icon: Edit, color: 'text-orange-600 bg-orange-50' },
  delete: { label: 'Exclusão', icon: Trash2, color: 'text-red-600 bg-red-50' },
  view: { label: 'Visualização', icon: Eye, color: 'text-gray-600 bg-gray-100' },
  export: { label: 'Exportação', icon: Download, color: 'text-purple-600 bg-purple-50' },
  sync: { label: 'Sync', icon: Settings, color: 'text-blue-600 bg-blue-50' },
  backup: { label: 'Backup', icon: Shield, color: 'text-green-600 bg-green-50' },
}

const SEVERIDADE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  info: { label: 'Info', color: 'bg-blue-50 text-blue-700', icon: CheckCircle },
  success: { label: 'Sucesso', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  warning: { label: 'Atenção', color: 'bg-amber-50 text-amber-700', icon: AlertTriangle },
  danger: { label: 'Crítico', color: 'bg-red-50 text-red-700', icon: AlertTriangle },
}

const MODULOS = ['todos', 'auth', 'imoveis', 'leads', 'campanhas', 'avaliacoes', 'financeiro', 'integracoes', 'settings', 'relatorios', 'sistema']

export default function AuditPage() {
  const [busca, setBusca] = useState('')
  const [moduloFiltro, setModuloFiltro] = useState('todos')
  const [severidadeFiltro, setSeveridadeFiltro] = useState<string | null>(null)

  const logsFiltrados = AUDIT_LOGS.filter(log => {
    const matchBusca =
      log.usuario.toLowerCase().includes(busca.toLowerCase()) ||
      log.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      log.modulo.toLowerCase().includes(busca.toLowerCase())
    const matchModulo = moduloFiltro === 'todos' || log.modulo === moduloFiltro
    const matchSeveridade = !severidadeFiltro || log.severidade === severidadeFiltro
    return matchBusca && matchModulo && matchSeveridade
  })

  const stats = {
    total: AUDIT_LOGS.length,
    criticos: AUDIT_LOGS.filter(l => l.severidade === 'danger').length,
    atencao: AUDIT_LOGS.filter(l => l.severidade === 'warning').length,
    usuarios: [...new Set(AUDIT_LOGS.map(l => l.usuario))].length,
  }

  const formatTimestamp = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getInitials = (nome: string) =>
    nome === 'Sistema'
      ? 'SYS'
      : nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trilha de Auditoria</h1>
          <p className="text-sm text-gray-600 mt-1">
            Registro imutável de todas as ações no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-10 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Eventos', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50', icon: Shield },
          { label: 'Críticos', value: stats.criticos, color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
          { label: 'Atenção', value: stats.atencao, color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
          { label: 'Usuários Ativos', value: stats.usuarios, color: 'text-blue-700', bg: 'bg-blue-50', icon: User },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <Icon size={14} className={s.color} />
              </div>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por usuário, ação, módulo..."
            className="w-full h-11 pl-11 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Filtro módulo */}
        <select
          value={moduloFiltro}
          onChange={e => setModuloFiltro(e.target.value)}
          className="h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#3B82F6] bg-white"
        >
          {MODULOS.map(m => (
            <option key={m} value={m}>
              {m === 'todos' ? 'Todos os módulos' : m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>

        {/* Filtro severidade */}
        <div className="flex items-center gap-2">
          {Object.entries(SEVERIDADE_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setSeveridadeFiltro(severidadeFiltro === k ? null : k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${severidadeFiltro === k
                ? `${v.color} border-current`
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de logs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Ação</div>
          <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</div>
          <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
          <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</div>
        </div>

        {/* Linhas */}
        <div className="divide-y divide-gray-50">
          {logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum evento encontrado</p>
            </div>
          ) : (
            logsFiltrados.map(log => {
              const acaoCfg = ACAO_CONFIG[log.acao] || ACAO_CONFIG['view']
              const sevCfg = SEVERIDADE_CONFIG[log.severidade]
              const AcaoIcon = acaoCfg.icon
              const SevIcon = sevCfg.icon

              return (
                <div key={log.id} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center">
                  {/* Usuário */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${log.usuario === 'Sistema' ? 'bg-gray-100 text-gray-600' : 'bg-accent-100 text-[#0F0F1E]'
                      }`}>
                      {getInitials(log.usuario)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{log.usuario}</p>
                      <p className="text-[10px] text-gray-400 truncate">{log.ip}</p>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${acaoCfg.color}`}>
                      <AcaoIcon size={12} />
                      {acaoCfg.label}
                    </span>
                  </div>

                  {/* Descrição */}
                  <div className="col-span-4">
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{log.descricao}</p>
                    {log.entidade_id && (
                      <p className="text-[10px] text-gray-400 font-mono mt-1 px-1.5 py-0.5 bg-gray-50 rounded inline-block">
                        ID: {log.entidade_id}
                      </p>
                    )}
                  </div>

                  {/* Status / Severidade */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${sevCfg.color}`}>
                      <SevIcon size={12} />
                      {sevCfg.label}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                      <Clock size={12} className="text-gray-400" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-1">{log.dispositivo}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-50 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            {logsFiltrados.length} de {AUDIT_LOGS.length} eventos registrados
          </span>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Lock size={12} />
            Logs Imutáveis — Supabase DB
          </div>
        </div>
      </div>
    </div>
  )
}
