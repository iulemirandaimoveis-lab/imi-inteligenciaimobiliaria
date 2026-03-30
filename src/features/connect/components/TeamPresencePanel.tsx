'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresenceContext } from './PresenceProvider'
import type { Profile, PresenceStatus } from '../types'

const DEPARTMENTS = [
  { key: 'diretoria', label: 'DIRETORIA', icon: '' },
  { key: 'comercial', label: 'COMERCIAL', icon: '' },
  { key: 'tecnologia', label: 'TECNOLOGIA', icon: '' },
  { key: 'marketing', label: 'MARKETING', icon: '' },
  { key: 'juridico', label: 'JURIDICO & OPS', icon: '' },
  { key: 'outros', label: 'EQUIPE', icon: '' },
]

const STATUS_CONFIG: Record<PresenceStatus, { label: string; color: string; bg: string; border: string }> = {
  online: { label: 'Online', color: '#4ADE80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)' },
  away: { label: 'Ausente', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
  busy: { label: 'Ocupado', color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  offline: { label: 'Offline', color: '#556170', bg: 'rgba(85,97,112,0.06)', border: 'rgba(85,97,112,0.10)' },
}

export function TeamPresencePanel() {
  const supabase = createClient()
  const { onlineUsers, isOnline, soundEnabled, toggleSound } = usePresenceContext()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('is_active', true).order('name')
      if (data) setProfiles(data)

      const { data: presenceData } = await supabase.from('user_presence').select('*')
      if (presenceData) {
        const map = new Map<string, PresenceStatus>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        presenceData.forEach((p: any) => map.set(p.user_id, p.status))
        setPresenceMap(map)
      }
      setLoading(false)
    }
    load()

    // Subscribe to realtime presence updates
    const channel = supabase
      .channel('presence-panel-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec = payload.new as any
        if (rec?.user_id && rec?.status) {
          setPresenceMap((prev) => {
            const next = new Map(prev)
            next.set(rec.user_id, rec.status as PresenceStatus)
            return next
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const getStatus = (userId: string): PresenceStatus => {
    const live = onlineUsers.get(userId)
    if (live) return live.status as PresenceStatus
    return presenceMap.get(userId) || 'offline'
  }

  const getStatusMessage = (userId: string): string => {
    const live = onlineUsers.get(userId)
    return live?.status_message || ''
  }

  const grouped = DEPARTMENTS.map((dept) => {
    const members = profiles.filter((p) => {
      const d = (p.department || 'outros').toLowerCase()
      if (dept.key === 'outros') return !DEPARTMENTS.slice(0, -1).some((dd) => d.includes(dd.key))
      return d.includes(dept.key)
    })
    return { ...dept, members }
  }).filter((g) => g.members.length > 0)

  const stats = {
    online: profiles.filter((p) => getStatus(p.id) === 'online').length,
    away: profiles.filter((p) => getStatus(p.id) === 'away').length,
    busy: profiles.filter((p) => getStatus(p.id) === 'busy').length,
    offline: profiles.filter((p) => getStatus(p.id) === 'offline').length,
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Carregando equipe...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 20, padding: '12px 24px', fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--t2)', borderBottom: '1px solid var(--bdr)' }}>
        {Object.entries(stats).map(([key, count]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[key as PresenceStatus].color, boxShadow: key === 'online' ? '0 0 8px rgba(74,222,128,0.4)' : undefined }} />
            <span>{count} {STATUS_CONFIG[key as PresenceStatus].label.toLowerCase()}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={toggleSound}
          style={{
            background: soundEnabled ? 'rgba(74,222,128,0.10)' : 'transparent',
            border: `1px solid ${soundEnabled ? 'rgba(74,222,128,0.25)' : 'var(--bdr)'}`,
            borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
            color: soundEnabled ? '#4ADE80' : 'var(--t3)', fontSize: 12, fontFamily: 'var(--fm)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {grouped.map((dept) => {
          const onlineCount = dept.members.filter((m) => getStatus(m.id) !== 'offline').length
          return (
            <div key={dept.key} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--gold)', opacity: 0.6 }} />
                <span style={{ fontFamily: 'var(--fu)', fontSize: 11, fontWeight: 600, color: 'var(--t2)', letterSpacing: '1.2px' }}>
                  {dept.icon} {dept.label}
                </span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--t3)' }}>{onlineCount}/{dept.members.length}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {dept.members
                  .sort((a, b) => {
                    const order: Record<string, number> = { online: 0, busy: 1, away: 2, offline: 3 }
                    return (order[getStatus(a.id)] ?? 3) - (order[getStatus(b.id)] ?? 3)
                  })
                  .map((member) => {
                    const status = getStatus(member.id)
                    const cfg = STATUS_CONFIG[status]
                    const msg = getStatusMessage(member.id)
                    const isOff = status === 'offline'

                    return (
                      <div key={member.id} style={{
                        background: 'var(--n800)', border: `1px solid ${status === 'online' ? cfg.border : 'var(--bdr)'}`,
                        borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
                      }}>
                        {status === 'online' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)` }} />
                        )}
                        <div style={{
                          width: 40, height: 40, borderRadius: 8,
                          background: isOff ? 'var(--n700)' : 'linear-gradient(135deg, var(--n600), var(--n500))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                          position: 'relative', border: '1px solid var(--bdr)', flexShrink: 0,
                        }}>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <span>{(member.name || '?')[0].toUpperCase()}</span>
                          )}
                          <div style={{
                            position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
                            borderRadius: '50%', background: cfg.color, border: '2px solid var(--n800)',
                            boxShadow: status === 'online' ? `0 0 6px ${cfg.color}80` : undefined,
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--fu)', fontSize: 13, fontWeight: 600, color: isOff ? 'var(--t3)' : 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                          <div style={{ fontFamily: 'var(--fu)', fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{member.job_title || member.role}</div>
                          {msg && <div style={{ fontFamily: 'var(--fu)', fontSize: 11, color: 'var(--t2)', fontStyle: 'italic', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{msg}"</div>}
                        </div>
                        <div style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '2px 6px', borderRadius: 9999, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500, color: cfg.color, background: cfg.bg }}>{cfg.label}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeamPresencePanel
