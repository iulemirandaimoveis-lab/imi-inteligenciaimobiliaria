'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Mail, Phone, Shield, Clock, CheckCircle, XCircle, Edit, MoreVertical,
  X, Loader2, UserX, KeyRound, Lock, UserCheck, Trash2,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs, StatusBadge } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'
import { toast } from 'sonner'
interface UserRow {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatar: string
  status: string
  ultimoAcesso: string
  criadoEm: string
}
interface EditModal {
  open: boolean
  user: UserRow | null
  name: string
  role: string
  saving: boolean
}
interface DeactivateModal {
  open: boolean
  user: UserRow | null
  saving: boolean
}
interface CredentialsModal {
  open: boolean
  user: UserRow | null
  tempPassword: string
  loading: boolean
}
export default function UsuariosPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [usuariosData, setUsuariosData] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  // Role guard — only ADMIN can access this page
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/backoffice/hoje'); return }
      supabase.from('profiles').select('role').eq('id', data.user.id).single()
        .then(({ data: profile }) => {
          const role = profile?.role?.toUpperCase() || ''
          const allowed = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role)
          setIsAdmin(allowed)
          if (!allowed) router.replace('/backoffice/settings')
        })
    })
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editModal, setEditModal] = useState<EditModal>({
    open: false, user: null, name: '', role: '', saving: false,
  })
  const [deactivateModal, setDeactivateModal] = useState<DeactivateModal>({
    open: false, user: null, saving: false,
  })
  const [reactivateModal, setReactivateModal] = useState<DeactivateModal>({
    open: false, user: null, saving: false,
  })
  const [deleteModal, setDeleteModal] = useState<DeactivateModal>({
    open: false, user: null, saving: false,
  })
  const [credentialsModal, setCredentialsModal] = useState<CredentialsModal>({
    open: false, user: null, tempPassword: '', loading: false,
  })
  async function loadUsers() {
    try {
      const res = await fetch('/api/backoffice/users')
      if (res.ok) {
        const json = await res.json()
        const users = json.users || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = users.map((u: any) => ({
          id: u.id,
          name: u.name || 'Sem nome',
          email: u.email,
          phone: u.phone || '',
          role: (u.role || 'ADMIN').toUpperCase(),
          avatar: (u.name || u.email || 'U').substring(0, 2).toUpperCase(),
          status: u.is_active === false || u.active === false ? 'inativo' : 'ativo',
          ultimoAcesso: u.updated_at || u.updatedAt || u.created_at || u.createdAt,
          criadoEm: u.created_at || u.createdAt,
        }))
        setUsuariosData(formatted)
      } else {
        const supabase = createClient()
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setUsuariosData(data.map((u: any) => ({
            id: u.id, name: u.name || 'Sem nome', email: u.email, phone: u.phone || '',
            role: (u.role || 'ADMIN').toUpperCase(),
            avatar: (u.name || u.email || 'U').substring(0, 2).toUpperCase(),
            status: u.active === false ? 'inativo' : 'ativo',
            ultimoAcesso: u.updatedAt || u.createdAt, criadoEm: u.createdAt,
          })))
        }
      }
    } catch (err) {
      console.error('[Usuarios] Failed to load users:', err)
      toast.error('Erro ao carregar usuários. Tente novamente.')
    }
    setLoading(false)
  }
  useEffect(() => { loadUsers() }, [])
  // ── Edit handlers ─────────────────────────────────────────────
  function openEdit(user: UserRow) {
    setEditModal({ open: true, user, name: user.name, role: user.role, saving: false })
  }
  async function handleSaveEdit() {
    if (!editModal.user) return
    setEditModal(m => ({ ...m, saving: true }))
    try {
      const res = await fetch('/api/backoffice/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editModal.user.id, name: editModal.name, role: editModal.role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      toast.success('Usuário atualizado com sucesso')
      setEditModal({ open: false, user: null, name: '', role: '', saving: false })
      setLoading(true)
      await loadUsers()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : 'Erro desconhecido'))
      setEditModal(m => ({ ...m, saving: false }))
    }
  }
  // ── Deactivate handlers ────────────────────────────────────────
  function openDeactivate(user: UserRow) {
    setDeactivateModal({ open: true, user, saving: false })
  }
  async function handleDeactivate() {
    if (!deactivateModal.user) return
    setDeactivateModal(m => ({ ...m, saving: true }))
    try {
      const res = await fetch(`/api/backoffice/users?id=${deactivateModal.user.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao desativar')
      toast.success(`Usuário "${deactivateModal.user.name}" desativado`)
      setDeactivateModal({ open: false, user: null, saving: false })
      setLoading(true)
      await loadUsers()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : 'Erro desconhecido'))
      setDeactivateModal(m => ({ ...m, saving: false }))
    }
  }
  // ── Reactivate handlers ────────────────────────────────────────
  function openReactivate(user: UserRow) {
    setReactivateModal({ open: true, user, saving: false })
  }
  async function handleReactivate() {
    if (!reactivateModal.user) return
    setReactivateModal(m => ({ ...m, saving: true }))
    try {
      const res = await fetch('/api/backoffice/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reactivateModal.user.id, is_active: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao reativar')
      toast.success(`Usuário "${reactivateModal.user.name}" reativado com sucesso`)
      setReactivateModal({ open: false, user: null, saving: false })
      setLoading(true)
      await loadUsers()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : 'Erro desconhecido'))
      setReactivateModal(m => ({ ...m, saving: false }))
    }
  }
  // ── Permanent delete handlers ──────────────────────────────────
  function openDelete(user: UserRow) {
    setDeleteModal({ open: true, user, saving: false })
  }
  async function handleDelete() {
    if (!deleteModal.user) return
    setDeleteModal(m => ({ ...m, saving: true }))
    try {
      const res = await fetch(`/api/backoffice/users?id=${deleteModal.user.id}&permanent=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir')
      toast.success(`Usuário "${deleteModal.user.name}" excluído permanentemente`)
      setDeleteModal({ open: false, user: null, saving: false })
      setLoading(true)
      await loadUsers()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : 'Erro desconhecido'))
      setDeleteModal(m => ({ ...m, saving: false }))
    }
  }
  // ── Reset Access (gera senha temporária e exibe credenciais) ──
  async function handleResetAccess(user: UserRow) {
    setCredentialsModal({ open: false, user, tempPassword: '', loading: true })
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao resetar acesso')
      setCredentialsModal({ open: true, user, tempPassword: json.temp_password, loading: false })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao resetar acesso')
      setCredentialsModal({ open: false, user: null, tempPassword: '', loading: false })
    }
  }
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`))
  }
  const filteredUsuarios = usuariosData.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const currentRole = user.role?.toUpperCase() || ''
    const filterRole = roleFilter.toUpperCase()
    const matchesRole = roleFilter === 'all' || currentRole === filterRole
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })
  const stats = {
    total: usuariosData.length,
    ativos: usuariosData.filter(u => u.status === 'ativo').length,
    inativos: usuariosData.filter(u => u.status === 'inativo').length,
    porRole: {
      Admin: usuariosData.filter(u => u.role?.toUpperCase() === 'ADMIN').length,
      Gestor: usuariosData.filter(u => u.role?.toUpperCase() === 'GESTOR').length,
      Corretor: usuariosData.filter(u => ['CORRETOR', 'EDITOR'].includes(u.role?.toUpperCase())).length,
      Avaliador: usuariosData.filter(u => u.role?.toUpperCase() === 'AVALIADOR').length,
      Marketing: usuariosData.filter(u => u.role?.toUpperCase() === 'MARKETING').length,
    },
  }
  const getRoleBadge = (role: string) => {
    const r = role?.toUpperCase()
    if (r === 'ADMIN') return { bg: 'rgba(229,115,115,0.12)', color: 'var(--error)', border: 'rgba(229,115,115,0.2)' }
    if (r === 'GESTOR') return { bg: 'rgba(232,168,124,0.12)', color: 'var(--warning)', border: 'rgba(232,168,124,0.2)' }
    if (r === 'AVALIADOR') return { bg: 'rgba(167,139,250,0.12)', color: 'var(--platinum-400)', border: 'rgba(167,139,250,0.2)' }
    if (r === 'MARKETING') return { bg: 'rgba(107,184,123,0.12)', color: 'var(--success)', border: 'rgba(107,184,123,0.2)' }
    return { bg: 'rgba(72,101,129,0.12)', color: 'var(--text-secondary)', border: 'rgba(72,101,129,0.2)' }
  }
  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Nunca'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Nunca'
    const diff = Math.floor((Date.now() - date.getTime()) / 60000)
    if (diff < 0) return 'Agora'
    if (diff < 60) return `${diff}min atrás`
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
    return `${Math.floor(diff / 1440)}d atrás`
  }
  const inputStyle: React.CSSProperties = {
    background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
    height: '44px', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none',
  }

  if (isAdmin === null) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} />
    </div>
  )
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Lock size={40} style={{ color: T.textMuted }} />
      <p style={{ color: T.textMuted, fontSize: 15 }}>Acesso restrito a administradores.</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="GESTÃO DE ACESSO"
        title="Usuários"
        subtitle="Gerencie usuários, roles e permissões de acesso ao sistema"
        actions={
          <button
            onClick={() => router.push('/backoffice/settings/usuarios/novo')}
            className="flex items-center gap-2 h-11 px-5 rounded-[6px] font-semibold text-sm transition-all"
            style={{ background: 'var(--btn-primary-bg)', color: 'white' }}
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        }
      />
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <KPICard label="Total" value={loading ? '—' : String(stats.total)} icon={<Shield size={14} />} size="sm" />
        <KPICard label="Ativos" value={loading ? '—' : String(stats.ativos)} icon={<CheckCircle size={14} />} accent="green" size="sm" />
        <KPICard label="Inativos" value={loading ? '—' : String(stats.inativos)} icon={<XCircle size={14} />} size="sm" />
        <KPICard label="Admins" value={loading ? '—' : String(stats.porRole.Admin)} icon={<Shield size={14} />} accent="hot" size="sm" />
      </div>
      {/* Filtros */}
      <div className="rounded-lg p-4 space-y-3" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: T.textMuted }} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-[6px] text-sm outline-none"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterTabs
            tabs={[
              { id: 'all',     label: 'Todos',    count: usuariosData.length },
              { id: 'ativo',   label: 'Ativos',   count: stats.ativos,   dotColor: getStatusConfig('ativo').dot },
              { id: 'inativo', label: 'Inativos', count: stats.inativos, dotColor: getStatusConfig('inativo').dot },
            ] as FilterTab[]}
            active={statusFilter}
            onChange={setStatusFilter}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-[6px] text-xs font-semibold outline-none"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
          >
            <option value="all">Todas as roles</option>
            <option value="ADMIN">Admin</option>
            <option value="GESTOR">Gestor</option>
            <option value="CORRETOR">Corretor</option>
            <option value="AVALIADOR">Avaliador</option>
            <option value="MARKETING">Marketing</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg h-16" style={{ background: T.elevated }} />
          ))}
        </div>
      ) : (
        <>
          {/* Lista */}
          <div className="rounded-lg overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            {filteredUsuarios.length === 0 ? (
              <div className="py-20 text-center" style={{ color: T.textMuted }}>
                <Shield size={36} className="mx-auto mb-4" style={{ opacity: 0.25 }} />
                <p className="text-sm font-medium mb-1" style={{ color: T.text }}>Nenhum usuário encontrado</p>
                <p className="text-xs">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <div>
                {filteredUsuarios.map((user, idx) => {
                  const badge = getRoleBadge(user.role)
                  return (
                    <div
                      key={user.id}
                      className="p-5 transition-all hover:opacity-90"
                      style={{ borderBottom: idx < filteredUsuarios.length - 1 ? `1px solid ${T.border}` : 'none' }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div
                          className="rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, aspectRatio: '1/1', background: 'rgba(51,78,104,0.4)', color: 'var(--text-secondary)' }}
                        >
                          {user.avatar}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <h3 className="font-semibold text-sm" style={{ color: T.text }}>{user.name}</h3>
                            <span
                              className="px-2 py-0.5 rounded-md text-[11px] font-bold border"
                              style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                            >
                              {user.role}
                            </span>
                            <StatusBadge statusKey={user.status === 'ativo' ? 'ativo' : 'inativo'} size="xs" dot />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: T.textMuted }}>
                            <span className="flex items-center gap-1">
                              <Mail size={11} />{user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} />{user.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              Último acesso: {getTimeAgo(user.ultimoAcesso)}
                            </span>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Editar */}
                          <button
                            onClick={() => openEdit(user)}
                            title="Editar usuário"
                            className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium transition-all hover:brightness-110"
                            style={{ background: 'rgba(72,101,129,0.1)', border: `1px solid ${T.border}`, color: T.textMuted }}
                          >
                            <Edit size={13} />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          {/* Resetar Acesso */}
                          <button
                            onClick={() => handleResetAccess(user)}
                            disabled={credentialsModal.loading && credentialsModal.user?.id === user.id}
                            title="Gerar nova senha temporária"
                            className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium transition-all hover:brightness-110 disabled:opacity-60"
                            style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.25)', color: 'var(--gold, #C8A44A)' }}
                          >
                            {credentialsModal.loading && credentialsModal.user?.id === user.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <KeyRound size={13} />}
                            <span className="hidden sm:inline">Resetar Acesso</span>
                          </button>
                          {/* Ativo: Desativar | Inativo: Reativar + Excluir */}
                          {user.status === 'ativo' ? (
                            <button
                              onClick={() => openDeactivate(user)}
                              title="Desativar usuário"
                              className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium transition-all hover:brightness-110"
                              style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)', color: 'var(--error)' }}
                            >
                              <UserX size={13} />
                              <span className="hidden sm:inline">Desativar</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openReactivate(user)}
                                title="Reativar usuário"
                                className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium transition-all hover:brightness-110"
                                style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.25)', color: 'var(--success)' }}
                              >
                                <UserCheck size={13} />
                                <span className="hidden sm:inline">Reativar</span>
                              </button>
                              <button
                                onClick={() => openDelete(user)}
                                title="Excluir usuário permanentemente"
                                className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-medium transition-all hover:brightness-110"
                                style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)', color: 'var(--error)' }}
                              >
                                <Trash2 size={13} />
                                <span className="hidden sm:inline">Excluir</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
      {/* ── Edit Modal ────────────────────────────────────────────── */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-md rounded-xl p-6 space-y-5"
            style={{ background: 'var(--bg-elevated)', border: `1px solid ${T.border}` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base" style={{ color: T.text }}>Editar Usuário</h2>
              <button
                onClick={() => setEditModal({ open: false, user: null, name: '', role: '', saving: false })}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:opacity-70 transition-all"
                style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                <X size={14} />
              </button>
            </div>
            {/* Name */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>Nome</label>
              <input
                type="text"
                value={editModal.name}
                onChange={e => setEditModal(m => ({ ...m, name: e.target.value }))}
                className="w-full rounded-[6px] text-sm outline-none"
                style={{ ...inputStyle, padding: '0 14px', borderRadius: '10px' }}
              />
            </div>
            {/* Role */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>Nível de Acesso</label>
              <select
                value={editModal.role}
                onChange={e => setEditModal(m => ({ ...m, role: e.target.value }))}
                className="w-full rounded-[6px] text-sm outline-none"
                style={{ ...inputStyle, padding: '0 14px', borderRadius: '10px' }}
              >
                <option value="ADMIN">Administrador</option>
                <option value="GESTOR">Gestor</option>
                <option value="CORRETOR">Corretor</option>
                <option value="EDITOR">Editor</option>
                <option value="AVALIADOR">Avaliador</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditModal({ open: false, user: null, name: '', role: '', saving: false })}
                disabled={editModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: 'var(--btn-primary-bg, var(--accent-400))' }}
              >
                {editModal.saving && <Loader2 size={14} className="animate-spin" />}
                {editModal.saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Credentials Modal ─────────────────────────────────────── */}
      {credentialsModal.open && credentialsModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-elevated)', border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.25)' }}>
                  <KeyRound size={16} style={{ color: 'var(--gold, #C8A44A)' }} />
                </div>
                <h2 className="font-semibold text-sm" style={{ color: T.text }}>Credenciais de Acesso</h2>
              </div>
              <button onClick={() => setCredentialsModal({ open: false, user: null, tempPassword: '', loading: false })} className="w-7 h-7 flex items-center justify-center rounded hover:opacity-70" style={{ color: T.textMuted }}>
                <X size={14} />
              </button>
            </div>
            <p className="text-xs" style={{ color: T.textMuted }}>
              Compartilhe estas credenciais com <strong style={{ color: T.text }}>{credentialsModal.user.name}</strong> de forma segura (WhatsApp, presencial).
            </p>
            {/* Email */}
            <div className="rounded-lg p-3 space-y-1" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>E-mail</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono" style={{ color: T.text }}>{credentialsModal.user.email}</span>
                <button onClick={() => copyToClipboard(credentialsModal.user!.email, 'E-mail')} className="shrink-0 text-xs px-2 py-1 rounded" style={{ background: 'rgba(72,101,129,0.2)', color: T.textMuted }}>Copiar</button>
              </div>
            </div>
            {/* Senha */}
            <div className="rounded-lg p-3 space-y-1" style={{ background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--gold, #C8A44A)' }}>Senha Provisória</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-mono font-bold tracking-widest" style={{ color: T.text }}>{credentialsModal.tempPassword}</span>
                <button onClick={() => copyToClipboard(credentialsModal.tempPassword, 'Senha')} className="shrink-0 text-xs px-2 py-1 rounded" style={{ background: 'rgba(200,164,74,0.15)', color: 'var(--gold, #C8A44A)' }}>Copiar</button>
              </div>
            </div>
            {/* Link */}
            <div className="rounded-lg p-3 space-y-1" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Link de Primeiro Acesso</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate" style={{ color: T.textMuted }}>/login/primeiro-acesso</span>
                <button onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/login/primeiro-acesso`, 'Link')} className="shrink-0 text-xs px-2 py-1 rounded" style={{ background: 'rgba(72,101,129,0.2)', color: T.textMuted }}>Copiar</button>
              </div>
            </div>
            <button
              onClick={() => {
                const text = `Acesso IMI\nEmail: ${credentialsModal.user!.email}\nSenha: ${credentialsModal.tempPassword}\nLink: ${typeof window !== 'undefined' ? window.location.origin : ''}/login/primeiro-acesso`
                copyToClipboard(text, 'Todas as credenciais')
              }}
              className="w-full h-10 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: 'rgba(200,164,74,0.12)', border: '1px solid rgba(200,164,74,0.3)', color: 'var(--gold, #C8A44A)' }}
            >
              Copiar Tudo
            </button>
          </div>
        </div>
      )}
      {/* ── Deactivate Confirmation Modal ─────────────────────────── */}
      {deactivateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-5"
            style={{ background: 'var(--bg-elevated)', border: `1px solid ${T.border}` }}
          >
            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(229,115,115,0.12)', border: '1px solid rgba(229,115,115,0.25)' }}
              >
                <UserX size={22} style={{ color: 'var(--error)' }} />
              </div>
              <div>
                <h2 className="font-semibold text-base" style={{ color: T.text }}>Desativar Usuário</h2>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                  Tem certeza que deseja desativar <strong style={{ color: T.text }}>{deactivateModal.user?.name}</strong>?
                  O acesso ao sistema será revogado.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateModal({ open: false, user: null, saving: false })}
                disabled={deactivateModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: '#e57373' }}
              >
                {deactivateModal.saving && <Loader2 size={14} className="animate-spin" />}
                {deactivateModal.saving ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Reactivate Confirmation Modal ─────────────────────────── */}
      {reactivateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-5"
            style={{ background: 'var(--bg-elevated)', border: `1px solid ${T.border}` }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(107,184,123,0.12)', border: '1px solid rgba(107,184,123,0.25)' }}
              >
                <UserCheck size={22} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <h2 className="font-semibold text-base" style={{ color: T.text }}>Reativar Usuário</h2>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                  Tem certeza que deseja reativar <strong style={{ color: T.text }}>{reactivateModal.user?.name}</strong>?
                  O acesso ao sistema será restaurado.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReactivateModal({ open: false, user: null, saving: false })}
                disabled={reactivateModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReactivate}
                disabled={reactivateModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: 'var(--success, #6bb87b)' }}
              >
                {reactivateModal.saving && <Loader2 size={14} className="animate-spin" />}
                {reactivateModal.saving ? 'Reativando...' : 'Reativar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Permanent Delete Confirmation Modal ───────────────────── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-5"
            style={{ background: 'var(--bg-elevated)', border: `1px solid ${T.border}` }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(229,115,115,0.12)', border: '1px solid rgba(229,115,115,0.25)' }}
              >
                <Trash2 size={22} style={{ color: 'var(--error)' }} />
              </div>
              <div>
                <h2 className="font-semibold text-base" style={{ color: T.text }}>Excluir Usuário</h2>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                  Esta ação é <strong style={{ color: 'var(--error)' }}>irreversível</strong>. O usuário{' '}
                  <strong style={{ color: T.text }}>{deleteModal.user?.name}</strong> será removido permanentemente do sistema.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, user: null, saving: false })}
                disabled={deleteModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteModal.saving}
                className="flex-1 h-11 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: '#e57373' }}
              >
                {deleteModal.saving && <Loader2 size={14} className="animate-spin" />}
                {deleteModal.saving ? 'Excluindo...' : 'Excluir Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
