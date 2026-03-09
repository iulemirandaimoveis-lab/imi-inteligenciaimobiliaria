import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Asaas event → our status mapping
const STATUS_MAP: Record<string, string> = {
    PAYMENT_RECEIVED: 'received',
    PAYMENT_CONFIRMED: 'received',
    PAYMENT_OVERDUE: 'overdue',
    PAYMENT_REFUNDED: 'refunded',
    PAYMENT_DELETED: 'cancelled',
}

export async function POST(req: Request) {
    try {
        // Validate Asaas webhook token
        const webhookToken = req.headers.get('asaas-access-token')
        if (process.env.ASAAS_WEBHOOK_TOKEN && webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
            console.warn('[pix/webhook] Invalid token')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { event, payment } = body

        // Only care about PIX payment events
        if (!event || payment?.billingType !== 'PIX') {
            return NextResponse.json({ ok: true })
        }

        const newStatus = STATUS_MAP[event]
        if (!newStatus) return NextResponse.json({ ok: true })

        // Find charge by external_id (Asaas payment ID)
        const { data: charge } = await supabaseAdmin
            .from('pix_charges')
            .select('id,transaction_id,user_id')
            .eq('external_id', payment.id)
            .single()

        if (!charge) {
            console.warn('[pix/webhook] Charge not found for payment:', payment.id)
            return NextResponse.json({ ok: true })
        }

        // Update charge status
        await supabaseAdmin
            .from('pix_charges')
            .update({
                status: newStatus,
                paid_at: newStatus === 'received' ? new Date().toISOString() : null,
                raw_response: body,
            })
            .eq('id', charge.id)

        // If received, also mark the linked financial transaction as paid
        if (newStatus === 'received' && charge.transaction_id) {
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
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('[pix/webhook] Error:', err)
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
