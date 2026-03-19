import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
// Force dynamic — never cache redirect responses at the edge.
// Without this, Vercel CDN may serve a cached 307 and skip the serverless function,
// causing tracking writes to be missed.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
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
    // 1. Find the tracked link (use admin to bypass RLS for anonymous QR scans)
    const { data: link, error } = await supabaseAdmin
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
    // 6 & 7. Track event + increment counter — await both in parallel BEFORE redirecting.
    // Serverless functions (Vercel) terminate immediately after returning a response;
    // fire-and-forget void calls never complete. Promise.allSettled ensures both run
    // even if one fails, without blocking longer than necessary.
    const [eventResult, rpcResult] = await Promise.allSettled([
        supabaseAdmin
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
            }),
        supabaseAdmin
            .rpc('increment_link_clicks', { link_id: link.id } as unknown as string),
    ])
    // Log failures for debugging (visible in Vercel function logs)
    if (eventResult.status === 'rejected') {
    } else if (eventResult.value?.error) {
    }
    if (rpcResult.status === 'rejected') {
    } else if (rpcResult.value?.error) {
    }
    // Persist tracking errors to system_error_logs for dashboard visibility
    const errors: string[] = []
    if (eventResult.status === 'rejected') errors.push(`event_insert: ${eventResult.reason}`)
    else if (eventResult.value?.error) errors.push(`event_insert: ${JSON.stringify(eventResult.value.error)}`)
    if (rpcResult.status === 'rejected') errors.push(`rpc: ${rpcResult.reason}`)
    else if (rpcResult.value?.error) errors.push(`rpc: ${JSON.stringify(rpcResult.value.error)}`)
    if (errors.length > 0) {
        void supabaseAdmin.from('system_error_logs').insert({
            component_name: 'tracking_redirect',
            error_message: errors.join(' | '),
            page_url: `/l/${shortCode}`,
            metadata: { short_code: shortCode, link_id: link.id },
        }).then(() => {}, () => {}) // swallow — best-effort logging
    }
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
