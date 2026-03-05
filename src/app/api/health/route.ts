export const dynamic = 'force-dynamic'

// GET /api/health — System health check
// Returns status of all critical services: database, storage, auth, ai
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const checks: Record<string, boolean | string> = {
        database: false,
        storage: false,
        auth: false,
        ai: false,
        timestamp: new Date().toISOString(),
    }

    try {
        const supabase = await createClient()

        // Database check — quick query on leads table
        const { error: dbErr } = await supabase
            .from('leads')
            .select('id')
            .limit(1)
        checks.database = !dbErr

        // Storage check — list root of media bucket
        const { error: storErr } = await supabase
            .storage
            .from('media')
            .list('', { limit: 1 })
        checks.storage = !storErr

        // Auth check — Supabase URL configured
        checks.auth = !!process.env.NEXT_PUBLIC_SUPABASE_URL

        // AI check — Anthropic key configured
        checks.ai = !!process.env.ANTHROPIC_API_KEY

    } catch (err) {
        console.error('Health check error:', err)
    }

    const serviceChecks = [checks.database, checks.storage, checks.auth, checks.ai]
    const allHealthy = serviceChecks.every(v => v === true)
    const someHealthy = serviceChecks.some(v => v === true)

    const status = allHealthy ? 200 : someHealthy ? 207 : 503

    return NextResponse.json(checks, { status })
}
