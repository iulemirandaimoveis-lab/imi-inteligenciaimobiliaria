/**
 * LeadsService unit tests — mocks Supabase client to test business logic in isolation
 */
import { LeadsService } from '@/services/leads.service'

// Mock Supabase builder chain
function makeMockSupabase(resolveWith: object) {
    const chain = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(resolveWith),
        maybeSingle: jest.fn().mockResolvedValue(resolveWith),
    }
    // Make the chain thenable at the end of a range/order call
    Object.defineProperty(chain, 'then', {
        get: () => (resolve: (v: unknown) => void) => resolve(resolveWith),
    })
    const from = jest.fn().mockReturnValue(chain)
    return { from, _chain: chain } as unknown as { from: jest.Mock; _chain: typeof chain }
}

describe('LeadsService.list', () => {
    it('calls .not("status", "eq", "archived") to exclude archived leads', async () => {
        const mock = makeMockSupabase({ data: [], error: null, count: 0 })
        const service = new LeadsService(mock as any)
        await service.list()
        expect(mock._chain.not).toHaveBeenCalledWith('status', 'eq', 'archived')
    })

    it('applies status filter when provided', async () => {
        const mock = makeMockSupabase({ data: [], error: null, count: 0 })
        const service = new LeadsService(mock as any)
        await service.list({ status: 'qualified' })
        expect(mock._chain.eq).toHaveBeenCalledWith('status', 'qualified')
    })

    it('uses correct pagination range', async () => {
        const mock = makeMockSupabase({ data: [], error: null, count: 0 })
        const service = new LeadsService(mock as any)
        await service.list({ page: 2, limit: 10 })
        expect(mock._chain.range).toHaveBeenCalledWith(10, 19)
    })

    it('defaults to page 1 with limit 50', async () => {
        const mock = makeMockSupabase({ data: [], error: null, count: 0 })
        const service = new LeadsService(mock as any)
        await service.list()
        expect(mock._chain.range).toHaveBeenCalledWith(0, 49)
    })
})

describe('LeadsService.archive', () => {
    it('sets status to archived, not deletes', async () => {
        const updateChain = {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        }
        const from = jest.fn().mockReturnValue(updateChain)
        const service = new LeadsService({ from } as any)
        await service.archive('test-id')
        expect(updateChain.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'archived' })
        )
    })
})

describe('LeadsService.kpis', () => {
    it('returns zeroes when no data', async () => {
        const mock = makeMockSupabase({ data: null, error: new Error('no data') })
        const service = new LeadsService(mock as any)
        const result = await service.kpis()
        expect(result.total).toBe(0)
        expect(result.conversionRate).toBe(0)
    })

    it('correctly computes conversion rate', async () => {
        const data = [
            { status: 'new', capital: 0 },
            { status: 'won', capital: 500000 },
            { status: 'won', capital: 300000 },
            { status: 'lost', capital: 0 },
        ]
        const mockChain = {
            select: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({ data, error: null }),
        }
        const service = new LeadsService({ from: jest.fn().mockReturnValue(mockChain) } as any)
        const result = await service.kpis()
        expect(result.total).toBe(4)
        expect(result.won).toBe(2)
        expect(result.conversionRate).toBe(50)
        expect(result.totalValue).toBe(800000)
    })
})
