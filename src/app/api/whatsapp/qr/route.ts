import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'imi-whatsapp'

/**
 * GET /api/whatsapp/qr — Get QR code from Evolution API for WhatsApp connection
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return NextResponse.json({
            error: 'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY nas variáveis de ambiente.',
            configured: false,
        }, { status: 503 })
    }

    try {
        // Check instance status first
        const statusRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
            headers: { apikey: EVOLUTION_API_KEY },
        })

        if (statusRes.ok) {
            const statusData = await statusRes.json()
            const state = statusData?.instance?.state ?? statusData?.state

            if (state === 'open' || state === 'connected') {
                return NextResponse.json({
                    connected: true,
                    state,
                    message: 'WhatsApp já está conectado',
                })
            }
        }

        // Try to create instance if it doesn't exist
        const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
            method: 'POST',
            headers: {
                apikey: EVOLUTION_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instanceName: EVOLUTION_INSTANCE,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        })

        if (createRes.ok) {
            const createData = await createRes.json()
            if (createData?.qrcode?.base64) {
                return NextResponse.json({
                    connected: false,
                    qrcode: createData.qrcode.base64,
                    instance: EVOLUTION_INSTANCE,
                })
            }
        }

        // If instance already exists, just get QR code
        const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
            headers: { apikey: EVOLUTION_API_KEY },
        })

        if (!qrRes.ok) {
            const errText = await qrRes.text()
            return NextResponse.json({ error: `Erro ao obter QR Code: ${errText}` }, { status: 500 })
        }

        const qrData = await qrRes.json()
        return NextResponse.json({
            connected: false,
            qrcode: qrData?.base64 ?? qrData?.qrcode?.base64 ?? null,
            pairingCode: qrData?.pairingCode ?? null,
            instance: EVOLUTION_INSTANCE,
        })
    } catch (error: unknown) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erro ao conectar com Evolution API',
        }, { status: 500 })
    }
}

/**
 * POST /api/whatsapp/qr — Disconnect / logout WhatsApp instance
 */
export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
    }

    const body = await request.json()
    const { action } = body

    try {
        if (action === 'disconnect') {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE}`, {
                method: 'DELETE',
                headers: { apikey: EVOLUTION_API_KEY },
            })
            if (!res.ok) {
                return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
            }
            return NextResponse.json({ success: true, message: 'WhatsApp desconectado' })
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (error: unknown) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erro interno',
        }, { status: 500 })
    }
}
