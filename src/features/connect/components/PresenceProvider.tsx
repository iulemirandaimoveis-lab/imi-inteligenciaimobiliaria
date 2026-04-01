'use client'

import React, { createContext, useContext, useCallback, useState } from 'react'
import { usePresence } from '../hooks/usePresence'
import { useSounds } from '../hooks/useSounds'
import { useChannels } from '../hooks/useChannels'
import type { PresenceState, PresenceStatus, ChannelWithDetails } from '../types'

interface PresenceContextValue {
  onlineUsers: Map<string, PresenceState>
  myStatus: PresenceStatus
  setStatus: (status: PresenceStatus, msg?: string) => Promise<void>
  isOnline: (userId: string) => boolean
  onlineCount: number
  channels: ChannelWithDetails[]
  totalUnread: number
  teamChannels: ChannelWithDetails[]
  directMessages: ChannelWithDetails[]
  dealRooms: ChannelWithDetails[]
  soundEnabled: boolean
  toggleSound: () => void
  toasts: Toast[]
}

interface Toast {
  id: string
  name: string
  status: PresenceStatus
  emoji: string
  message: string
  timestamp: Date
}

const PresenceContext = createContext<PresenceContextValue | null>(null)

export function usePresenceContext() {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresenceContext must be inside PresenceProvider')
  return ctx
}

interface ProviderProps {
  userId: string
  userName: string
  avatarUrl?: string | null
  children: React.ReactNode
}

export function PresenceProvider({ userId, userName, avatarUrl, children }: ProviderProps) {
  const { play, enabled: soundEnabled, toggle: toggleSound } = useSounds()
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [{ ...toast, id, timestamp: new Date() }, ...prev].slice(0, 5))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const presence = usePresence({
    userId,
    userName,
    avatarUrl,
    onUserOnline: useCallback(
      (user: PresenceState) => {
        play('online')
        addToast({
          name: user.name,
          status: 'online',
          emoji: '',
          message: user.status_message || 'entrou online',
        })
      },
      [play, addToast]
    ),
    onUserOffline: useCallback(
      () => { play('offline') },
      [play]
    ),
  })

  const {
    channels, totalUnread, teamChannels, directMessages, dealRooms,
  } = useChannels({ userId })

  const value: PresenceContextValue = {
    ...presence,
    channels, totalUnread, teamChannels, directMessages, dealRooms,
    soundEnabled, toggleSound, toasts,
  }

  return (
    <PresenceContext.Provider value={value}>
      {children}
      <div
        className="fixed top-[72px] right-3 md:right-6 left-3 md:left-auto flex flex-col gap-2"
        style={{
          zIndex: 9999, pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="md:min-w-[280px]" style={{
            background: 'var(--n700, #0F2035)',
            border: '1px solid var(--bdr, rgba(255,255,255,0.06))',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
            animation: 'toastIn 0.4s ease, toastOut 0.35s ease 4.2s forwards',
            pointerEvents: 'auto',
          }}>
            <div style={{
              height: 2,
              background: t.status === 'online'
                ? 'linear-gradient(90deg, #4ADE80, transparent)'
                : t.status === 'away'
                ? 'linear-gradient(90deg, #FBBF24, transparent)'
                : t.status === 'busy'
                ? 'linear-gradient(90deg, #F87171, transparent)'
                : 'linear-gradient(90deg, #556170, transparent)',
            }} />
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{t.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1, #E8E4DC)' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t2, #94A0B2)', marginTop: 2 }}>{t.message}</div>
              </div>
              <span style={{ fontFamily: 'var(--fm, monospace)', fontSize: 10, color: 'var(--t4, #3A4552)' }}>
                {t.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn { 0% { opacity: 0; transform: translateX(40px) scale(0.96); } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes toastOut { 0% { opacity: 1; transform: translateX(0); } 100% { opacity: 0; transform: translateX(60px); } }
      `}</style>
    </PresenceContext.Provider>
  )
}

export default PresenceProvider
