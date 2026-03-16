/**
 * @jest-environment node
 */

/**
 * Tests for /api/financeiro/comissao
 * Verifies: commission calculation, split logic, default percentages
 */

const mockGetUser = jest.fn()
const mockInsert = jest.fn()
const mockSettingsSelect = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: {
            getUser: mockGetUser,
        },
    })),
}))

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: {
        from: jest.fn((table: string) => {
            if (table === 'settings') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: mockSettingsSelect,
                        }),
                    }),
                }
            }
            if (table === 'financial_transactions') {
                return {
                    insert: mockInsert,
                }
            }
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() }
        }),
    },
}))

import { POST } from '@/app/api/financeiro/comissao/route'
import { NextRequest } from 'next/server'

function makeRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/financeiro/comissao', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

describe('POST /api/financeiro/comissao', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        })
        mockSettingsSelect.mockResolvedValue({
            data: { value: '5' },
        })
        mockInsert.mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                    data: { id: 'txn-1', amount: 50000, category: 'comissao' },
                    error: null,
                }),
            }),
        })
    })

    it('rejects unauthenticated requests', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'No session' } })
        const req = makeRequest({ valor_venda: 1000000 })
        const res = await POST(req)
        expect(res.status).toBe(401)
    })

    it('rejects invalid valor_venda', async () => {
        const req = makeRequest({ valor_venda: 0 })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('rejects negative valor_venda', async () => {
        const req = makeRequest({ valor_venda: -100 })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it('calculates commission with provided percentage', async () => {
        const req = makeRequest({ valor_venda: 1000000, percentual_comissao: 6 })
        const res = await POST(req)
        const json = await res.json()
        expect(res.status).toBe(201)
        expect(json.success).toBe(true)
        expect(json.comissao_total).toBe(60000)
        expect(json.percentual).toBe(6)
    })

    it('uses default 5% from settings when no percentage provided', async () => {
        const req = makeRequest({ valor_venda: 500000 })
        const res = await POST(req)
        const json = await res.json()
        expect(json.comissao_total).toBe(25000)
        expect(json.percentual).toBe(5)
    })

    it('creates split transactions when splits provided', async () => {
        const req = makeRequest({
            valor_venda: 1000000,
            percentual_comissao: 5,
            splits: [
                { user_id: 'agent-1', nome: 'Agent A', percentual: 60 },
                { user_id: 'agent-2', nome: 'Agent B', percentual: 40 },
            ],
        })
        const res = await POST(req)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.comissao_total).toBe(50000)
        // Should have called insert twice (one per split)
        expect(mockInsert).toHaveBeenCalledTimes(2)
    })
})
