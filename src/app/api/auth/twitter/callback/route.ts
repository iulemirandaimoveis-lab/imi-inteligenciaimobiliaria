/**
 * GET /api/auth/twitter/callback
 * Callback OAuth2 Twitter (X) com PKCE — troca code por token e salva no DB
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=twitter_denied`)
    }

    // Verify CSRF state and retrieve PKCE code verifier
    const cookieStore = await cookies()
    const savedState = cookieStore.get('twitter_oauth_state')?.value
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value
    cookieStore.delete('twitter_oauth_state')
    cookieStore.delete('twitter_code_verifier')

    if (!state || state !== savedState) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=twitter_state_mismatch`)
    }

    if (!codeVerifier) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=twitter_pkce_missing`)
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientId = process.env.TWITTER_CLIENT_ID!
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${appUrl}/api/auth/twitter/callback`

    try {
        // 1. Exchange code for access token (with PKCE code_verifier)
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        })
        const tokens = await tokenRes.json()
        if (tokens.error) {
            return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=twitter_token_error`)
        }

        // 2. Get user info
        const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const userData = await userRes.json()
        const twitterUser = userData.data || {}

        // 3. Save to social_accounts
        await supabaseAdmin.from('social_accounts').upsert({
            user_id: user.id,
            platform: 'twitter',
            platform_account_id: twitterUser.id || '',
            account_name: twitterUser.username || twitterUser.name || '',
            profile_image_url: twitterUser.profile_image_url || null,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            token_expires_at: new Date(Date.now() + (tokens.expires_in || 7200) * 1000).toISOString(),
            metadata: {
                name: twitterUser.name,
                username: twitterUser.username,
                scope: tokens.scope,
            },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform,platform_account_id' })

        // 4. Save to integration_configs
        await supabaseAdmin.from('integration_configs').upsert({
            integration_id: 'twitter',
            config: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in || 7200) * 1000,
                user_id: twitterUser.id,
                username: twitterUser.username,
                name: twitterUser.name,
                profile_image_url: twitterUser.profile_image_url,
            },
            status: 'conectado',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'integration_id' })

        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?success=twitter`)
    } catch (e: unknown) {
        console.error('[Twitter OAuth] Error:', e)
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=twitter_error`)
    }
}
