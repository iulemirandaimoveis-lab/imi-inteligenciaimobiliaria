import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── AbacatePay HMAC-SHA256 signature validation ─────────────────────────────
async function validateAbacateSignature(req: Request, rawBody: string): Promise<boolean> {
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET
    if (!secret) {
        console.warn('ABACATEPAY_WEBHOOK_SECRET not set — rejecting webhook for security')
        return false
    }

    const signature = req.headers.get('x-webhook-signature')
    if (!signature) return false

    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

    try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
        return false
    }
}

// ─── Asaas event → our status mapping ────────────────────────────────────────
const ASAAS_STATUS_MAP: Record<string, string> = {
    PAYMENT_RECEIVED: 'received',
    PAYMENT_CONFIRMED: 'received',
    PAYMENT_OVERDUE: 'overdue',
    PAYMENT_REFUNDED: 'refunded',
    PAYMENT_DELETED: 'cancelled',
}

// ─── AbacatePay event → our status mapping ───────────────────────────────────
const ABACATE_STATUS_MAP: Record<string, string> = {
    'pix.paid': 'received',
    'pix.expired': 'overdue',
    'billing.paid': 'received',
}

// ─── Shared: update charge + linked transaction ───────────────────────────────
async function applyChargeUpdate(externalId: string, newStatus: string, rawBody: unknown) {
    const { data: charge } = await supabaseAdmin
        .from('pix_charges')
        .select('id,transaction_id,user_id')
        .eq('external_id', externalId)
        .single()

    if (!charge) {
        console.warn('[pix/webhook] Charge not found for external_id:', externalId)
        return
    }

    await supabaseAdmin
        .from('pix_charges')
        .update({
            status: newStatus,
            paid_at: newStatus === 'received' ? new Date().toISOString() : null,
            raw_response: rawBody as Record<string, unknown>,
        })
        .eq('id', charge.id)

    if (newStatus === 'received' && charge.transaction_id) {
        await supabaseAdmin
            .from('financial_transactions')
            .update({
                status: 'pago',
                paid_date: new Date().toISOString().split('T')[0],
                payment_method: 'pix',
            })
            .eq('id', charge.transaction_id)

        // Also try legacy transactions table
        await supabaseAdmin
            .from('transactions')
            .update({
                status: 'pago',
                paid_date: new Date().toISOString().split('T')[0],
                payment_method: 'pix',
            })
            .eq('id', charge.transaction_id)
    }

    console.log('[pix/webhook] Updated charge', charge.id, '→', newStatus)
}

export async function POST(req: Request) {
    try {
        // Read raw body once (needed for HMAC validation)
        const rawBody = await req.text()
        const body = JSON.parse(rawBody) as Record<string, unknown>

        // ── AbacatePay webhook ──────────────────────────────────────────────
        // Payload: { event: "pix.paid", data: { id: "pix_char_..." } }
        if (body.event && (body.event as string).includes('.')) {
            // Validate HMAC-SHA256 signature
            const valid = await validateAbacateSignature(req, rawBody)
            if (!valid) {
                console.warn('[pix/webhook] Invalid AbacatePay signature')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const newStatus = ABACATE_STATUS_MAP[body.event as string]
            if (!newStatus) return NextResponse.json({ ok: true })

            const chargeId = (body.data as Record<string, unknown>)?.id as string | undefined
            if (!chargeId) return NextResponse.json({ ok: true })

            await applyChargeUpdate(chargeId, newStatus, body)
            return NextResponse.json({ ok: true })
        }

        // ── Asaas webhook ───────────────────────────────────────────────────
        const webhookToken = req.headers.get('asaas-access-token')
        if (process.env.ASAAS_WEBHOOK_TOKEN && webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
            console.warn('[pix/webhook] Invalid Asaas token')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { event, payment } = body as { event?: string; payment?: { billingType?: string; id?: string } }
        if (!event || payment?.billingType !== 'PIX') {
            return NextResponse.json({ ok: true })
        }

        const newStatus = ASAAS_STATUS_MAP[event]
        if (!newStatus) return NextResponse.json({ ok: true })

        await applyChargeUpdate(payment.id as string, newStatus, body)
        return NextResponse.json({ ok: true })

    } catch (err) {
        console.error('[pix/webhook] Error:', err)
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
