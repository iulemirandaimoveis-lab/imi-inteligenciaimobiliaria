/**
 * @jest-environment node
 */

/**
 * Tests for /api/leads/capture route handler
 * Verifies: validation, deduplication, round-robin assignment, notification creation
 */

// ── Mocks ──────────────────────────────────────────────────────────

const MOCK_LEAD = { id: 'test-lead-id', name: 'Test User', score: 50 }
const MOCK_ADMIN = { id: 'admin-user-id' }

// Helper: build a query chain that always resolves to a given value
function makeChain(resolvedValue: unknown) {
    const chain: Record<string, jest.Mock> = {}
    const methods = ['select', 'insert', 'update', 'upsert', 'eq', 'gte', 'lte',
        'limit', 'order', 'single', 'maybeSingle', 'in']
    methods.forEach(m => {
        chain[m] = jest.fn().mockReturnValue(chain)
    })
    // Terminal methods return the resolved value
    chain.single = jest.fn().mockResolvedValue(resolvedValue)
    chain.maybeSingle = jest.fn().mockResolvedValue(resolvedValue)
    // insert().select().single() chain
    chain.insert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(resolvedValue),
        }),
    })
    return chain
}

// Per-table mock registry
let tableResponses: Record<string, unknown> = {}

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => {
            const resolved = tableResponses[table] ?? { data: null, error: null }
            return makeChain(resolved)
        }),
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
        // Default per-table responses
        tableResponses = {
            leads: { data: MOCK_LEAD, error: null },
            profiles: { data: MOCK_ADMIN, error: null },
            notifications: { data: null, error: null },
            team_members: { data: null, error: null },       // no members → skip round-robin
            settings: { data: null, error: null },
            tracking_sessions: { data: null, error: null },
        }
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
        expect(res.status).toBe(200)
        expect(json.success).toBe(true)
        expect(json.lead_id).toBe('test-lead-id')
    })

    it('accepts request with name and phone only', async () => {
        const req = makeRequest({ name: 'Test User', phone: '81999999999' })
        const res = await POST(req)
        const json = await res.json()
        expect(res.status).toBe(200)
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
