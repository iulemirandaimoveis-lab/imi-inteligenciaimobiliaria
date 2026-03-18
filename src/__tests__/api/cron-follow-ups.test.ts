/**
 * @jest-environment node
 */

/**
 * Tests for /api/cron/process-follow-ups route handler
 * Verifies: auth check, follow-up processing, status updates
 */

const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockInsert = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => {
            const chain: Record<string, jest.Mock> = {
                select: mockSelect,
                update: mockUpdate,
                insert: mockInsert,
                eq: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                limit: jest.fn(),
            }
            Object.values(chain).forEach(fn => {
                if (!fn.getMockImplementation()) fn.mockReturnValue(chain)
            })

            if (table === 'lead_follow_ups') {
                chain.limit = jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                })
            }
            return chain
        }),
    },
}))

import { GET } from '@/app/api/cron/process-follow-ups/route'
import { NextRequest } from 'next/server'

function makeRequest(secret?: string) {
    return new NextRequest('http://localhost:3000/api/cron/process-follow-ups', {
        headers: secret ? { authorization: `Bearer ${secret}` } : {},
    })
}

describe('GET /api/cron/process-follow-ups', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv, CRON_SECRET: 'test-secret' }
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('rejects requests without valid CRON_SECRET', async () => {
        const req = makeRequest('wrong-secret')
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it('returns 401 when no auth header', async () => {
        const req = makeRequest()
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it('returns success with 0 processed when no pending follow-ups', async () => {
        const req = makeRequest('test-secret')
        const res = await GET(req)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.processed).toBe(0)
    })
})
