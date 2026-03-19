/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/email/sequences.ts
 * Covers: enrollInSequence, processEmailSequences, cancelEnrollment
 */

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

// Build chainable mock
function chainable() {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
  return chain
}

let mockChains: any[] = []
let chainIdx = 0

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: jest.fn((table: string) => {
      const chain = mockChains[chainIdx] || chainable()
      chainIdx++
      return chain
    }),
  })),
}))

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
    },
  })),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockChains = []
  chainIdx = 0
})

import { enrollInSequence, cancelEnrollment, processEmailSequences } from '@/lib/email/sequences'

describe('enrollInSequence', () => {
  it('returns error when lead is already enrolled', async () => {
    // First chain: check existing -> returns existing enrollment
    const checkChain = chainable()
    checkChain.single.mockResolvedValue({ data: { id: 'existing-1' }, error: null })
    mockChains = [checkChain]

    const result = await enrollInSequence({ sequence_id: 'seq-1', lead_id: 'lead-1' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Already enrolled')
  })

  it('creates enrollment when lead is not yet enrolled', async () => {
    // First chain: check existing -> no existing enrollment
    const checkChain = chainable()
    checkChain.single.mockResolvedValue({ data: null, error: null })

    // Second chain: insert enrollment
    const insertChain = chainable()
    insertChain.single.mockResolvedValue({
      data: { id: 'enroll-1', sequence_id: 'seq-1', lead_id: 'lead-1', current_step: 0, status: 'active' },
      error: null,
    })

    mockChains = [checkChain, insertChain]

    const result = await enrollInSequence({ sequence_id: 'seq-1', lead_id: 'lead-1' })
    expect(result.success).toBe(true)
    expect(result.enrollment).toBeDefined()
    expect(result.enrollment.current_step).toBe(0)
  })

  it('returns error when insert fails', async () => {
    const checkChain = chainable()
    checkChain.single.mockResolvedValue({ data: null, error: null })

    const insertChain = chainable()
    insertChain.single.mockResolvedValue({
      data: null,
      error: { message: 'DB constraint violation' },
    })

    mockChains = [checkChain, insertChain]

    const result = await enrollInSequence({ sequence_id: 'seq-1', lead_id: 'lead-1' })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('processEmailSequences', () => {
  it('returns zeros when there are no active enrollments', async () => {
    const enrollChain = chainable()
    enrollChain.eq = jest.fn().mockResolvedValue({ data: null, error: null })
    mockChains = [enrollChain]

    const result = await processEmailSequences()
    expect(result).toEqual({ processed: 0, sent: 0, errors: 0 })
  })

  it('marks enrollment as completed when current_step >= emails length', async () => {
    const enrollChain = chainable()
    enrollChain.eq = jest.fn().mockResolvedValue({
      data: [{
        id: 'enroll-1',
        current_step: 3,
        sequence: { emails: [{}, {}, {}], tenant_id: 't1' },
        lead: { id: 'lead-1', email: 'test@test.com', name: 'Test' },
        last_email_sent_at: null,
        enrolled_at: new Date(Date.now() - 100000).toISOString(),
        lead_id: 'lead-1',
      }],
      error: null,
    })

    // Update chain for marking complete
    const updateChain = chainable()
    updateChain.eq = jest.fn().mockResolvedValue({ data: null, error: null })

    mockChains = [enrollChain, updateChain]

    const result = await processEmailSequences()
    expect(result.processed).toBe(1)
    expect(result.sent).toBe(0)
  })

  it('skips enrollment when delay has not passed', async () => {
    const enrollChain = chainable()
    enrollChain.eq = jest.fn().mockResolvedValue({
      data: [{
        id: 'enroll-1',
        current_step: 0,
        sequence: {
          emails: [{ delay_hours: 24, subject: 'Welcome', body_html: '<p>Hi</p>' }],
          tenant_id: 't1',
        },
        lead: { id: 'lead-1', email: 'test@test.com', name: 'Test' },
        last_email_sent_at: new Date().toISOString(), // just sent
        enrolled_at: new Date().toISOString(),
        lead_id: 'lead-1',
      }],
      error: null,
    })

    mockChains = [enrollChain]

    const result = await processEmailSequences()
    expect(result.processed).toBe(1)
    expect(result.sent).toBe(0)
  })
})

describe('cancelEnrollment', () => {
  it('calls update with cancelled status', async () => {
    const updateChain = chainable()
    updateChain.eq = jest.fn().mockResolvedValue({ data: null, error: null })
    mockChains = [updateChain]

    const result = await cancelEnrollment('enroll-1')
    expect(result.success).toBe(true)
  })

  it('throws when supabase returns an error', async () => {
    const updateChain = chainable()
    updateChain.eq = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    mockChains = [updateChain]

    await expect(cancelEnrollment('bad-id')).rejects.toEqual({ message: 'Not found' })
  })
})
