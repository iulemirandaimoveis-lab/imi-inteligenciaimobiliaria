// =============================================================================
// IMI LINK TRACKER — REDIRECT ROUTE (v2)
// =============================================================================
// Rota: /l/[shortCode]
// Upgrades: bot detection (40+ patterns), IP hashing (LGPD), deduplicação
//           3 camadas (fingerprint+30min window), engagement tracking via _tid
// =============================================================================

import { NextResponse } from 'next/server'
import { resolveClick } from '@/lib/link-tracker'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { shortCode: string } }
) {
    const shortCode = params.shortCode

    // Extract request data
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '0.0.0.0'

    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || null

    // Geo headers from Vercel (free, no external API)
    const country = request.headers.get('x-vercel-ip-country') || null
    const region = request.headers.get('x-vercel-ip-country-region') || null
    const city = request.headers.get('x-vercel-ip-city')
        ? decodeURIComponent(request.headers.get('x-vercel-ip-city')!)
        : null

    try {
        const result = await resolveClick({
            shortCode,
            ip,
            userAgent,
            referrer,
            country,
            region,
            city,
        })

        if (!result) {
            // Link not found or expired — redirect to home
            return NextResponse.redirect(
                new URL('https://www.iulemirandaimoveis.com.br/pt'),
                { status: 302 }
            )
        }

        // Build destination URL with tracking ID for EngagementTracker
        const destinationUrl = new URL(result.destination_url)
        if (result.click_id && !result.is_bot) {
            destinationUrl.searchParams.set('_tid', result.click_id)
        }

        // Also merge UTM params from the short link request
        const requestUrl = new URL(request.url)
        const reqSource = requestUrl.searchParams.get('utm_source')
        const reqMedium = requestUrl.searchParams.get('utm_medium')
        const reqCampaign = requestUrl.searchParams.get('utm_campaign')
        if (reqSource) destinationUrl.searchParams.set('utm_source', reqSource)
        if (reqMedium) destinationUrl.searchParams.set('utm_medium', reqMedium)
        if (reqCampaign) destinationUrl.searchParams.set('utm_campaign', reqCampaign)

        // Notify broker (fire-and-forget, best-effort)
        if (!result.is_bot) {
            void supabaseAdmin.from('notifications').insert({
                type: 'tracking',
                title: '📲 Link acessado',
                message: `Novo acesso ao link "${shortCode}" de ${city || 'local desconhecido'} (${userAgent.includes('Mobile') ? 'mobile' : 'desktop'})`,
                data: {
                    link_id: result.link_id,
                    click_id: result.click_id,
                    short_code: shortCode,
                    city,
                    country,
                },
                read: false,
            }).then(() => {}, () => {})
        }

        // 302 redirect (not 301, so browser always goes through tracker)
        const response = NextResponse.redirect(destinationUrl.toString(), {
            status: 302,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
            },
        })

        // Attribution cookie for 30 days
        response.cookies.set('imi_attribution', JSON.stringify({
            source: reqSource,
            medium: reqMedium,
            campaign: reqCampaign,
            shortCode,
            clickId: result.click_id,
            timestamp: Date.now()
        }), {
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            sameSite: 'lax',
        })

        return response
    } catch (error) {
        console.error(`[LinkTracker] Erro ao resolver ${shortCode}:`, error)
        return NextResponse.redirect(
            new URL('https://www.iulemirandaimoveis.com.br/pt'),
            { status: 302 }
        )
    }
}
