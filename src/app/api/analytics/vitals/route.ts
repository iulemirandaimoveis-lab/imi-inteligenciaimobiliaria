import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals metrics from the client via sendBeacon.
 * In production, forward to your analytics warehouse (e.g. BigQuery, Supabase).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const metric = JSON.parse(body) as { name: string; value: number; id: string }

    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vital]', metric.name, metric.value)
    }

    // TODO: persist to Supabase analytics table or forward to external service
    // e.g. await supabase.from('web_vitals').insert({ ...metric, timestamp: new Date() })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
