'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus, KeyRound, Copy, Check, ShieldCheck, Trash2, AlertCircle, Power, X, Plus,
} from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Button, Spinner } from '../ui/primitives'
import { ROLES, ROLE_LABELS, type RoleKey } from '@/lib/imi-auth/rbac'
import type { AdminUserRow } from './data'

const ALL_ROLES: RoleKey[] = [ROLES.SUPER_ADMIN, ROLES.BACKOFFICE_ADMIN, ROLES.TEAM_MANAGER, ROLES.PROJECT_OWNER, ROLES.BROKER]
const STATUS_LABEL: Record<string, string> = { active: 'Ativo', invited: 'Aguardando 1º acesso', suspended: 'Suspenso', archived: 'Arquivado' }
const STATUS_TONE: Record<string, string> = { active: T.green, invited: T.amber, suspended: T.red, archived: T.t4 }

interface ProjectOption { id: string; name: string }

export function AdminView({
  users,
  projects,
  canManageUsers,
  canManageRoles,
  isSuper,
}: {
  users: AdminUserRow[]
  projects: ProjectOption[]
  canManageUsers: boolean
  canManageRoles: boolean
  isSuper: boolean
}) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Master · Acessos & Permissões</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 30, color: T.t1, margin: '8px 0 4px' }}>
            Gestão de Usuários
          </h1>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
            Crie usuários, atribua múltiplos papéis e gerencie o acesso ao ecossistema IMI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isSuper && <MockCleanupButton />}
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', borderRadius: T.rMd, background: showCreate ? 'rgba(255,255,255,0.05)' : T.gold, color: showCreate ? T.t1 : '#1A1206', fontFamily: T.fSans, fontSize: 13, fontWeight: 600, border: showCreate ? `1px solid ${T.glassBorderStrong}` : 'none', cursor: 'pointer' }}
            >
              {showCreate ? <X size={16} /> : <UserPlus size={16} />} {showCreate ? 'Fechar' : 'Novo usuário'}
            </button>
          )}
        </div>
      </div>

      {showCreate && canManageUsers && (
        <CreateUserForm projects={projects} isSuper={isSuper} onClose={() => setShowCreate(false)} />
      )}

      <GlassCard padding={8}>
        {users.map((u, i) => (
          <UserRow
            key={u.id}
            user={u}
            projects={projects}
            canManageUsers={canManageUsers}
            canManageRoles={canManageRoles}
            isSuper={isSuper}
            last={i === users.length - 1}
          />
        ))}
        {users.length === 0 && (
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, padding: 24, textAlign: 'center' }}>
            Nenhum usuário visível.
          </p>
        )}
      </GlassCard>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.t3, marginTop: 16 }}>
        <ShieldCheck size={14} color={T.gold} />
        <span style={{ fontFamily: T.fSans, fontSize: 11 }}>Papéis e acessos reforçados por RLS no schema imi</span>
      </div>
    </div>
  )
}

function UserRow({
  user,
  projects,
  canManageUsers,
  canManageRoles,
  isSuper,
  last,
}: {
  user: AdminUserRow
  projects: ProjectOption[]
  canManageUsers: boolean
  canManageRoles: boolean
  isSuper: boolean
  last: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [provisional, setProvisional] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const initials = user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const effectiveRoles = user.isSuper ? Array.from(new Set([ROLES.SUPER_ADMIN, ...user.roleKeys])) : user.roleKeys

  async function toggleRole(roleKey: RoleKey, has: boolean) {
    setError('')
    setBusy(`role:${roleKey}`)
    try {
      const res = await fetch(`/api/users/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: has ? 'remove_role' : 'add_role', role_key: roleKey }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) setError(json.error ?? 'Falha ao alterar papel.')
      else router.refresh()
    } catch {
      setError('Erro técnico.')
    } finally {
      setBusy(null)
    }
  }

  async function setStatus(status: string) {
    setError('')
    setBusy(`status:${status}`)
    try {
      const res = await fetch(`/api/users/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', status }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) setError(json.error ?? 'Falha ao alterar status.')
      else router.refresh()
    } catch {
      setError('Erro técnico.')
    } finally {
      setBusy(null)
    }
  }

  async function resetPassword() {
    setError('')
    setBusy('reset')
    try {
      const res = await fetch('/api/users/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: user.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) setError(json.error ?? 'Falha ao redefinir.')
      else setProvisional(json.provisional_password)
    } catch {
      setError('Erro técnico.')
    } finally {
      setBusy(null)
    }
  }

  const suspended = user.status === 'suspended' || user.status === 'archived'

  return (
    <div style={{ padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${T.glassBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: T.t2, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1, margin: 0 }}>
            {user.fullName}
            {user.isSuper && <span style={{ fontFamily: T.fSans, fontSize: 9.5, color: T.gold, border: `1px solid ${T.goldBorder}`, borderRadius: 4, padding: '1px 5px', marginLeft: 8 }}>MASTER</span>}
          </p>
          <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
        </div>
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: STATUS_TONE[user.status] ?? T.t2 }}>{STATUS_LABEL[user.status] ?? user.status}</span>
        {canManageUsers && !user.isSuper && (
          <div style={{ display: 'flex', gap: 6 }}>
            <IconBtn title={suspended ? 'Reativar' : 'Suspender'} onClick={() => setStatus(suspended ? 'active' : 'suspended')} busy={busy?.startsWith('status')} tone={suspended ? T.green : T.amber}>
              <Power size={14} />
            </IconBtn>
            <IconBtn title="Resetar acesso" onClick={resetPassword} busy={busy === 'reset'}>
              <KeyRound size={14} />
            </IconBtn>
          </div>
        )}
      </div>

      {/* Multi-role chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingLeft: 50 }}>
        {ALL_ROLES.map((roleKey) => {
          const has = effectiveRoles.includes(roleKey)
          const locked = !canManageRoles || (user.isSuper && roleKey === ROLES.SUPER_ADMIN) || (roleKey === ROLES.SUPER_ADMIN && !isSuper)
          return (
            <button
              key={roleKey}
              type="button"
              disabled={locked || busy === `role:${roleKey}`}
              onClick={() => toggleRole(roleKey, has)}
              title={locked ? 'Bloqueado' : has ? 'Remover papel' : 'Atribuir papel'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99,
                fontFamily: T.fSans, fontSize: 11, fontWeight: 600,
                cursor: locked ? 'default' : 'pointer',
                color: has ? '#1A1206' : T.t3,
                background: has ? T.gold : 'rgba(255,255,255,0.03)',
                border: `1px solid ${has ? T.goldBorder : T.glassBorder}`,
                opacity: locked && !has ? 0.5 : 1,
              }}
            >
              {busy === `role:${roleKey}` ? <Spinner size={10} color={has ? '#1A1206' : T.t3} /> : has ? <Check size={11} /> : <Plus size={11} />}
              {ROLE_LABELS[roleKey]}
            </button>
          )
        })}
      </div>

      {user.projects.length > 0 && (
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '8px 0 0', paddingLeft: 50 }}>
          {user.projects.map((p) => p.name).join(' · ')}
        </p>
      )}

      {provisional && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: T.rSm, background: T.greenSoft, border: `1px solid ${T.greenBorder}`, marginTop: 10, marginLeft: 50 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3 }}>Senha provisória:</span>
          <code style={{ fontFamily: T.fMono, fontSize: 12, color: T.t1 }}>{provisional}</code>
          <button type="button" aria-label="Copiar" onClick={() => { navigator.clipboard?.writeText(provisional); setCopied(true); setTimeout(() => setCopied(false), 1500) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.green, display: 'flex', padding: 2 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
      {error && <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.red, margin: '8px 0 0', paddingLeft: 50 }}>{error}</p>}
    </div>
  )
}

function IconBtn({ title, onClick, busy, tone = T.t2, children }: { title: string; onClick: () => void; busy?: boolean; tone?: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={busy} style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: T.rSm, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, color: tone, cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? <Spinner size={13} color={tone} /> : children}
    </button>
  )
}

function MockCleanupButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function run() {
    if (!confirm('Remover TODOS os dados mockados (mock=true)? Esta ação não pode ser desfeita.')) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/users/admin/cleanup', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        const total = Object.values(json.removed ?? {}).reduce((a: number, b: any) => a + Number(b), 0)
        setMsg(`${total} removido(s)`)
        router.refresh()
      } else setMsg(json.error ?? 'Falha')
    } catch {
      setMsg('Erro')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <button type="button" onClick={run} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px', borderRadius: T.rMd, background: T.redSoft, color: T.red, border: `1px solid ${T.redBorder}`, fontFamily: T.fSans, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? <Spinner size={14} color={T.red} /> : <Trash2 size={15} />} Limpar mock
      </button>
      {msg && <span style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t3, marginTop: 4 }}>{msg}</span>}
    </div>
  )
}

function CreateUserForm({ projects, isSuper, onClose }: { projects: ProjectOption[]; isSuper: boolean; onClose: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [roleKeys, setRoleKeys] = useState<RoleKey[]>([ROLES.BROKER])
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [provisional, setProvisional] = useState<string | null>(null)

  const selectable = isSuper ? ALL_ROLES : ALL_ROLES.filter((r) => r !== ROLES.SUPER_ADMIN)

  function toggle(r: RoleKey) {
    setRoleKeys((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  async function submit() {
    setError('')
    if (!email || !fullName) return setError('Informe nome e e-mail.')
    if (roleKeys.length === 0) return setError('Selecione ao menos um papel.')
    setBusy(true)
    try {
      const res = await fetch('/api/users/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role_keys: roleKeys, project_id: projectId || null }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Falha ao criar usuário.')
        setBusy(false)
        return
      }
      setProvisional(json.provisional_password)
      setBusy(false)
      router.refresh()
    } catch {
      setError('Erro técnico.')
      setBusy(false)
    }
  }

  const field = { height: 42, padding: '0 12px', borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, color: T.t1, fontFamily: T.fSans, fontSize: 13.5, outline: 'none', width: '100%', colorScheme: 'dark' as const }

  if (provisional) {
    return (
      <GlassCard style={{ marginBottom: 22, border: `1px solid ${T.greenBorder}` }}>
        <Eyebrow style={{ color: T.green, marginBottom: 10 }}>Usuário criado</Eyebrow>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t2, margin: '0 0 10px' }}>
          Compartilhe a senha provisória com segurança. O usuário define a própria senha no 1º acesso.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: T.rSm, background: T.greenSoft, border: `1px solid ${T.greenBorder}` }}>
          <code style={{ fontFamily: T.fMono, fontSize: 13, color: T.t1 }}>{provisional}</code>
        </div>
        <div style={{ maxWidth: 200, marginTop: 16 }}>
          <Button variant="secondary" onClick={onClose}>Concluir</Button>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard style={{ marginBottom: 22, border: `1px solid ${T.goldBorder}` }}>
      <Eyebrow style={{ color: T.gold, marginBottom: 14 }}>Novo usuário</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Labeled label="Nome completo"><input value={fullName} onChange={(e) => setFullName(e.target.value)} style={field} /></Labeled>
        <Labeled label="E-mail"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={field} /></Labeled>
        <Labeled label="Empreendimento">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={field}>
            <option value="" style={{ background: T.bgElevated }}>— Nenhum —</option>
            {projects.map((p) => <option key={p.id} value={p.id} style={{ background: T.bgElevated }}>{p.name}</option>)}
          </select>
        </Labeled>
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, margin: '14px 0 8px' }}>Papéis (múltiplos)</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {selectable.map((r) => {
          const has = roleKeys.includes(r)
          return (
            <button key={r} type="button" onClick={() => toggle(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, fontFamily: T.fSans, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', color: has ? '#1A1206' : T.t3, background: has ? T.gold : 'rgba(255,255,255,0.03)', border: `1px solid ${has ? T.goldBorder : T.glassBorder}` }}>
              {has ? <Check size={11} /> : <Plus size={11} />} {ROLE_LABELS[r]}
            </button>
          )
        })}
      </div>
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: T.red, fontFamily: T.fSans, fontSize: 12.5 }}><AlertCircle size={14} /> {error}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, maxWidth: 360 }}>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="primary" onClick={submit} loading={busy}>Criar usuário</Button>
      </div>
    </GlassCard>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  )
}
