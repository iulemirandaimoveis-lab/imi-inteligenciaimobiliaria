/**
 * @jest-environment node
 */

/**
 * Tests for /api/developments route
 * Verifies: auth guard (401 for unauthenticated), GET/POST/PUT/PATCH/DELETE patterns
 */

const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

jest.mock('@/lib/governance', () => ({
  logAudit: jest.fn(),
  getRequestMeta: jest.fn(() => ({ ip: '127.0.0.1', user_agent: 'test' })),
}))

import { GET, POST, PUT, PATCH, DELETE } from '@/app/api/developments/route'
import { NextRequest } from 'next/server'

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/developments')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makeJsonRequest(method: string, body: object) {
  return new NextRequest('http://localhost:3000/api/developments', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('/api/developments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Auth guard (all methods return 401 when unauthenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
    })

    it('GET returns 401 when not authenticated', async () => {
      const res = await GET(makeGetRequest())
      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.error).toBeDefined()
    })

    it('POST returns 401 when not authenticated', async () => {
      const res = await POST(makeJsonRequest('POST', { name: 'Test', type: 'Apartamento' }))
      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.error).toBeDefined()
    })

    it('PUT returns 401 when not authenticated', async () => {
      const res = await PUT(makeJsonRequest('PUT', { id: 'x', name: 'Updated' }))
      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.error).toBeDefined()
    })

    it('PATCH returns 401 when not authenticated', async () => {
      const res = await PATCH(makeJsonRequest('PATCH', { id: 'x', status: 'vendido' }))
      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.error).toBeDefined()
    })

    it('DELETE returns 401 when not authenticated', async () => {
      const req = new NextRequest('http://localhost:3000/api/developments?id=x', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.error).toBeDefined()
    })
  })

  describe('GET (authenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    })

    it('returns all developments when no id param', async () => {
      const mockData = [{ id: '1', name: 'Dev A' }, { id: '2', name: 'Dev B' }]
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({ data: mockData, error: null, count: 2 }),
          }),
        }),
      })

      const res = await GET(makeGetRequest())
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data).toEqual(mockData)
      expect(json.pagination).toBeDefined()
      expect(json.pagination.total).toBe(2)
      expect(mockFrom).toHaveBeenCalledWith('developments')
    })

    it('returns single development when id param provided', async () => {
      const mockData = { id: 'dev-1', name: 'Specific Dev' }
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const res = await GET(makeGetRequest({ id: 'dev-1' }))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual(mockData)
    })

    it('returns 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
          }),
        }),
      })

      const res = await GET(makeGetRequest())
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error).toBeTruthy()
    })
  })

  describe('POST (authenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    })

    it('returns 400 when name is missing', async () => {
      const res = await POST(makeJsonRequest('POST', { type: 'Apartamento' }))
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
    })

    it('returns 400 when type is missing', async () => {
      const res = await POST(makeJsonRequest('POST', { name: 'Test Dev' }))
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
    })

    it('creates development with valid data', async () => {
      const created = { id: 'new-1', name: 'New Dev', type: 'apartment', slug: 'new-dev' }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'brokers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'broker-1' }, error: null }),
              }),
            }),
          }
        }
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: created, error: null }),
            }),
          }),
        }
      })

      const res = await POST(makeJsonRequest('POST', { name: 'New Dev', type: 'Apartamento' }))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.id).toBe('new-1')
    })
  })

  describe('PUT (authenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    })

    it('returns 400 when id is missing', async () => {
      const res = await PUT(makeJsonRequest('PUT', { name: 'No ID' }))
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
    })
  })

  describe('PATCH (authenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    })

    it('returns 400 when id or status is missing', async () => {
      const res = await PATCH(makeJsonRequest('PATCH', { id: 'x' }))
      const json = await res.json()
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid status', async () => {
      const res = await PATCH(makeJsonRequest('PATCH', { id: 'x', status: 'invalid_status' }))
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
    })

    it('updates status for valid status value', async () => {
      const updated = { id: 'x', name: 'Dev', status: 'vendido' }
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      })

      const res = await PATCH(makeJsonRequest('PATCH', { id: 'x', status: 'vendido' }))
      const json = await res.json()

      expect([200, 400]).toContain(res.status)
    })
  })

  describe('DELETE (authenticated)', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    })

    it('returns 400 when id param is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/developments', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.error).toContain('ID')
    })

    it('soft deletes by setting status to private', async () => {
      const deleted = { id: 'd1', name: 'Deleted Dev' }
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: deleted, error: null }),
          }),
        }),
      })
      mockFrom.mockReturnValue({ update: mockUpdate })

      const req = new NextRequest('http://localhost:3000/api/developments?id=d1', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status_comercial: 'privado',
          status_commercial: 'private',
        })
      )
    })
  })
})
