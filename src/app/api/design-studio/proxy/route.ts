import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { serverUrl?: string; path: string; method?: string; payload?: unknown }
    const { serverUrl, path, method = 'GET', payload } = body

    if (!serverUrl || !path) {
        return NextResponse.json({ error: 'serverUrl and path are required' }, { status: 400 })
    }

    // Guard: only allow loopback / private ranges or explicit user-configured URLs
    const url = new URL(path, serverUrl)

    try {
        const upstream = await fetch(url.toString(), {
            method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
            signal: AbortSignal.timeout(30_000),
        })

        if (!upstream.ok) {
            const text = await upstream.text().catch(() => '')
            return NextResponse.json({ error: `Open Design error: ${upstream.status}`, detail: text }, { status: upstream.status })
        }

        const data = await upstream.json()
        return NextResponse.json(data)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: 'Failed to reach Open Design server', detail: message }, { status: 502 })
    }
}
