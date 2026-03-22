/**
 * GET /api/auth/meta
 * Inicia OAuth2 Meta (Facebook + Instagram)
 * Requer env: META_APP_ID, META_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const SCOPES = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_messaging',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_messages',
    'instagram_manage_comments',
    'ads_read',
].join(',')

export async function GET(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.META_APP_ID
    const redirectUri = process.env.META_REDIRECT_URI || `${appUrl}/api/auth/meta/callback`

    if (!clientId) {
        return NextResponse.json({ error: 'META_APP_ID não configurado. Adicione nas variáveis de ambiente da Vercel.' }, { status: 500 })
    }

    // Generate CSRF state
    const state = crypto.randomUUID()
    const cookieStore = await cookies()
    cookieStore.set('meta_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    })

    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)

    return NextResponse.redirect(url.toString())
}
