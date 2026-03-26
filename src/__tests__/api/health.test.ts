/**
 * @jest-environment node
 */

/**
 * Integration tests for /api/health route
 * Covers: status codes, JSON structure, timestamp presence
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockLimit = jest.fn()
const mockList = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: jest.fn(() => ({
      select: mockSelect,
    })),
    storage: {
      from: jest.fn(() => ({
        list: mockList,
      })),
    },
  })),
}))

import { GET } from '@/app/api/health/route'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: all services healthy
    mockLimit.mockResolvedValue({ error: null })
    mockSelect.mockReturnValue({ limit: mockLimit })
    mockList.mockResolvedValue({ error: null })

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.ANTHROPIC_API_KEY
  })

  it('returns 200 when all services are healthy', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('returns 207 when some services are degraded', async () => {
    // Database fails but storage is OK
    mockLimit.mockResolvedValue({ error: { message: 'connection refused' } })

    const res = await GET()
    // auth=true, ai=true, storage=ok, database=false => some healthy => 207
    expect(res.status).toBe(207)
  })

  it('returns JSON with status fields for each service', async () => {
    const res = await GET()
    const json = await res.json()

    expect(json).toHaveProperty('database')
    expect(json).toHaveProperty('storage')
    expect(json).toHaveProperty('auth')
    expect(json).toHaveProperty('ai')
  })

  it('response includes timestamp in ISO format', async () => {
    const res = await GET()
    const json = await res.json()

    expect(json).toHaveProperty('timestamp')
    expect(typeof json.timestamp).toBe('string')
    // Verify it is a valid ISO date string
    const parsed = new Date(json.timestamp)
    expect(parsed.getTime()).not.toBeNaN()
  })

  it('reports database=false when db query fails', async () => {
    mockLimit.mockResolvedValue({ error: { message: 'db error' } })

    const res = await GET()
    const json = await res.json()

    expect(json.database).toBe(false)
  })

  it('reports storage=false when storage list fails', async () => {
    mockList.mockResolvedValue({ error: { message: 'storage error' } })

    const res = await GET()
    const json = await res.json()

    expect(json.storage).toBe(false)
  })
})
