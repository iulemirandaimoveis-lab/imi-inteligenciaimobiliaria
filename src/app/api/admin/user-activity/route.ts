// GET /api/admin/user-activity
// Returns all active brokers with online status, last login, and session time.
// Admin/manager only.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Only admins and managers can access this endpoint
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const { data: broker } = await supabaseAdmin
            .from('brokers')
            .select('role')
            .eq('user_id', user.id)
            .single()

        const isAdmin =
            profile?.role && ['admin', 'super_admin', 'owner'].includes(profile.role) ||
            broker?.role && ['admin', 'broker_manager'].includes(broker.role)

        if (!isAdmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // Fetch all active brokers with presence and session data
        const { data: brokers, error: brokersError } = await supabaseAdmin
            .from('brokers')
            .select('id, user_id, name, email, avatar_url, role, status, last_login_at')
            .eq('status', 'active')
            .order('name')

        if (brokersError) throw brokersError

        if (!brokers || brokers.length === 0) {
            return NextResponse.json({ data: [] })
        }

        const userIds = brokers.map((b: { user_id: string }) => b.user_id).filter(Boolean) as string[]

        // Fetch presence status for all users
        const { data: presenceRows } = await supabaseAdmin
            .from('user_presence')
            .select('user_id, status, status_message, last_seen_at')
            .in('user_id', userIds)

        type PresenceRow = { user_id: string; status: string; status_message: string; last_seen_at: string | null }
        const presenceMap = new Map<string, PresenceRow>(
            ((presenceRows || []) as PresenceRow[]).map((p) => [p.user_id, p])
        )

        // Fetch today's session seconds per user
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todaySessions } = await supabaseAdmin
            .from('user_backoffice_sessions')
            .select('user_id, started_at, last_heartbeat_at, ended_at')
            .in('user_id', userIds)
            .gte('started_at', today.toISOString())

        // Aggregate today seconds per user
        const todaySecondsMap = new Map<string, number>()
        for (const s of todaySessions || []) {
            const endTime = s.ended_at || s.last_heartbeat_at
            const startTime = s.started_at
            if (!endTime || !startTime) continue
            const secs = Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
            todaySecondsMap.set(s.user_id, (todaySecondsMap.get(s.user_id) || 0) + secs)
        }

        type BrokerRow = { id: string; user_id: string; name: string; email: string; avatar_url: string | null; role: string; last_login_at: string | null }
        const data = (brokers as BrokerRow[]).map((b) => {
            const presence = presenceMap.get(b.user_id)
            return {
                broker_id: b.id,
                user_id: b.user_id,
                name: b.name,
                email: b.email,
                avatar_url: b.avatar_url,
                role: b.role,
                last_login_at: b.last_login_at,
                presence_status: presence?.status || 'offline',
                status_message: presence?.status_message || '',
                last_seen_at: presence?.last_seen_at || null,
                today_seconds: Math.round(todaySecondsMap.get(b.user_id) || 0),
            }
        })

        // Sort: online first, then by name
        data.sort((a, b) => {
            const order: Record<string, number> = { online: 0, busy: 1, away: 2, offline: 3 }
            const diff = (order[a.presence_status] ?? 3) - (order[b.presence_status] ?? 3)
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR')
        })

        return NextResponse.json({ data })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro interno'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// POST /api/admin/user-activity — heartbeat to update session
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { session_id } = await req.json().catch(() => ({}))

        if (session_id) {
            // Update heartbeat on existing session
            await supabaseAdmin
                .from('user_backoffice_sessions')
                .update({ last_heartbeat_at: new Date().toISOString() })
                .eq('id', session_id)
                .eq('user_id', user.id)
        } else {
            // Create new session (e.g. after OAuth login)
            const { data: newSession } = await supabaseAdmin
                .from('user_backoffice_sessions')
                .insert({
                    user_id: user.id,
                    started_at: new Date().toISOString(),
                    last_heartbeat_at: new Date().toISOString(),
                })
                .select('id')
                .single()

            // Also update last_login_at
            await supabaseAdmin
                .from('brokers')
                .update({ last_login_at: new Date().toISOString() })
                .eq('user_id', user.id)

            return NextResponse.json({ ok: true, session_id: newSession?.id })
        }

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: true })
    }
}

// DELETE /api/admin/user-activity — end session on logout
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ ok: true })

        const { session_id } = await req.json().catch(() => ({}))

        if (session_id) {
            await supabaseAdmin
                .from('user_backoffice_sessions')
                .update({
                    ended_at: new Date().toISOString(),
                    last_heartbeat_at: new Date().toISOString(),
                })
                .eq('id', session_id)
                .eq('user_id', user.id)
        }

        // Mark presence as offline
        await supabaseAdmin
            .from('user_presence')
            .upsert({
                user_id: user.id,
                status: 'offline',
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: true })
    }
}
