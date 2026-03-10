/**
 * GET /api/gmail — lista emails recentes
 * POST /api/gmail — envia email
 * Requer autenticação Google OAuth salva em integration_configs
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getGoogleTokens(supabase: any) {
    const { data } = await supabase
        .from('integration_configs')
        .select('config')
        .eq('integration_id', 'google')
        .single()

    if (!data?.config?.access_token) return null

    // Refresh if expired
    const config = data.config
    if (config.expires_at && Date.now() > config.expires_at - 60000) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: config.refresh_token,
                grant_type: 'refresh_token',
            }),
        })
        const refreshed = await refreshRes.json()
        if (refreshed.access_token) {
            config.access_token = refreshed.access_token
            config.expires_at = Date.now() + refreshed.expires_in * 1000
            await supabase.from('integration_configs').update({ config }).eq('integration_id', 'google')
        }
    }
    return config
}

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tokens = await getGoogleTokens(supabase)
    if (!tokens) return NextResponse.json({ error: 'Google não conectado. Vá em Integrações para conectar.' }, { status: 400 })

    const label = req.nextUrl.searchParams.get('label') || 'INBOX'
    const maxResults = req.nextUrl.searchParams.get('max') || '20'
    const pageToken = req.nextUrl.searchParams.get('pageToken') || ''

    try {
        // List messages
        const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
        listUrl.searchParams.set('labelIds', label)
        listUrl.searchParams.set('maxResults', maxResults)
        if (pageToken) listUrl.searchParams.set('pageToken', pageToken)

        const listRes = await fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${tokens.access_token}` } })
        const listData = await listRes.json()

        if (!listData.messages?.length) return NextResponse.json({ messages: [], nextPageToken: null })

        // Fetch each message's metadata
        const messages = await Promise.all(
            listData.messages.slice(0, 20).map(async (m: any) => {
                const msgRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
                    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
                )
                const msg = await msgRes.json()
                const headers = msg.payload?.headers || []
                const get = (name: string) => headers.find((h: any) => h.name === name)?.value || ''
                return {
                    id: m.id,
                    threadId: msg.threadId,
                    from: get('From'),
                    to: get('To'),
                    subject: get('Subject'),
                    date: get('Date'),
                    snippet: msg.snippet,
                    unread: msg.labelIds?.includes('UNREAD'),
                    labelIds: msg.labelIds,
                }
            })
        )

        return NextResponse.json({ messages, nextPageToken: listData.nextPageToken || null, account: tokens.email })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tokens = await getGoogleTokens(supabase)
    if (!tokens) return NextResponse.json({ error: 'Google não conectado' }, { status: 400 })

    const { to, subject, body, threadId, replyToMessageId } = await req.json()
    if (!to || !subject || !body) return NextResponse.json({ error: 'to, subject e body são obrigatórios' }, { status: 400 })

    try {
        const from = tokens.email
        let headers = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8`
        if (replyToMessageId) headers += `\r\nIn-Reply-To: ${replyToMessageId}\r\nReferences: ${replyToMessageId}`

        const raw = btoa(unescape(encodeURIComponent(`${headers}\r\n\r\n${body}`))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

        const sendBody: any = { raw }
        if (threadId) sendBody.threadId = threadId

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(sendBody),
        })
        const data = await res.json()

        if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

        return NextResponse.json({ success: true, messageId: data.id, threadId: data.threadId })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
