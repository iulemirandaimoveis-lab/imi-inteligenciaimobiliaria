// POST /api/tracking/pageview — Records page views from the public website
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'
function getSupabase() { return createClient(supabaseUrl, supabaseKey) }

function parseUA(ua: string) {
    let deviceType = 'desktop'
    if (/mobile|android|iphone|ipod/i.test(ua)) deviceType = 'mobile'
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

    let browser = 'other'
    if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome'
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
    else if (/firefox/i.test(ua)) browser = 'Firefox'
    else if (/edge/i.test(ua)) browser = 'Edge'
    else if (/opr|opera/i.test(ua)) browser = 'Opera'

    let os = 'other'
    if (/windows/i.test(ua)) os = 'Windows'
    else if (/mac os|macintosh/i.test(ua) && !/iphone|ipad/i.test(ua)) os = 'macOS'
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
    else if (/android/i.test(ua)) os = 'Android'
    else if (/linux/i.test(ua)) os = 'Linux'

    return { deviceType, browser, os }
}

function isBot(ua: string): boolean {
    return /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|bytespider/i.test(ua)
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase()
        const body = await request.json()
        const {
            sessionId, pageUrl, pagePath, referrer,
            utmSource, utmMedium, utmCampaign, utmContent,
            screenWidth, developmentSlug, duration, scrollDepth,
        } = body

        if (!sessionId || !pagePath) {
            return NextResponse.json({ error: 'sessionId and pagePath required' }, { status: 400 })
        }

        const ua = request.headers.get('user-agent') || ''
        if (isBot(ua)) {
            return NextResponse.json({ ok: true, bot: true })
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') || 'unknown'
        const { deviceType, browser, os } = parseUA(ua)

        // 1. Record page view
        await supabase.from('page_views').insert({
            session_id: sessionId,
            page_url: pageUrl || pagePath,
            page_path: pagePath,
            referrer: referrer || null,
            utm_source: utmSource || null,
            utm_medium: utmMedium || null,
            utm_campaign: utmCampaign || null,
            utm_content: utmContent || null,
            device_type: deviceType,
            browser,
            os,
            screen_width: screenWidth ? Number(screenWidth) : null,
            ip_address: ip,
            development_slug: developmentSlug || null,
            duration_seconds: duration ? Number(duration) : 0,
            scroll_depth: scrollDepth ? Number(scrollDepth) : 0,
        })

        // 2. Upsert session
        const { data: existingSession } = await supabase
            .from('tracking_sessions')
            .select('id, page_count')
            .eq('session_id', sessionId)
            .single()

        if (existingSession) {
            await supabase
                .from('tracking_sessions')
                .update({
                    last_page: pagePath,
                    page_count: (existingSession.page_count || 1) + 1,
                    total_duration: duration ? Number(duration) : 0,
                    last_activity_at: new Date().toISOString(),
                })
                .eq('session_id', sessionId)
        } else {
            await supabase.from('tracking_sessions').insert({
                session_id: sessionId,
                first_page: pagePath,
                last_page: pagePath,
                page_count: 1,
                total_duration: 0,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
                device_type: deviceType,
                browser,
                os,
                ip_address: ip,
                is_bot: false,
            })
        }

        // 3. Hot lead detection — notify if visitor views 3+ property pages
        if (developmentSlug && existingSession) {
            const { count } = await supabase
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .not('development_slug', 'is', null)

            if (count && count >= 3) {
                // Check if we already sent a notification for this session
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('type', 'hot_lead')
                    .contains('data', { session_id: sessionId })
                    .limit(1)

                if (!existingNotif || existingNotif.length === 0) {
                    await supabase.from('notifications').insert({
                        user_id: '00000000-0000-0000-0000-000000000000',
                        type: 'hot_lead',
                        title: '🔥 Visitante interessado detectado',
                        message: `Um visitante visualizou ${count} imóveis no site. Último: ${developmentSlug}. Dispositivo: ${deviceType}. Origem: ${utmSource || 'direto'}`,
                        data: {
                            session_id: sessionId,
                            pages_viewed: count,
                            last_property: developmentSlug,
                            device: deviceType,
                            source: utmSource || 'direct',
                            ip: ip,
                        },
                        read: false,
                    })
                }
            }
        }

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('Pageview tracking error:', err)
        return NextResponse.json({ ok: true }) // Never fail client-side tracking
    }
}
