import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { updateSession } from '@/lib/supabase/middleware'

const locales = ['pt', 'en', 'es', 'ja', 'ar']
const defaultLocale = 'pt'

// Map Vercel geo country codes to supported locales
const COUNTRY_LOCALE: Record<string, string> = {
    BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
    US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en', ZA: 'en', IN: 'en',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', UY: 'es', PY: 'es', EC: 'es', VE: 'es', BO: 'es', CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', CU: 'es',
    JP: 'ja',
    SA: 'ar', AE: 'ar', EG: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar',
}

const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://www.iulemirandaimoveis.com.br',
    'https://iulemirandaimoveis.com.br',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
].filter(Boolean) as string[]

function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
    return response
}

function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
}

function getLocale(request: NextRequest) {
    // 1. Vercel geo IP detection (x-vercel-ip-country header, auto-populated on Vercel)
    const country = request.headers.get('x-vercel-ip-country')
    if (country && COUNTRY_LOCALE[country]) {
        return COUNTRY_LOCALE[country]
    }

    // 2. Fallback: Accept-Language header negotiation
    const headers = { 'accept-language': request.headers.get('accept-language') || 'pt-BR,pt;q=0.9' }
    const languages = new Negotiator({ headers }).languages()
    return match(languages, locales, defaultLocale)
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const origin = request.headers.get('origin')

    // 0. Short-link redirects and public verification — no locale, no auth required
    if (
        pathname.startsWith('/l/') ||
        pathname.startsWith('/r/') ||
        pathname === '/verificar'
    ) {
        return NextResponse.next()
    }

    // 0c. Redirect /{locale}/verificar → /verificar (canonical QR verification URL)
    if (locales.some(loc => pathname === `/${loc}/verificar`)) {
        const url = new URL(request.url)
        url.pathname = '/verificar'
        return NextResponse.redirect(url)
    }

    // 0c2. The IMI Console (/users/*) is locale-independent (like /backoffice).
    // If a locale prefix sneaks in (stale PWA/service-worker cache, bookmark or
    // shared link such as /pt/users/login), strip it and serve the console.
    // Rewrite (not redirect) so it never loops with a cached client redirect.
    const localeUsersPrefix = locales.find(
        loc => pathname === `/${loc}/users` || pathname.startsWith(`/${loc}/users/`)
    )
    if (localeUsersPrefix) {
        const url = request.nextUrl.clone()
        url.pathname = pathname.slice(localeUsersPrefix.length + 1) // drop "/{locale}"
        return NextResponse.rewrite(url)
    }

    // 0b. Allow /set-password route (auth required but no locale)
    if (pathname === '/set-password') {
        return await updateSession(request)
    }

    // 1. Handle API/Backoffice/Login with Supabase Auth (ignore locale)
    if (
        pathname.startsWith('/backoffice') ||
        pathname.startsWith('/users') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/login')
    ) {
        // Handle CORS preflight for API routes
        if (request.method === 'OPTIONS' && pathname.startsWith('/api')) {
            const preflightResponse = new NextResponse(null, { status: 204 })
            addSecurityHeaders(preflightResponse)
            return addCorsHeaders(preflightResponse, origin)
        }

        const response = await updateSession(request)
        addSecurityHeaders(response)

        // Add CORS headers to all API responses
        if (pathname.startsWith('/api')) {
            return addCorsHeaders(response, origin)
        }

        return response
    }

    // 2. Check for public assets/static files to ignore locale
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.') || // files (favicon.ico, image.png)
        pathname.startsWith('/monitoring')
    ) {
        return NextResponse.next()
    }

    // 3. Check if there is any supported locale in the pathname
    const pathnameIsMissingLocale = locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    // 4. Redirect to locale if missing
    if (pathnameIsMissingLocale) {
        const locale = getLocale(request)

        // Redirect / to /pt (or detected locale)
        return NextResponse.redirect(
            new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
        )
    }

    // If locale is present, just continue
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Build matcher to catch everything EXCEPT specific static paths
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
