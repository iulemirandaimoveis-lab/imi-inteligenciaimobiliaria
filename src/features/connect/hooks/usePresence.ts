'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { PresenceStatus, PresenceState } from '../types'

const PRESENCE_CHANNEL = 'imi-presence'
const AWAY_TIMEOUT = 5 * 60 * 1000
const OFFLINE_TIMEOUT = 15 * 60 * 1000

interface UsePresenceOptions {
  userId: string
  userName: string
  avatarUrl?: string | null
  statusMessage?: string
  onUserOnline?: (user: PresenceState) => void
  onUserOffline?: (userId: string) => void
  onPresenceChange?: (state: Record<string, PresenceState[]>) => void
}

export function usePresence({
  userId,
  userName,
  avatarUrl,
  statusMessage = '',
  onUserOnline,
  onUserOffline,
  onPresenceChange,
}: UsePresenceOptions) {
  const supabase = createClient()
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceState>>(new Map())
  const [myStatus, setMyStatus] = useState<PresenceStatus>('online')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const awayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevKeysRef = useRef<Set<string>>(new Set())

  const persistStatus = useCallback(async (status: PresenceStatus, msg?: string) => {
    await supabase.from('user_presence').upsert({
      user_id: userId,
      status,
      status_message: msg || statusMessage,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }, [userId, statusMessage, supabase])

  const setStatus = useCallback(async (status: PresenceStatus, msg?: string) => {
    setMyStatus(status)
    if (channelRef.current) {
      await channelRef.current.track({
        user_id: userId,
        name: userName,
        avatar_url: avatarUrl || null,
        status,
        status_message: msg || statusMessage,
        online_at: new Date().toISOString(),
      })
    }
    await persistStatus(status, msg)
  }, [userId, userName, avatarUrl, statusMessage, persistStatus])

  const resetActivityTimers = useCallback(() => {
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current)
    if (awayTimerRef.current) clearTimeout(awayTimerRef.current)
    if (myStatus === 'away') setStatus('online')
    awayTimerRef.current = setTimeout(() => setStatus('away'), AWAY_TIMEOUT)
    activityTimerRef.current = setTimeout(() => setStatus('offline'), OFFLINE_TIMEOUT)
  }, [myStatus, setStatus])

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const newMap = new Map<string, PresenceState>()
        const newKeys = new Set<string>()

        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            newMap.set(key, presences[0])
            newKeys.add(key)
          }
        })

        newKeys.forEach((key) => {
          if (!prevKeysRef.current.has(key) && key !== userId) {
            const user = newMap.get(key)
            if (user) onUserOnline?.(user)
          }
        })

        prevKeysRef.current.forEach((key) => {
          if (!newKeys.has(key) && key !== userId) {
            onUserOffline?.(key)
          }
        })

        prevKeysRef.current = newKeys
        setOnlineUsers(newMap)
        onPresenceChange?.(state as Record<string, PresenceState[]>)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            name: userName,
            avatar_url: avatarUrl || null,
            status: 'online',
            status_message: statusMessage,
            online_at: new Date().toISOString(),
          })
          await persistStatus('online')
        }
      })

    channelRef.current = channel

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    const handleActivity = () => resetActivityTimers()
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))

    const handleVisibility = () => {
      if (document.hidden) setStatus('away')
      else { setStatus('online'); resetActivityTimers() }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleUnload = () => {
      const body = JSON.stringify({
        user_id: userId,
        status: 'offline',
        last_seen_at: new Date().toISOString(),
      })
      navigator.sendBeacon?.('/api/connect/presence', body)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleUnload)
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current)
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current)
      persistStatus('offline')
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    onlineUsers,
    myStatus,
    setStatus,
    isOnline: (uid: string) => onlineUsers.has(uid),
    getPresence: (uid: string) => onlineUsers.get(uid),
    onlineCount: onlineUsers.size,
  }
}

export default usePresence
