'use client'

import { useState } from 'react'
import { KeyRound, Copy, Check, ShieldCheck } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Button, Spinner } from '../ui/primitives'

export interface TeamMemberRow {
  userId: string
  name: string
  email: string
  status: string
  teamRole: string
  teamName: string
  roles: string[]
}

const ROLE_BADGE: Record<string, string> = {
  manager: 'Gerente',
  owner: 'Proprietário',
  member: 'Membro',
  viewer: 'Visualizador',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  invited: 'Aguardando 1º acesso',
  suspended: 'Suspenso',
  archived: 'Arquivado',
}

export function TeamAdminView({
  members,
  canManage,
  teamName,
}: {
  members: TeamMemberRow[]
  canManage: boolean
  teamName: string
}) {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 24px 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <Eyebrow style={{ color: T.gold }}>Equipe & Acessos</Eyebrow>
        <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 30, color: T.t1, margin: '8px 0 4px' }}>{teamName}</h1>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
          {canManage
            ? 'Você pode redefinir o acesso dos membros. A senha é recriada no primeiro acesso.'
            : 'Visualização da equipe. A gestão de acessos é restrita ao gestor e ao backoffice.'}
        </p>
      </div>

      <GlassCard padding={8}>
        <div role="table" style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m, i) => (
            <MemberRow key={m.userId} member={m} canManage={canManage} last={i === members.length - 1} />
          ))}
          {members.length === 0 && (
            <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, padding: 20, textAlign: 'center' }}>
              Nenhum membro encontrado.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function MemberRow({ member, canManage, last }: { member: TeamMemberRow; canManage: boolean; last: boolean }) {
  const [loading, setLoading] = useState(false)
  const [provisional, setProvisional] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function reset() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: member.userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Falha ao redefinir.')
        return
      }
      setProvisional(data.provisional_password)
    } catch {
      setError('Erro técnico.')
    } finally {
      setLoading(false)
    }
  }

  const initials = member.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${T.glassBorder}`,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: T.t2, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1, margin: 0 }}>{member.name}</p>
        <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>
      </div>

      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t2, padding: '4px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorder}` }}>
        {ROLE_BADGE[member.teamRole] ?? member.teamRole}
      </span>
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: member.status === 'active' ? T.green : T.amber }}>
        {STATUS_LABEL[member.status] ?? member.status}
      </span>

      {canManage && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 150 }}>
          {!provisional ? (
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: T.rSm, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.glassBorderStrong}`, color: T.t1, fontFamily: T.fSans, fontSize: 12, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? <Spinner size={13} /> : <KeyRound size={13} />} Resetar acesso
            </button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: T.rSm, background: T.greenSoft, border: `1px solid ${T.greenBorder}` }}>
              <code style={{ fontFamily: T.fMono, fontSize: 12, color: T.t1 }}>{provisional}</code>
              <button
                type="button"
                aria-label="Copiar senha provisória"
                onClick={() => { navigator.clipboard?.writeText(provisional); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.green, display: 'flex', padding: 2 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
          {error && <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.red }}>{error}</span>}
        </div>
      )}
    </div>
  )
}

export function TeamAccessHint() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.t3 }}>
      <ShieldCheck size={14} color={T.gold} />
      <span style={{ fontFamily: T.fSans, fontSize: 11 }}>Acesso por primeiro acesso · reset hierárquico</span>
    </div>
  )
}
