import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppWebhook } from '@/lib/whatsapp/sender'
import crypto from 'crypto'

// GET: Verificação webhook (Meta exige)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Recebe mensagens — valida HMAC-SHA256 do Meta
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const appSecret = process.env.WHATSAPP_APP_SECRET

        // Validate HMAC signature if app secret is configured
        if (appSecret) {
            const signature = request.headers.get('x-hub-signature-256')
            if (!signature) {
                return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
            }
            const expected = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(rawBody)
                .digest('hex')
            const sigBuf = Buffer.from(signature)
            const expBuf = Buffer.from(expected)
            if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        const body = JSON.parse(rawBody)
        processWhatsAppWebhook(body).catch(() => {})
        // Retorna 200 imediatamente (Meta exige resposta rápida)
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
