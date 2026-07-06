/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockIsFinanceManager = jest.fn()
const tableMocks: Record<string, unknown> = {}

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({ auth: { getUser: mockGetUser } })),
}))

jest.mock('@/lib/finance/auth', () => ({
    isFinanceAdmin: jest.fn(),
    isFinanceManager: (...args: unknown[]) => mockIsFinanceManager(...args),
}))

jest.mock('@/lib/supabase/admin', () => ({
    supabaseAdmin: { from: jest.fn((table: string) => tableMocks[table]) },
}))

import { GET, POST } from '@/app/api/finance/commissions/reconciliation/route'
import { NextRequest } from 'next/server'

function makeGetRequest(qs = '') {
    return new NextRequest(`http://localhost:3000/api/finance/commissions/reconciliation${qs}`)
}
function makePostRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/finance/commissions/reconciliation', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

describe('/api/finance/commissions/reconciliation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockIsFinanceManager.mockResolvedValue(true)
    })

    describe('GET', () => {
        it('rejects unauthenticated requests', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null } })
            const res = await GET(makeGetRequest())
            expect(res.status).toBe(401)
        })

        it('rejects non-manager roles', async () => {
            mockIsFinanceManager.mockResolvedValueOnce(false)
            const res = await GET(makeGetRequest())
            expect(res.status).toBe(403)
        })

        it('returns pending repasses with stats for finance managers', async () => {
            tableMocks.commission_repasses = {
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                            data: [{
                                id: 'r1', agency_id: 'a1', empreendimento_nome: 'AB',
                                cliente_nome: 'Cliente X', valor_venda: 100000,
                                valor_comissao_bruta: 5000, valor_repasse_liquido: 5000,
                                status: 'repasse_disponivel', data_venda: '2026-07-01',
                                data_repasse_prevista: '2026-07-05', data_repasse_realizada: null,
                                partner_agencies: { name: 'Mano Imóveis', cnpj: '09.856.046/0001-43' },
                            }],
                            error: null,
                        }),
                    }),
                    eq: jest.fn().mockReturnThis(),
                }),
            }
            tableMocks.bank_transactions = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            }
            tableMocks.commission_reconciliations = {
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: [] }),
                    }),
                }),
            }

            const res = await GET(makeGetRequest())
            expect(res.status).toBe(200)
            const json = await res.json()
            expect(json.pending).toHaveLength(1)
            expect(json.pending[0].agency_name).toBe('Mano Imóveis')
            expect(json.stats.pendentes).toBe(1)
        })
    })

    describe('POST', () => {
        it('rejects unauthenticated requests', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null } })
            const res = await POST(makePostRequest({ action: 'confirm' }))
            expect(res.status).toBe(401)
        })

        it('rejects invalid action', async () => {
            const res = await POST(makePostRequest({ action: 'bogus' }))
            expect(res.status).toBe(400)
        })

        it('requires repasse_id and bank_transaction_id for confirm', async () => {
            const res = await POST(makePostRequest({ action: 'confirm' }))
            expect(res.status).toBe(400)
        })

        it('refuses to confirm against an already-reconciled transaction', async () => {
            tableMocks.bank_transactions = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'tx1', transaction_date: '2026-07-05', reconciled: true },
                            error: null,
                        }),
                    }),
                }),
            }
            const res = await POST(makePostRequest({ action: 'confirm', repasse_id: '11111111-1111-1111-1111-111111111111', bank_transaction_id: '22222222-2222-2222-2222-222222222222' }))
            expect(res.status).toBe(409)
        })

        it('confirms a match and marks the repasse as repassado', async () => {
            tableMocks.bank_transactions = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'tx1', transaction_date: '2026-07-05', reconciled: false },
                            error: null,
                        }),
                    }),
                }),
                update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
            }
            tableMocks.commission_reconciliations = {
                upsert: jest.fn().mockResolvedValue({ error: null }),
            }
            tableMocks.commission_repasses = {
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: '11111111-1111-1111-1111-111111111111', status: 'repassado' },
                                error: null,
                            }),
                        }),
                    }),
                }),
            }

            const res = await POST(makePostRequest({ action: 'confirm', repasse_id: '11111111-1111-1111-1111-111111111111', bank_transaction_id: '22222222-2222-2222-2222-222222222222' }))
            expect(res.status).toBe(200)
            const json = await res.json()
            expect(json.data.status).toBe('repassado')
        })
    })
})
