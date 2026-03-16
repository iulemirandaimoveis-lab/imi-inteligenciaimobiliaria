/**
 * @jest-environment node
 */

/**
 * Tests for /api/export route handler
 * Verifies: CSV output, PDF output, auth required, module validation
 */

const mockGetUser = jest.fn()
const mockSelect = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: {
            getUser: mockGetUser,
        },
        from: jest.fn(() => ({
            select: mockSelect,
        })),
    })),
}))

import { GET } from '@/app/api/export/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string>) {
    const url = new URL('http://localhost:3000/api/export')
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return new NextRequest(url)
}

describe('GET /api/export', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
        })
        mockSelect.mockReturnValue({
            not: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                    range: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                        then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 }),
                    }),
                    limit: jest.fn().mockResolvedValue({ data: [] }),
                    then: (resolve: (v: unknown) => void) => resolve({ data: [] }),
                }),
                limit: jest.fn().mockResolvedValue({ data: [] }),
                then: (resolve: (v: unknown) => void) => resolve({ data: [] }),
            }),
            order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [] }),
                then: (resolve: (v: unknown) => void) => resolve({ data: [] }),
            }),
            limit: jest.fn().mockResolvedValue({ data: [] }),
        })
    })

    it('rejects unauthenticated requests', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } })
        const req = makeRequest({ module: 'leads' })
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it('rejects unsupported modules', async () => {
        const req = makeRequest({ module: 'xyz-invalid' })
        const res = await GET(req)
        expect(res.status).toBe(400)
    })

    it('returns CSV content-type by default', async () => {
        const req = makeRequest({ module: 'leads' })
        const res = await GET(req)
        expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('returns HTML content-type for PDF format', async () => {
        const req = makeRequest({ module: 'leads', format: 'pdf' })
        const res = await GET(req)
        expect(res.headers.get('Content-Type')).toContain('text/html')
    })

    it('PDF output contains table HTML', async () => {
        const req = makeRequest({ module: 'leads', format: 'pdf' })
        const res = await GET(req)
        const body = await res.text()
        expect(body).toContain('<table>')
        expect(body).toContain('Relatório')
        expect(body).toContain('window.print()')
    })
})
