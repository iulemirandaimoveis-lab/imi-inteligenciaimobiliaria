/**
 * GET /api/auth/tiktok/callback
 * Callback OAuth2 TikTok — troca code por token e salva no DB
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
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=tiktok_denied`)
    }

    // Verify CSRF state
    const cookieStore = await cookies()
    const savedState = cookieStore.get('tiktok_oauth_state')?.value
    cookieStore.delete('tiktok_oauth_state')

    if (!state || state !== savedState) {
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=tiktok_state_mismatch`)
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${appUrl}/login`)
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY!
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${appUrl}/api/auth/tiktok/callback`

    try {
        // 1. Exchange code for access token
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        })
        const tokens = await tokenRes.json()
        if (tokens.error || !tokens.access_token) {
            return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=tiktok_token_error`)
        }

        // 2. Get user info
        const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const userData = await userRes.json()
        const tiktokUser = userData.data?.user || {}

        // 3. Save to social_accounts
        await supabaseAdmin.from('social_accounts').upsert({
            user_id: user.id,
            platform: 'tiktok',
            platform_account_id: tokens.open_id || tiktokUser.open_id || '',
            account_name: tiktokUser.display_name || '',
            profile_image_url: tiktokUser.avatar_url || null,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            token_expires_at: new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString(),
            metadata: {
                union_id: tiktokUser.union_id,
                scope: tokens.scope,
            },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform,platform_account_id' })

        // 4. Save to integration_configs
        await supabaseAdmin.from('integration_configs').upsert({
            integration_id: 'tiktok',
            config: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in || 86400) * 1000,
                open_id: tokens.open_id,
                display_name: tiktokUser.display_name,
                avatar_url: tiktokUser.avatar_url,
            },
            status: 'conectado',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'integration_id' })

        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?success=tiktok`)
    } catch (e: unknown) {
        console.error('[TikTok OAuth] Error:', e)
        return NextResponse.redirect(`${appUrl}/backoffice/integracoes?error=tiktok_error`)
    }
}
