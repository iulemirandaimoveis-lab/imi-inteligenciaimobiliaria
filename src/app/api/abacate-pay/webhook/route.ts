import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/abacate-pay/webhook
// Receives billing.paid events and upgrades tenant subscription_tier
export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const secret = process.env.ABACATEPAY_WEBHOOK_SECRET

        // Validate HMAC signature
        if (secret) {
            const sig = request.headers.get('x-webhook-signature') || ''
            const expected = createHmac('sha256', secret).update(body).digest('hex')
            if (sig !== expected) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        const payload = JSON.parse(body)
        const eventType: string = payload.event || payload.type || ''

        // Only process billing paid events
        if (!['billing.paid', 'pix.paid'].includes(eventType)) {
            return NextResponse.json({ received: true, processed: false })
        }

        const transactionId: string = payload.data?.billing?.transactionId
            || payload.data?.transactionId
            || payload.transactionId
            || ''

        // Extract plan from transactionId (format: sub_professional_timestamp or sub_enterprise_timestamp)
        const planMatch = transactionId.match(/^sub_(professional|enterprise)_/)
        if (!planMatch) {
            // Not a subscription payment — forward to PIX webhook for regular handling
            return NextResponse.json({ received: true, processed: false, reason: 'Not a subscription payment' })
        }

        const newTier = planMatch[1] as 'professional' | 'enterprise'
        const amount = payload.data?.billing?.amount || payload.data?.amount || 0

        // Find which user made this payment via the billing metadata
        // AbacatePay stores customer info in the billing
        const customerEmail: string = payload.data?.billing?.customer?.email
            || payload.data?.customer?.email
            || ''

        if (!customerEmail) {
            console.error('[billing-webhook] No customer email in payload')
            return NextResponse.json({ received: true, processed: false, reason: 'No customer email' })
        }

        // Find user by email in Supabase Auth
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const user = users?.users?.find(u => u.email === customerEmail)

        if (!user) {
            console.error('[billing-webhook] User not found for email:', customerEmail)
            return NextResponse.json({ received: true, processed: false, reason: 'User not found' })
        }

        // Update user metadata with new subscription tier
        const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                subscription_tier: newTier,
                trial_ends_at: null, // Trial no longer applies
                subscription_paid_at: new Date().toISOString(),
                next_billing_at: nextBillingDate,
            },
        })

        // Update tenant table
        await supabaseAdmin
            .from('tenants')
            .update({
                subscription_tier: newTier,
                trial_ends_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('created_by', user.id)

        // Record the payment as financial transaction
        await supabaseAdmin
            .from('financial_transactions')
            .insert({
                type: 'receita',
                category: 'assinatura',
                description: `Assinatura IMI ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} — ${customerEmail}`,
                amount: amount / 100,
                due_date: new Date().toISOString().split('T')[0],
                paid_date: new Date().toISOString().split('T')[0],
                status: 'pago',
                payment_method: 'pix',
                notes: `AbacatePay transaction: ${transactionId}`,
                created_by: null,
                metadata: { transaction_id: transactionId, abacatepay_event: eventType, user_id: user.id },
            })

        console.log(`[billing-webhook] Upgraded ${customerEmail} to ${newTier}`)
        return NextResponse.json({ received: true, processed: true, user_id: user.id, tier: newTier })
    } catch (err) {
        console.error('[billing-webhook] Error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
