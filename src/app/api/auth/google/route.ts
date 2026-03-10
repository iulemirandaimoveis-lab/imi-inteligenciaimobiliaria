/**
 * GET /api/auth/google
 * Inicia OAuth2 Google (Gmail + Drive)
 * Requer env: GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

export async function GET(req: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!clientId) {
        return NextResponse.json({ error: 'GOOGLE_CLIENT_ID não configurado. Adicione nas variáveis de ambiente da Vercel.' }, { status: 500 })
    }

    const state = req.nextUrl.searchParams.get('state') || ''

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)

    return NextResponse.redirect(url.toString())
}
