import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

// ─── Pix EMV Payload Builder (BACEN spec CVM) ───────────────────────────────
function emvField(id: string, value: string): string {
    return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function calcCRC16(str: string): string {
    let crc = 0xffff
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8
        for (let j = 0; j < 8; j++) {
            crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : crc << 1
            crc &= 0xffff
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0')
}

interface PixPayloadOptions {
    pixKey: string
    merchantName: string
    merchantCity: string
    amount: number
    txid: string
    description?: string
}

function buildPixPayload({ pixKey, merchantName, merchantCity, amount, txid, description }: PixPayloadOptions): string {
    const merchantAcctInfo =
        emvField('00', 'br.gov.bcb.pix') +
        emvField('01', pixKey) +
        (description ? emvField('02', description.slice(0, 72)) : '')

    const safeRef = txid.slice(0, 25).replace(/\s/g, '').replace(/[^A-Za-z0-9]/g, '')
    const additionalData = emvField('05', safeRef || '***')

    const payload =
        emvField('00', '01') +
        emvField('26', merchantAcctInfo) +
        emvField('52', '0000') +
        emvField('53', '986') +
        (amount > 0 ? emvField('54', amount.toFixed(2)) : '') +
        emvField('58', 'BR') +
        emvField('59', merchantName.slice(0, 25)) +
        emvField('60', merchantCity.slice(0, 15).toUpperCase()) +
        emvField('62', additionalData) +
        '6304'

    return payload + calcCRC16(payload)
}

function generateTxId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length: 25 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Asaas API ───────────────────────────────────────────────────────────────
const ASAAS_BASE =
    process.env.ASAAS_SANDBOX === 'true'
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://api.asaas.com/api/v3'

async function asaasCreateOrFindCustomer(apiKey: string, name: string): Promise<string> {
    // Try reusing default customer if configured
    if (process.env.ASAAS_DEFAULT_CUSTOMER_ID) {
        return process.env.ASAAS_DEFAULT_CUSTOMER_ID
    }

    const res = await fetch(`${ASAAS_BASE}/customers`, {
        method: 'POST',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'Cliente IMI' }),
    })
    const data = await res.json()
    if (!data.id) throw new Error(`Asaas customer error: ${JSON.stringify(data.errors || data)}`)
    return data.id
}

async function asaasCreateCharge(amount: number, description: string, dueDate: string, debtorName?: string) {
    const apiKey = process.env.ASAAS_API_KEY!

    const customerId = await asaasCreateOrFindCustomer(apiKey, debtorName || 'Cliente IMI')

    // Create Pix payment
    const payRes = await fetch(`${ASAAS_BASE}/payments`, {
        method: 'POST',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer: customerId,
            billingType: 'PIX',
            value: amount,
            dueDate,
            description: description || 'Pagamento IMI',
        }),
    })
    const payment = await payRes.json()
    if (!payment.id) throw new Error(`Asaas payment error: ${JSON.stringify(payment.errors || payment)}`)

    // Fetch QR Code
    const qrRes = await fetch(`${ASAAS_BASE}/payments/${payment.id}/pixQrCode`, {
        headers: { 'access_token': apiKey },
    })
    const qr = await qrRes.json()

    return {
        externalId: payment.id as string,
        pixCopyPaste: qr.payload as string,
        qrCodeBase64: qr.encodedImage as string, // already base64 PNG
        expiresAt: qr.expirationDate ? new Date(qr.expirationDate).toISOString() : null as string | null,
        rawResponse: { payment, qr } as Record<string, unknown>,
    }
}

// ─── POST /api/pix — Create charge ──────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const body = await req.json()
        const { amount, description, transactionId, debtorName } = body

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
        }

        const txid = generateTxId()
        const provider = process.env.ASAAS_API_KEY ? 'asaas' : 'local'
        const pixKey = process.env.PIX_KEY || 'contato@iulemiranda.com.br'
        const merchantName = process.env.PIX_MERCHANT_NAME || 'Iule Miranda'
        const merchantCity = process.env.PIX_MERCHANT_CITY || 'Recife'
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        let pixCopyPaste: string
        let qrCodeBase64: string
        let externalId: string | null = null
        let expiresAt: string | null = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        let rawResponse: Record<string, unknown> = {}

        if (provider === 'asaas') {
            const asaas = await asaasCreateCharge(
                Number(amount),
                description || 'Pagamento IMI',
                dueDate,
                debtorName
            )
            pixCopyPaste = asaas.pixCopyPaste
            qrCodeBase64 = asaas.qrCodeBase64
            externalId = asaas.externalId
            expiresAt = asaas.expiresAt
            rawResponse = asaas.rawResponse
        } else {
            // Local EMV generation — works without any API key
            pixCopyPaste = buildPixPayload({
                pixKey,
                merchantName,
                merchantCity,
                amount: Number(amount),
                txid,
                description: description?.slice(0, 72),
            })

            const qrDataUrl = await QRCode.toDataURL(pixCopyPaste, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
            })
            // Strip "data:image/png;base64," prefix
            qrCodeBase64 = qrDataUrl.split(',')[1]
            rawResponse = { provider: 'local', pixKey, merchantName }
        }

        // Persist to DB
        const { data: charge, error: dbErr } = await supabase
            .from('pix_charges')
            .insert({
                user_id: user.id,
                transaction_id: transactionId || null,
                external_id: externalId,
                txid,
                amount: Number(amount),
                description: description || null,
                debtor_name: debtorName || null,
                status: 'active',
                pix_key: pixKey,
                pix_copy_paste: pixCopyPaste,
                qr_code_base64: qrCodeBase64,
                provider,
                expires_at: expiresAt,
                raw_response: rawResponse,
            })
            .select('id')
            .single()

        if (dbErr) {
            // Non-fatal: log but continue
            console.error('[pix] DB insert error:', dbErr.message)
        }

        return NextResponse.json({
            charge: {
                id: charge?.id ?? txid,
                txid,
                amount: Number(amount),
                description,
                pixCopyPaste,
                qrCodeBase64,
                provider,
                expiresAt,
                status: 'active',
            },
        })
    } catch (err) {
        console.error('[pix] POST error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro interno' },
            { status: 500 }
        )
    }
}

// ─── GET /api/pix — List charges ─────────────────────────────────────────────
export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const url = new URL(req.url)
        const transactionId = url.searchParams.get('transaction_id')
        const id = url.searchParams.get('id')

        let q = supabase
            .from('pix_charges')
            .select('id,txid,amount,description,status,pix_copy_paste,qr_code_base64,provider,expires_at,paid_at,debtor_name,created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (id) q = q.eq('id', id)
        if (transactionId) q = q.eq('transaction_id', transactionId)

        const { data } = await q
        return NextResponse.json({ data: data || [] })
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
