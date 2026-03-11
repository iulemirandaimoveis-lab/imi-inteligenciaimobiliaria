'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Mail, Phone, Shield, Clock, CheckCircle, XCircle, Edit, MoreVertical,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const supabase = createClient()

export default function UsuariosPage() {
  const router = useRouter()
  const [usuariosData, setUsuariosData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false })

      if (!error && data) {
        const formatted = data.map(u => ({
          id: u.id,
          name: u.name || 'Sem nome',
          email: u.email,
          phone: u.phone || '',
          role: u.role || 'ADMIN',
          avatar: (u.name || u.email || 'U').substring(0, 2).toUpperCase(),
          status: u.active === false ? 'inativo' : 'ativo',
          ultimoAcesso: u.updatedAt || u.createdAt,
          criadoEm: u.createdAt,
        }))
        setUsuariosData(formatted)
      }
      setLoading(false)
    }
    loadUsers()
  }, [])

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
    if (r === 'ADMIN') return { bg: 'rgba(229,115,115,0.12)', color: '#E57373', border: 'rgba(229,115,115,0.2)' }
    if (r === 'GESTOR') return { bg: 'rgba(232,168,124,0.12)', color: '#E8A87C', border: 'rgba(232,168,124,0.2)' }
    if (r === 'AVALIADOR') return { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.2)' }
    if (r === 'MARKETING') return { bg: 'rgba(107,184,123,0.12)', color: '#6BB87B', border: 'rgba(107,184,123,0.2)' }
    return { bg: 'rgba(72,101,129,0.12)', color: '#8CA4B8', border: 'rgba(72,101,129,0.2)' }
  }

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '-'
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (diff < 60) return `${diff}min atrás`
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
    return `${Math.floor(diff / 1440)}d atrás`
  }

  const inputStyle: React.CSSProperties = {
    background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
    height: '44px', borderRadius: '12px', padding: '0 12px', fontSize: '13px', outline: 'none',
  }

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, color: T.text },
    { label: 'Ativos', value: stats.ativos, color: '#6BB87B' },
    { label: 'Admin', value: stats.porRole.Admin, color: '#E57373' },
    { label: 'Gestor', value: stats.porRole.Gestor, color: '#E8A87C' },
    { label: 'Corretor', value: stats.porRole.Corretor, color: '#8CA4B8' },
    { label: 'Avaliador', value: stats.porRole.Avaliador, color: '#A78BFA' },
    { label: 'Marketing', value: stats.porRole.Marketing, color: '#6BB87B' },
  ]

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
            className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--bo-accent)', color: 'white' }}
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: T.elevated, border: `1px solid ${T.border}`, height: 80 }}>
              <div className="h-2.5 rounded mb-3" style={{ background: 'var(--bo-hover)', width: '50%' }} />
              <div className="h-7 rounded" style={{ background: 'var(--bo-hover)', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAT_CARDS.map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: T.textMuted }} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="all" style={{ background: 'var(--bo-elevated)' }}>Todas as roles</option>
                <option value="ADMIN" style={{ background: 'var(--bo-elevated)' }}>Admin</option>
                <option value="GESTOR" style={{ background: 'var(--bo-elevated)' }}>Gestor</option>
                <option value="CORRETOR" style={{ background: 'var(--bo-elevated)' }}>Corretor</option>
                <option value="AVALIADOR" style={{ background: 'var(--bo-elevated)' }}>Avaliador</option>
                <option value="MARKETING" style={{ background: 'var(--bo-elevated)' }}>Marketing</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="all" style={{ background: 'var(--bo-elevated)' }}>Todos os status</option>
                <option value="ativo" style={{ background: 'var(--bo-elevated)' }}>Ativo</option>
                <option value="inativo" style={{ background: 'var(--bo-elevated)' }}>Inativo</option>
              </select>
            </div>
          </div>

          {/* Lista */}
          <div className="rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
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
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: 'rgba(51,78,104,0.4)', color: '#8CA4B8' }}
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
                            {user.status === 'ativo'
                              ? <CheckCircle size={14} style={{ color: '#6BB87B' }} />
                              : <XCircle size={14} style={{ color: T.textMuted }} />
                            }
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
                          <button
                            onClick={() => router.push(`/backoffice/settings/usuarios/${user.id}`)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: 'transparent', border: `1px solid ${T.border}` }}
                          >
                            <Edit size={14} style={{ color: T.textMuted }} />
                          </button>
                          <button
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: 'transparent', border: `1px solid ${T.border}` }}
                          >
                            <MoreVertical size={14} style={{ color: T.textMuted }} />
                          </button>
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
    </div>
  )
}
