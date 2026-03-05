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

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  hover: 'var(--bo-hover)',
  accent: 'var(--bo-accent)',
}

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
  login: { label: 'Login', icon: LogIn, color: 'text-blue-400 bg-blue-500/10' },
  logout: { label: 'Logout', icon: LogOut, color: 'text-gray-400 bg-gray-500/10' },
  create: { label: 'Criação', icon: Plus, color: 'text-green-400 bg-green-500/10' },
  update: { label: 'Edição', icon: Edit, color: 'text-orange-400 bg-orange-500/10' },
  delete: { label: 'Exclusão', icon: Trash2, color: 'text-red-400 bg-red-500/10' },
  view: { label: 'Visualização', icon: Eye, color: 'text-gray-400 bg-gray-500/10' },
  export: { label: 'Exportação', icon: Download, color: 'text-purple-400 bg-purple-500/10' },
  sync: { label: 'Sync', icon: Settings, color: 'text-blue-400 bg-blue-500/10' },
  backup: { label: 'Backup', icon: Shield, color: 'text-green-400 bg-green-500/10' },
}

const SEVERIDADE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  info: { label: 'Info', color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  success: { label: 'Sucesso', color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  warning: { label: 'Atenção', color: 'bg-amber-500/10 text-amber-400', icon: AlertTriangle },
  danger: { label: 'Crítico', color: 'bg-red-500/10 text-red-400', icon: AlertTriangle },
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
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Trilha de Auditoria</h1>
          <p className="text-sm mt-1" style={{ color: T.textMuted }}>
            Registro imutável de todas as ações no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors"
            style={{ background: T.elevated, color: T.text, border: `1px solid ${T.border}` }}>
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Eventos', value: stats.total, textColor: T.text, bg: T.elevated, icon: Shield },
          { label: 'Críticos', value: stats.criticos, textColor: '#F87171', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle },
          { label: 'Atenção', value: stats.atencao, textColor: '#FCD34D', bg: 'rgba(245,158,11,0.08)', icon: AlertTriangle },
          { label: 'Usuários Ativos', value: stats.usuarios, textColor: '#60A5FA', bg: 'rgba(59,130,246,0.08)', icon: User },
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

      {/* Barra de busca e filtros */}
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

        {/* Filtro módulo */}
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

        {/* Filtro severidade */}
        <div className="flex items-center gap-2">
          {Object.entries(SEVERIDADE_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setSeveridadeFiltro(severidadeFiltro === k ? null : k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${severidadeFiltro === k
                ? `${v.color} border-current`
                : ''
                }`}
              style={severidadeFiltro !== k ? { background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de logs */}
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
          {logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto mb-3" style={{ color: T.textMuted, opacity: 0.3 }} />
              <p className="font-medium" style={{ color: T.textMuted }}>Nenhum evento encontrado</p>
            </div>
          ) : (
            logsFiltrados.map((log, index) => {
              const acaoCfg = ACAO_CONFIG[log.acao] || ACAO_CONFIG['view']
              const sevCfg = SEVERIDADE_CONFIG[log.severidade]
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-transparent ${acaoCfg.color}`}>
                      <AcaoIcon size={12} />
                      {acaoCfg.label}
                    </span>
                  </div>

                  {/* Descrição */}
                  <div className="col-span-4">
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{log.descricao}</p>
                    {(log as any).entidade_id && (
                      <p className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded inline-block"
                        style={{ background: T.elevated, color: T.textMuted }}>
                        ID: {(log as any).entidade_id}
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
            {logsFiltrados.length} de {AUDIT_LOGS.length} eventos registrados
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
