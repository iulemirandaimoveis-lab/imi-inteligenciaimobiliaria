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

    const { data: { session } } = await supabase.auth.getSession()

    // Proteger rotas do backoffice
    if (request.nextUrl.pathname.startsWith('/backoffice')) {
        if (!session) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
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
