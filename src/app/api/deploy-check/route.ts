import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const checks: Record<string, string> = {}
    let healthy = true

    // 1. Check Supabase connectivity
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('developments').select('id', { count: 'exact', head: true })
        checks.database = error ? `error: ${error.message}` : 'ok'
        if (error) healthy = false
    } catch {
        checks.database = 'unreachable'
        healthy = false
    }

    // 2. Environment variables check
    checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
    checks.supabase_anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) healthy = false

    return NextResponse.json({
        status: healthy ? 'healthy' : 'degraded',
        service: 'imi-backoffice',
        timestamp: new Date().toISOString(),
        checks,
    })
}
