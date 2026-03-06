/**
 * Rate limiter tests — verifies window logic and limit enforcement
 */
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('allows first request', () => {
        const result = rateLimit(`test-ip-${Date.now()}`, { limit: 5, windowMs: 10000 })
        expect(result.success).toBe(true)
    })

    it('counts remaining correctly', () => {
        const id = `test-remaining-${Date.now()}`
        const r1 = rateLimit(id, { limit: 3, windowMs: 10000 })
        expect(r1.remaining).toBe(2)
        const r2 = rateLimit(id, { limit: 3, windowMs: 10000 })
        expect(r2.remaining).toBe(1)
    })

    it('blocks after limit is reached', () => {
        const id = `test-block-${Date.now()}`
        rateLimit(id, { limit: 2, windowMs: 10000 })
        rateLimit(id, { limit: 2, windowMs: 10000 })
        const blocked = rateLimit(id, { limit: 2, windowMs: 10000 })
        expect(blocked.success).toBe(false)
        expect(blocked.remaining).toBe(0)
    })

    it('resets after window expires', () => {
        const id = `test-reset-${Date.now()}`
        rateLimit(id, { limit: 1, windowMs: 5000 })
        const blocked = rateLimit(id, { limit: 1, windowMs: 5000 })
        expect(blocked.success).toBe(false)

        // Advance timer past window
        jest.advanceTimersByTime(6000)
        const reset = rateLimit(id, { limit: 1, windowMs: 5000 })
        expect(reset.success).toBe(true)
    })

    it('different identifiers are tracked independently', () => {
        const id1 = `test-ind-a-${Date.now()}`
        const id2 = `test-ind-b-${Date.now()}`
        rateLimit(id1, { limit: 1, windowMs: 10000 })
        rateLimit(id1, { limit: 1, windowMs: 10000 }) // blocks id1
        const r2 = rateLimit(id2, { limit: 1, windowMs: 10000 })
        expect(r2.success).toBe(true) // id2 unaffected
    })
})
