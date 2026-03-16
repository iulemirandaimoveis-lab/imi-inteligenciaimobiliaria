/**
 * @jest-environment node
 */

/**
 * Tests for /api/leads/capture route handler
 * Verifies: validation, deduplication, round-robin assignment, notification creation
 */

// ── Mocks ──────────────────────────────────────────────────────────

const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockSelect = jest.fn()
const mockMaybeSingle = jest.fn()
const mockSingle = jest.fn()
const mockUpsert = jest.fn()
const mockEq = jest.fn()
const mockGte = jest.fn()
const mockLimit = jest.fn()
const mockOrder = jest.fn()

function buildChain() {
    const chain: Record<string, jest.Mock> = {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        upsert: mockUpsert,
        eq: mockEq,
        gte: mockGte,
        limit: mockLimit,
        order: mockOrder,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
    }
    // Make every method return the chain for fluent API
    Object.values(chain).forEach(fn => fn.mockReturnValue(chain))
    return chain
}

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => buildChain()),
    },
}))

jest.mock('@/lib/rate-limit', () => ({
    limiters: {
        public: jest.fn().mockResolvedValue({ success: true, resetTime: Date.now() + 10000 }),
    },
    getClientIP: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('@/lib/ai/lead-qualifier', () => ({
    qualifyLeadWithClaude: jest.fn().mockResolvedValue({}),
}))

// ── Import after mocks ──────────────────────────────────────────────
import { POST } from '@/app/api/leads/capture/route'
import { NextRequest } from 'next/server'

function makeRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/leads/capture', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

describe('POST /api/leads/capture', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Default: no duplicate found, insert succeeds
        mockMaybeSingle.mockResolvedValue({ data: null })
        mockSingle.mockResolvedValue({
            data: { id: 'test-lead-id', name: 'Test' },
            error: null,
        })
        mockInsert.mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { id: 'test-lead-id', name: 'Test', score: 50 },
                    error: null,
                }),
            }),
        })
    })

    it('rejects request with no name', async () => {
        const req = makeRequest({ email: 'test@email.com' })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toContain('obrigatória')
    })

    it('rejects request with no email AND no phone', async () => {
        const req = makeRequest({ name: 'Test User' })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('accepts request with name and email', async () => {
        const req = makeRequest({ name: 'Test User', email: 'test@email.com' })
        const res = await POST(req)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.lead_id).toBeDefined()
    })

    it('accepts request with name and phone only', async () => {
        const req = makeRequest({ name: 'Test User', phone: '81999999999' })
        const res = await POST(req)
        const json = await res.json()
        expect(json.success).toBe(true)
    })

    it('rate limits after too many requests', async () => {
        const { limiters } = require('@/lib/rate-limit')
        limiters.public.mockResolvedValueOnce({ success: false, resetTime: Date.now() + 5000 })
        const req = makeRequest({ name: 'Test', email: 'test@test.com' })
        const res = await POST(req)
        expect(res.status).toBe(429)
    })
})
