'use client'

/**
 * Tracks the current user's backoffice session.
 * - On mount: creates a new session via POST /api/admin/user-activity (or reuses existing)
 * - Every 3 minutes: sends a heartbeat to keep the session alive
 * - On unmount / page unload: ends the session via DELETE /api/admin/user-activity
 *
 * Mount once inside the backoffice layout.
 */

import { useEffect, useRef } from 'react'

const HEARTBEAT_MS = 3 * 60 * 1000  // 3 minutes

export function useBackofficeSession() {
    const sessionIdRef = useRef<string | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        let mounted = true

        async function startSession() {
            try {
                const res = await fetch('/api/admin/user-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })
                if (!res.ok) return
                const json = await res.json()
                if (mounted && json.session_id) {
                    sessionIdRef.current = json.session_id
                }
            } catch { /* non-blocking */ }
        }

        async function heartbeat() {
            if (!sessionIdRef.current) return
            try {
                await fetch('/api/admin/user-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionIdRef.current }),
                })
            } catch { /* non-blocking */ }
        }

        function endSession() {
            if (!sessionIdRef.current) return
            const body = JSON.stringify({ session_id: sessionIdRef.current })
            // keepalive ensures the request survives page unload
            fetch('/api/admin/user-activity', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            }).catch(() => {})
        }

        startSession()

        timerRef.current = setInterval(heartbeat, HEARTBEAT_MS)

        window.addEventListener('beforeunload', endSession)

        return () => {
            mounted = false
            if (timerRef.current) clearInterval(timerRef.current)
            window.removeEventListener('beforeunload', endSession)
            endSession()
        }
    }, [])
}
