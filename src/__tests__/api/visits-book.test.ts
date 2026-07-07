/**
 * @jest-environment node
 */

/**
 * POST /api/visits/book — agenda uma visita a partir do calendário do corretor.
 * Rota pública: valida o horário, cria sala de vídeo (modo vídeo), persiste
 * best-effort e notifica cliente + corretor por WhatsApp. Nunca deixa o cliente
 * sem confirmação — mesmo com banco/gateway indisponível.
 */

const mockRateLimit: jest.Mock = jest.fn(async () => ({ success: true }))
const mockCreateVideoRoom: jest.Mock = jest.fn(async () => ({ url: 'https://meet.jit.si/IMIabc', name: 'IMIabc', provider: 'jitsi' }))
const mockNotifyVisit: jest.Mock = jest.fn(async () => ({ clientNotified: true, brokerNotified: true, teamNotified: 0 }))
const mockCreateNotification: jest.Mock = jest.fn(async () => {})
const mockCreateCalendarEvent: jest.Mock = jest.fn(async () => null)

// Supabase admin encadeável: storage + from().insert().select().single().
const insertSingle = jest.fn(async () => ({ data: { id: 'row-1', token: 'tok-123' }, error: null }))
const mockFrom = jest.fn(() => ({
  select: () => ({
    in: () => ({ eq: () => ({ ilike: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
  }),
  insert: () => ({ select: () => ({ single: insertSingle }) }),
  update: () => ({ eq: async () => ({ data: null, error: null }) }),
}))
const mockStorageFrom = jest.fn(() => ({
  upload: async () => ({ error: null }),
  createSignedUrl: async () => ({ data: { signedUrl: 'https://signed/visita.ics' } }),
}))

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: () => mockFrom(),
    storage: {
      getBucket: async () => ({ data: { name: 'visit-invites' } }),
      createBucket: async () => ({ data: {}, error: null }),
      from: () => mockStorageFrom(),
    },
  },
}))
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (...a: unknown[]) => mockRateLimit(...a),
  getClientIP: () => '10.0.0.1',
}))
jest.mock('@/lib/video-call/provider', () => ({ createVideoRoom: (...a: unknown[]) => mockCreateVideoRoom(...a) }))
jest.mock('@/lib/notifications/visit-notifications', () => ({ notifyVisitBooking: (...a: unknown[]) => mockNotifyVisit(...a) }))
jest.mock('@/lib/notifications', () => ({ createNotification: (...a: unknown[]) => mockCreateNotification(...a) }))
jest.mock('@/lib/scheduling/google-calendar', () => ({ createCalendarEvent: (...a: unknown[]) => mockCreateCalendarEvent(...a) }))
jest.mock('nanoid', () => ({ nanoid: (n?: number) => 'x'.repeat(n ?? 12) }))

import { POST } from '@/app/api/visits/book/route'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/visits/book', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// Horário futuro válido (30 dias à frente, 09:00 Recife).
const FUTURE = (() => {
  const d = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T09:00:00-03:00`
})()

const VALID = {
  developmentName: 'Alto Bellevue',
  developmentSlug: 'alto-bellevue',
  brokerName: 'Iule Miranda',
  brokerPhone: '+5581986141487',
  brokerEmail: 'iule@imi.com',
  clientName: 'Maria Silva',
  clientPhone: '5581999998888',
  clientEmail: 'maria@email.com',
  when: FUTURE,
  mode: 'presencial',
  source: 'property_page',
  documents: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimit.mockResolvedValue({ success: true })
})

describe('POST /api/visits/book', () => {
  it('rate limited → 429 antes de qualquer trabalho', async () => {
    mockRateLimit.mockResolvedValue({ success: false })
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(429)
    expect(mockNotifyVisit).not.toHaveBeenCalled()
  })

  it('corpo inválido (sem nome) → 400', async () => {
    const res = await POST(makeRequest({ ...VALID, clientName: '' }))
    expect(res.status).toBe(400)
  })

  it('horário no passado → 400', async () => {
    const res = await POST(makeRequest({ ...VALID, when: '2020-01-01T09:00:00-03:00' }))
    expect(res.status).toBe(400)
    expect(mockNotifyVisit).not.toHaveBeenCalled()
  })

  it('sucesso presencial → 200, persiste e notifica; não cria sala de vídeo', async () => {
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.token).toBe('tok-123')
    expect(mockCreateVideoRoom).not.toHaveBeenCalled()
    expect(mockNotifyVisit).toHaveBeenCalledTimes(1)
    expect(mockCreateNotification).toHaveBeenCalledTimes(1)
  })

  it('sucesso vídeo → cria sala e devolve videoRoomUrl', async () => {
    const res = await POST(makeRequest({ ...VALID, mode: 'video' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videoRoomUrl).toBe('https://meet.jit.si/IMIabc')
    expect(mockCreateVideoRoom).toHaveBeenCalledTimes(1)
  })

  it('banco indisponível no insert → ainda confirma (best-effort)', async () => {
    insertSingle.mockRejectedValueOnce(new Error('relation "visit_bookings" does not exist'))
    const res = await POST(makeRequest(VALID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockNotifyVisit).toHaveBeenCalledTimes(1)
  })
})
