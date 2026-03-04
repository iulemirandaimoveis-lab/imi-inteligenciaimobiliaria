import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function parseUserAgent(ua: string) {
    // Device type
    let deviceType = 'desktop'
    if (/mobile|android|iphone|ipod/i.test(ua)) deviceType = 'mobile'
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

    // Browser
    let browser = 'other'
    if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome'
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
    else if (/firefox/i.test(ua)) browser = 'Firefox'
    else if (/edge/i.test(ua)) browser = 'Edge'
    else if (/opr|opera/i.test(ua)) browser = 'Opera'
    else if (/samsung/i.test(ua)) browser = 'Samsung Internet'

    // OS
    let os = 'other'
    if (/windows/i.test(ua)) os = 'Windows'
    else if (/mac os|macintosh/i.test(ua) && !/iphone|ipad/i.test(ua)) os = 'macOS'
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
    else if (/android/i.test(ua)) os = 'Android'
    else if (/linux/i.test(ua)) os = 'Linux'

    return { deviceType, browser, os }
}

export async function GET(
    request: Request,
    { params }: { params: { shortCode: string } }
) {
    const shortCode = params.shortCode
    const supabase = await createClient()

    // 1. Find the tracked link
    const { data: link, error } = await supabase
        .from('tracked_links')
        .select('*')
        .eq('short_code', shortCode)
        .single()

    if (error || !link) {
        return NextResponse.redirect(new URL('https://www.iulemirandaimoveis.com.br'))
    }

    // 2. Get target URL (support both original_url and url fields)
    const targetUrl = link.original_url || link.url
    if (!targetUrl) {
        return NextResponse.redirect(new URL('https://www.iulemirandaimoveis.com.br'))
    }

    // 3. Parse request details for tracking
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') || 'unknown'
    const { deviceType, browser, os } = parseUserAgent(userAgent)

    // 4. Extract UTMs from the URL
    let utms: Record<string, string | null> = {}
    try {
        const url = new URL(targetUrl)
        utms = {
            source: url.searchParams.get('utm_source'),
            medium: url.searchParams.get('utm_medium'),
            campaign: url.searchParams.get('utm_campaign'),
            content: url.searchParams.get('utm_content'),
        }
    } catch {
        utms = link.utm_params || {}
    }

    // 5. Also merge any UTM params from the short link request itself
    const requestUrl = new URL(request.url)
    const reqSource = requestUrl.searchParams.get('utm_source')
    const reqMedium = requestUrl.searchParams.get('utm_medium')
    const reqCampaign = requestUrl.searchParams.get('utm_campaign')
    if (reqSource) utms.source = reqSource
    if (reqMedium) utms.medium = reqMedium
    if (reqCampaign) utms.campaign = reqCampaign

    // 6. Log tracking event (non-blocking — don't await to avoid delaying redirect)
    void supabase
        .from('link_events')
        .insert({
            tracked_link_id: link.id,
            event_type: 'click',
            device_type: deviceType,
            browser,
            os,
            ip_address: ip,
            referrer: referer,
            utm_params: utms,
            metadata: {
                user_agent: userAgent.substring(0, 500),
                short_code: shortCode,
            },
            created_at: new Date().toISOString()
        })

    // 7. Increment click count (non-blocking)
    void supabase
        .rpc('increment_link_clicks', { link_id: link.id })

    // 8. Build final redirect URL with UTM passthrough
    let finalUrl = targetUrl
    try {
        const redirectUrl = new URL(targetUrl)
        // Ensure UTMs from request are passed through
        if (reqSource) redirectUrl.searchParams.set('utm_source', reqSource)
        if (reqMedium) redirectUrl.searchParams.set('utm_medium', reqMedium)
        if (reqCampaign) redirectUrl.searchParams.set('utm_campaign', reqCampaign)
        finalUrl = redirectUrl.toString()
    } catch {}

    // 9. Redirect with attribution cookie
    const response = NextResponse.redirect(new URL(finalUrl))
    response.cookies.set('imi_attribution', JSON.stringify({
        ...utms,
        shortCode,
        timestamp: Date.now()
    }), {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
    })

    return response
}
