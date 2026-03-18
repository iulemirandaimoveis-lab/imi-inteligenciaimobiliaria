import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// GET /r/:code — Track click and redirect
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Lookup tracked link
    const { data: link } = await supabase
        .from('tracked_links')
        .select('id, destination_url, is_active')
        .eq('short_code', code)
        .single()

    if (!link || !link.is_active) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    // Extract tracking data from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? ''
    const referrer = req.headers.get('referer') ?? null
    const geo = {
        country: req.headers.get('x-vercel-ip-country') ?? null,
        region: req.headers.get('x-vercel-ip-country-region') ?? null,
        city: req.headers.get('x-vercel-ip-city') ?? null,
    }

    // Insert event (fire and forget — don't block redirect)
    supabase
        .from('link_events')
        .insert({
            link_id: link.id,
            event_type: 'click',
            ip_address: ip,
            user_agent: userAgent,
            referrer,
            country: geo.country,
            region: geo.region,
            city: geo.city,
        })
        .then(() => {})

    // 302 redirect to destination
    return NextResponse.redirect(link.destination_url, 302)
}
