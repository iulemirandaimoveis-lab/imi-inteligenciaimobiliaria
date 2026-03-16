/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/abacate-pay/webhook
 * Verifies: HMAC signature validation, event filtering, subscription upgrade flow
 */

const mockListUsers = jest.fn()
const mockUpdateUserById = jest.fn()
const mockTenantUpdate = jest.fn()
const mockTenantEq = jest.fn()
const mockFinancialInsert = jest.fn()

jest.mock('@/lib/supabase/admin', () => {
    // References to outer `const` are resolved lazily via getter
    // because jest.mock factory is hoisted above const declarations
    return {
        get supabaseAdmin() {
            return {
                auth: {
                    admin: {
                        listUsers: mockListUsers,
                        updateUserById: mockUpdateUserById,
                    },
                },
                from: jest.fn((table: string) => {
                    if (table === 'tenants') {
                        return {
                            update: mockTenantUpdate,
                        }
                    }
                    if (table === 'financial_transactions') {
                        return {
                            insert: mockFinancialInsert,
                        }
                    }
                    return {}
                }),
            }
        },
    }
})

import { POST } from '@/app/api/abacate-pay/webhook/route'
import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

function makeWebhookRequest(body: object, secret?: string) {
    const bodyStr = JSON.stringify(body)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    if (secret) {
        const sig = createHmac('sha256', secret).update(bodyStr).digest('hex')
        headers['x-webhook-signature'] = sig
    }

    return new NextRequest('http://localhost:3000/api/abacate-pay/webhook', {
        method: 'POST',
        body: bodyStr,
        headers,
    })
}

describe('POST /api/abacate-pay/webhook', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv, ABACATEPAY_WEBHOOK_SECRET: 'test-secret-key' }

        mockTenantEq.mockResolvedValue({ data: null, error: null })
        mockTenantUpdate.mockReturnValue({ eq: mockTenantEq })
        mockFinancialInsert.mockResolvedValue({ data: null, error: null })
        mockUpdateUserById.mockResolvedValue({ data: null, error: null })
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('returns 401 when signature is invalid', async () => {
        const body = { event: 'billing.paid', data: {} }
        const bodyStr = JSON.stringify(body)

        const req = new NextRequest('http://localhost:3000/api/abacate-pay/webhook', {
            method: 'POST',
            body: bodyStr,
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': 'invalid-signature',
            },
        })

        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(401)
        expect(json.error).toBe('Invalid signature')
    })

    it('returns processed:false for non-subscription events', async () => {
        const body = { event: 'customer.created', data: {} }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.received).toBe(true)
        expect(json.processed).toBe(false)
    })

    it('returns processed:false when transactionId is not a subscription payment', async () => {
        const body = {
            event: 'billing.paid',
            data: {
                billing: {
                    transactionId: 'regular_payment_123',
                    customer: { email: 'user@test.com' },
                },
            },
        }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.processed).toBe(false)
        expect(json.reason).toBe('Not a subscription payment')
    })

    it('returns processed:false when customer email is missing', async () => {
        const body = {
            event: 'billing.paid',
            data: {
                billing: {
                    transactionId: 'sub_professional_1234567890',
                },
            },
        }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.processed).toBe(false)
        expect(json.reason).toBe('No customer email')
    })

    it('returns processed:false when user is not found by email', async () => {
        mockListUsers.mockResolvedValue({
            data: { users: [{ id: 'other-user', email: 'other@test.com', user_metadata: {} }] },
        })

        const body = {
            event: 'billing.paid',
            data: {
                billing: {
                    transactionId: 'sub_professional_1234567890',
                    amount: 9900,
                    customer: { email: 'notfound@test.com' },
                },
            },
        }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.processed).toBe(false)
        expect(json.reason).toBe('User not found')
    })

    it('processes valid professional subscription payment', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'buyer@test.com',
            user_metadata: { subscription_tier: 'starter', trial_ends_at: '2024-01-01' },
        }
        mockListUsers.mockResolvedValue({
            data: { users: [mockUser] },
        })

        const body = {
            event: 'billing.paid',
            data: {
                billing: {
                    transactionId: 'sub_professional_1234567890',
                    amount: 9900,
                    customer: { email: 'buyer@test.com' },
                },
            },
        }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.received).toBe(true)
        expect(json.processed).toBe(true)
        expect(json.user_id).toBe('user-123')
        expect(json.tier).toBe('professional')

        // Verify user metadata was updated
        expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
            user_metadata: expect.objectContaining({
                subscription_tier: 'professional',
                trial_ends_at: null,
            }),
        })

        // Verify tenant table was updated
        expect(mockTenantUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription_tier: 'professional',
                trial_ends_at: null,
            })
        )
        expect(mockTenantEq).toHaveBeenCalledWith('created_by', 'user-123')

        // Verify financial transaction was recorded
        expect(mockFinancialInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'receita',
                category: 'assinatura',
                amount: 99,
                status: 'pago',
                payment_method: 'pix',
            })
        )
    })

    it('processes valid enterprise subscription payment via pix.paid event', async () => {
        const mockUser = {
            id: 'user-456',
            email: 'enterprise@test.com',
            user_metadata: {},
        }
        mockListUsers.mockResolvedValue({
            data: { users: [mockUser] },
        })

        const body = {
            event: 'pix.paid',
            data: {
                billing: {
                    transactionId: 'sub_enterprise_9999999',
                    amount: 29900,
                    customer: { email: 'enterprise@test.com' },
                },
            },
        }
        const req = makeWebhookRequest(body, 'test-secret-key')
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.processed).toBe(true)
        expect(json.tier).toBe('enterprise')
    })
})
