'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

interface AnalyticsProviderProps {
    googleAnalytics?: string
    facebookPixel?: string
}

/* Generate a unique session ID (persisted in sessionStorage) */
function getSessionId(): string {
    if (typeof window === 'undefined') return ''
    let sid = sessionStorage.getItem('imi_session_id')
    if (!sid) {
        sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
        sessionStorage.setItem('imi_session_id', sid)
    }
    return sid
}

/* Read UTMs from URL or cookie */
function getAttribution() {
    if (typeof window === 'undefined') return {}
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    const utmContent = params.get('utm_content')

    // Also check cookie
    let cookie: Record<string, string> = {}
    try {
        const raw = document.cookie.split(';').find(c => c.trim().startsWith('imi_attribution='))
        if (raw) cookie = JSON.parse(decodeURIComponent(raw.split('=')[1]))
    } catch { }

    return {
        utmSource: utmSource || cookie.source || null,
        utmMedium: utmMedium || cookie.medium || null,
        utmCampaign: utmCampaign || cookie.campaign || null,
        utmContent: utmContent || cookie.content || null,
    }
}

/* Extract development slug from path like /pt/imoveis/reserva-atlantis */
function extractDevSlug(path: string): string | null {
    const match = path.match(/\/imoveis\/([^\/\?]+)/)
    return match ? match[1] : null
}

export default function AnalyticsProvider({ googleAnalytics, facebookPixel }: AnalyticsProviderProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const startTime = useRef(Date.now())
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Track page view on route change
    useEffect(() => {
        const sessionId = getSessionId()
        if (!sessionId) return

        startTime.current = Date.now()

        const attribution = getAttribution()
        const devSlug = extractDevSlug(pathname)

        // Send page view (non-blocking)
        fetch('/api/tracking/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                pageUrl: window.location.href,
                pagePath: pathname,
                referrer: document.referrer || null,
                ...attribution,
                screenWidth: window.innerWidth,
                developmentSlug: devSlug,
            }),
            keepalive: true,
        }).catch(() => { })

        // Heartbeat every 15s to track duration
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)
        heartbeatRef.current = setInterval(() => {
            const duration = Math.round((Date.now() - startTime.current) / 1000)
            const scrollDepth = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)) * 100
            )
            fetch('/api/tracking/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    duration,
                    scrollDepth: Math.min(scrollDepth, 100),
                    pagePath: pathname,
                }),
                keepalive: true,
            }).catch(() => { })
        }, 15000)

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            // Send final duration on unmount
            const duration = Math.round((Date.now() - startTime.current) / 1000)
            if (duration > 2) {
                fetch('/api/tracking/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, duration, pagePath: pathname }),
                    keepalive: true,
                }).catch(() => { })
            }
        }
    }, [pathname, searchParams])

    return (
        <>
            {/* Google Analytics 4 */}
            {googleAnalytics && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${googleAnalytics}', {
                                page_title: document.title,
                                page_location: window.location.href,
                            });
                        `}
                    </Script>
                </>
            )}

            {/* Meta Pixel (Facebook) */}
            {facebookPixel && (
                <Script id="meta-pixel-init" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${facebookPixel}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}
        </>
    )
}
