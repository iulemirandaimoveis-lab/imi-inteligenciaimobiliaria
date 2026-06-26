import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ── IMI Console (/users/*) — RBAC ecosystem ──────────────────────────
    // Public entry points within the console: login, forgot, OAuth callback.
    const IMI_PUBLIC = ['/users/login', '/users/forgot', '/users/primeiro-acesso', '/users/auth/callback']
    if (pathname.startsWith('/users')) {
        const isPublic = IMI_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))
        if (!user && !isPublic) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/users/login'
            redirectUrl.searchParams.set('next', pathname)
            return NextResponse.redirect(redirectUrl)
        }
        // Already authenticated and hitting the login screen → go to dashboard.
        if (user && pathname === '/users/login') {
            return NextResponse.redirect(new URL('/users/dashboard', request.url))
        }
        return response
    }

    // Proteger rotas do backoffice
    if (request.nextUrl.pathname.startsWith('/backoffice')) {
        if (!user) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Subscription enforcement: DISABLED for launch phase
        // TODO: Re-enable when billing/subscription system is ready
        // const pathname = request.nextUrl.pathname
        // const isExempt = pathname.startsWith('/backoffice/billing') || pathname.startsWith('/onboarding')
        // if (!isExempt && user?.user_metadata) { ... }
    }

    // Se já estiver logado e tentar acessar /login, redireciona para /backoffice
    if (request.nextUrl.pathname === '/login') {
        if (user) {
            return NextResponse.redirect(new URL('/backoffice', request.url))
        }
    }

    return response
}
