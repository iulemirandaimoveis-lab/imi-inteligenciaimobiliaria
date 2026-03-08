import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { updateSession } from '@/lib/supabase/middleware'

const locales = ['pt', 'en', 'ja', 'ar', 'es']
const defaultLocale = 'pt'

const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://www.iulemirandaimoveis.com.br',
    'https://iulemirandaimoveis.com.br',
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean) as string[]

function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
}

function getLocale(request: Request) {
    const headers = { 'accept-language': request.headers.get('accept-language') || 'pt-BR,pt;q=0.9' }
    const languages = new Negotiator({ headers }).languages()
    return match(languages, locales, defaultLocale)
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const origin = request.headers.get('origin')

    // 0. QR short-link redirects: /l/:shortCode — public, no locale, no auth
    if (pathname.startsWith('/l/')) {
        return NextResponse.next()
    }

    // 1. Handle API/Backoffice/Login with Supabase Auth (ignore locale)
    if (
        pathname.startsWith('/backoffice') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/login')
    ) {
        // Handle CORS preflight for API routes
        if (request.method === 'OPTIONS' && pathname.startsWith('/api')) {
            const preflightResponse = new NextResponse(null, { status: 204 })
            return addCorsHeaders(preflightResponse, origin)
        }

        const response = await updateSession(request)

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
