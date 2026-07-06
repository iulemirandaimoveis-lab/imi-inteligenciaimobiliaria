/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockIsFinanceAdmin = jest.fn()
const mockIsFinanceManager = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

jest.mock('@/lib/finance/auth', () => ({
    isFinanceAdmin: (...args: unknown[]) => mockIsFinanceAdmin(...args),
    isFinanceManager: (...args: unknown[]) => mockIsFinanceManager(...args),
}))

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn(() => ({
            select: mockSelect,
            insert: mockInsert,
        })),
    },
}))

import { GET, POST } from '@/app/api/finance/bank-accounts/route'
import { NextRequest } from 'next/server'

function makePostRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/finance/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

describe('/api/finance/bank-accounts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockSelect.mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [], error: null }) })
        mockInsert.mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'acc-1' }, error: null }),
            }),
        })
    })

    describe('GET', () => {
        it('rejects unauthenticated requests', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null } })
            const res = await GET()
            expect(res.status).toBe(401)
        })

        it('rejects users without finance manager role', async () => {
            mockIsFinanceManager.mockResolvedValueOnce(false)
            const res = await GET()
            expect(res.status).toBe(403)
        })

        it('returns account list for finance managers', async () => {
            mockIsFinanceManager.mockResolvedValueOnce(true)
            const res = await GET()
            expect(res.status).toBe(200)
        })
    })

    describe('POST', () => {
        it('rejects unauthenticated requests', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null } })
            const res = await POST(makePostRequest({ label: 'x', holder_type: 'pj' }))
            expect(res.status).toBe(401)
        })

        it('rejects finance managers who are not full admins (credential-sensitive)', async () => {
            mockIsFinanceAdmin.mockResolvedValueOnce(false)
            const res = await POST(makePostRequest({ label: 'x', holder_type: 'pj' }))
            expect(res.status).toBe(403)
        })

        it('rejects invalid payloads', async () => {
            mockIsFinanceAdmin.mockResolvedValueOnce(true)
            const res = await POST(makePostRequest({ label: '' }))
            expect(res.status).toBe(400)
        })

        it('creates an account for finance admins with a valid payload', async () => {
            mockIsFinanceAdmin.mockResolvedValueOnce(true)
            const res = await POST(makePostRequest({ label: 'BTG PJ — IMI', holder_type: 'pj', provider: 'btg_empresas_api', env_prefix: 'BTG_PJ' }))
            expect(res.status).toBe(201)
        })
    })
})
