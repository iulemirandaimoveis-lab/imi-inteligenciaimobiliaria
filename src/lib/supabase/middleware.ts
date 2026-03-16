import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder',
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

    const { data: { session } } = await supabase.auth.getSession()

    // Proteger rotas do backoffice
    if (request.nextUrl.pathname.startsWith('/backoffice')) {
        if (!session) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Subscription enforcement: skip for /billing and /onboarding
        const pathname = request.nextUrl.pathname
        const isExempt = pathname.startsWith('/backoffice/billing') || pathname.startsWith('/onboarding')
        if (!isExempt && session.user?.user_metadata) {
            const meta = session.user.user_metadata
            const tier = meta.subscription_tier as string | undefined
            const trialEndsAt = meta.trial_ends_at as string | undefined
            const trialExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false

            // Redirect to billing if trial expired and no active paid subscription
            if (trialExpired && (!tier || tier === 'starter')) {
                return NextResponse.redirect(new URL('/backoffice/billing', request.url))
            }
        }
    }

    // Se já estiver logado e tentar acessar /login, redireciona para /backoffice
    if (request.nextUrl.pathname === '/login') {
        if (session) {
            return NextResponse.redirect(new URL('/backoffice', request.url))
        }
    }

    return response
}
