'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { PERMISSIONS, type PermissionKey, type RoleKey } from '@/lib/imi-auth/rbac'
import type { ImiSession } from '@/lib/imi-auth/types'

interface SessionContextValue {
  session: ImiSession
  can: (permission: PermissionKey) => boolean
  hasRole: (role: RoleKey) => boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Provides the resolved IMI session to client components and exposes
 * permission/role helpers for conditional UI. The authoritative enforcement
 * still lives in RLS + server guards — this is for rendering only.
 */
export function ImiSessionProvider({ session, children }: { session: ImiSession; children: ReactNode }) {
  const value = useMemo<SessionContextValue>(() => {
    const permSet = new Set(session.permissions)
    return {
      session,
      can: (permission) => permSet.has(PERMISSIONS.ALL) || permSet.has(permission),
      hasRole: (role) => session.roleKeys.includes(role),
    }
  }, [session])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useImiSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useImiSession must be used within ImiSessionProvider')
  return ctx
}
