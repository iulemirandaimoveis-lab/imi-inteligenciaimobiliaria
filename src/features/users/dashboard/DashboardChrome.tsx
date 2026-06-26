'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Building2, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { tokens as T } from '../ui/tokens'
import { StatusDot } from '../ui/primitives'
import { ROLE_LABELS } from '@/lib/imi-auth/rbac'
import { useImiSession } from '../session-context'

export function DashboardTopbar({ projectName }: { projectName: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { session } = useImiSession()
  const [loggingOut, setLoggingOut] = useState(false)

  const primaryRole = session.roleKeys[0]
  const roleLabel = session.user.isSuper ? 'Super Administrador' : primaryRole ? ROLE_LABELS[primaryRole] : 'Membro'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      router.push('/users/login')
      router.refresh()
    }
  }

  const initials = session.user.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 24px',
        background: 'rgba(7,12,20,0.72)',
        borderBottom: `1px solid ${T.glassBorder}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Brand + project switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 17, color: T.t1, letterSpacing: '0.14em' }}>
            IMI
          </span>
          <span style={{ width: 1, height: 18, background: T.goldBorder }} />
        </div>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 12px',
            borderRadius: T.rSm,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${T.glassBorder}`,
            color: T.t1,
            cursor: 'pointer',
            minWidth: 0,
          }}
          title="Trocar empreendimento"
        >
          <Building2 size={15} color={T.gold} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontFamily: T.fSans,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {projectName}
          </span>
          <ChevronDown size={14} color={T.t3} style={{ flexShrink: 0 }} />
        </button>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          aria-label="Notificações"
          style={{
            display: 'inline-flex',
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: T.rSm,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${T.glassBorder}`,
            color: T.t2,
            cursor: 'pointer',
          }}
        >
          <Bell size={15} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: T.goldSoft,
              border: `1px solid ${T.goldBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: T.fSans,
              fontSize: 12,
              fontWeight: 700,
              color: T.gold,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="imi-user-meta" style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: T.fSans,
                fontSize: 12.5,
                fontWeight: 600,
                color: T.t1,
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {session.user.fullName}
            </p>
            <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.gold, margin: 0, letterSpacing: '0.04em' }}>
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          disabled={loggingOut}
          style={{
            display: 'inline-flex',
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: T.rSm,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${T.glassBorder}`,
            color: T.t2,
            cursor: loggingOut ? 'wait' : 'pointer',
          }}
        >
          <LogOut size={15} />
        </button>
      </div>

      <style>{`@media (max-width: 640px){ .imi-user-meta{ display:none; } }`}</style>
    </header>
  )
}

export function LiveBadge({ live }: { live: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <StatusDot color={live ? T.green : T.amber} pulse={live} />
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3 }}>
        {live ? 'Dados ao vivo' : 'Pré-visualização · aguardando seed'}
      </span>
    </div>
  )
}
