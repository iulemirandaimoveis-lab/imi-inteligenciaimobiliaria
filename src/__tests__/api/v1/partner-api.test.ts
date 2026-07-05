/**
 * @jest-environment node
 */

/**
 * Contratos da Partner API v1 (D-15) — GET /api/v1/developments.
 * A autorização é por API key (Bearer imi_pk_...) com escopos; o contrato
 * público nunca expõe coluna crua do banco. Verifica: chave ausente/inválida/
 * revogada (401), escopo insuficiente (403), rate limit por chave (429),
 * gating de preço por escopo, ETag/304 e shape sem vazamento de colunas.
 */

const mockKeySingle = jest.fn()
const mockDevResult = jest.fn()
const mockKeyUpdate = jest.fn()

function chainable(terminal: () => Promise<unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {}
  for (const m of ['select', 'eq', 'in', 'or', 'order', 'limit', 'lt']) {
    b[m] = jest.fn(() => b)
  }
  b.maybeSingle = jest.fn(() => terminal())
  b.single = jest.fn(() => terminal())
  b.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    terminal().then(resolve, reject)
  return b
}

jest.mock('@/lib/supabase/admin', () => ({
  get supabaseAdmin() {
    return {
      from: jest.fn((table: string) => {
        if (table === 'partner_api_keys') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b: any = chainable(() => mockKeySingle())
          b.update = jest.fn((payload: unknown) => {
            mockKeyUpdate(payload)
            return chainable(async () => ({ data: null, error: null }))
          })
          return b
        }
        return chainable(() => mockDevResult())
      }),
    }
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true, remaining: 100, resetTime: Date.now() + 60000 })),
}))

import { GET as listDevelopments } from '@/app/api/v1/developments/route'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { hashPartnerKey } from '@/lib/partner-api/auth'
import { toPartnerLotStatus, lotCode, toPartnerLot } from '@/lib/partner-api/mappers'

const RAW_KEY = 'imi_pk_' + 'a'.repeat(43)

const ACTIVE_KEY_ROW = {
  id: 'key-1',
  partner_name: 'Mano Imóveis',
  scopes: ['developments:read', 'lots:read'],
  active: true,
  revoked_at: null,
}

const DEV_ROW = {
  id: 'dev-1',
  slug: 'alto-bellevue',
  name: 'Alto Bellevue',
  developer: 'IMI',
  developer_logo: null,
  status: 'disponivel',
  status_commercial: 'published',
  description: 'desc',
  price_min: 100000,
  price_max: 200000,
  leads_count: 42, // coluna interna — NUNCA pode vazar no contrato
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/v1/developments', { headers })
}

function authed(extra: Record<string, string> = {}) {
  return makeRequest({ Authorization: `Bearer ${RAW_KEY}`, ...extra })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 100, resetTime: Date.now() + 60000 })
  mockKeySingle.mockResolvedValue({ data: ACTIVE_KEY_ROW, error: null })
  mockDevResult.mockResolvedValue({ data: [DEV_ROW], error: null })
})

describe('Partner API v1 — autenticação por chave', () => {
  it('sem Authorization → 401 missing_api_key, banco de dados não consultado', async () => {
    const res = await listDevelopments(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('missing_api_key')
  })

  it('prefixo errado → 401 sem lookup', async () => {
    const res = await listDevelopments(makeRequest({ Authorization: 'Bearer sk_outra_coisa' }))
    expect(res.status).toBe(401)
    expect(mockKeySingle).not.toHaveBeenCalled()
  })

  it('chave desconhecida → 401 invalid_api_key', async () => {
    mockKeySingle.mockResolvedValue({ data: null, error: null })
    const res = await listDevelopments(authed())
    expect(res.status).toBe(401)
    expect((await res.json()).error.code).toBe('invalid_api_key')
  })

  it('chave revogada → mesma resposta 401 (não vaza o motivo)', async () => {
    mockKeySingle.mockResolvedValue({
      data: { ...ACTIVE_KEY_ROW, revoked_at: '2026-07-01T00:00:00Z' },
      error: null,
    })
    const res = await listDevelopments(authed())
    expect(res.status).toBe(401)
    expect((await res.json()).error.code).toBe('invalid_api_key')
  })

  it('escopo insuficiente → 403 insufficient_scope', async () => {
    mockKeySingle.mockResolvedValue({
      data: { ...ACTIVE_KEY_ROW, scopes: ['lots:read'] },
      error: null,
    })
    const res = await listDevelopments(authed())
    expect(res.status).toBe(403)
    expect((await res.json()).error.code).toBe('insufficient_scope')
  })

  it('rate limit da CHAVE excedido → 429 com Retry-After', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 30000 })
    const res = await listDevelopments(authed())
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(rateLimit).toHaveBeenCalledWith('partner:key-1', expect.any(Object))
  })
})

describe('Partner API v1 — GET /developments (contrato)', () => {
  it('200: shape do contrato, sem colunas cruas do banco', async () => {
    const res = await listDevelopments(authed())
    expect(res.status).toBe(200)
    const body = await res.json()
    const dev = body.data[0]
    expect(dev.id).toBe('dev-1')
    expect(dev.slug).toBe('alto-bellevue')
    expect(dev.developer).toEqual({ name: 'IMI', logo_url: null })
    expect(dev.map_available).toBe(true)
    // Colunas internas jamais atravessam o mapper
    expect(dev.leads_count).toBeUndefined()
    expect(dev.status_commercial).toBeUndefined()
    // Sem escopo prices:read → sem price_range
    expect(dev.price_range).toBeUndefined()
    expect(body.pagination).toHaveProperty('next_cursor')
  })

  it('preço aparece somente com escopo prices:read', async () => {
    mockKeySingle.mockResolvedValue({
      data: { ...ACTIVE_KEY_ROW, scopes: ['developments:read', 'prices:read'] },
      error: null,
    })
    const res = await listDevelopments(authed())
    const dev = (await res.json()).data[0]
    expect(dev.price_range).toEqual({ min: 100000, max: 200000, currency: 'BRL' })
  })

  it('ETag: If-None-Match igual → 304 sem corpo', async () => {
    const first = await listDevelopments(authed())
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()
    const second = await listDevelopments(authed({ 'If-None-Match': etag! }))
    expect(second.status).toBe(304)
    expect(await second.text()).toBe('')
  })

  it('registra last_used_at sem bloquear a resposta', async () => {
    await listDevelopments(authed())
    expect(mockKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ last_used_at: expect.any(String) }),
    )
  })
})

describe('Partner API v1 — mappers (unidade)', () => {
  it('hashPartnerKey é SHA-256 hex determinístico', () => {
    expect(hashPartnerKey('imi_pk_x')).toMatch(/^[0-9a-f]{64}$/)
    expect(hashPartnerKey('imi_pk_x')).toBe(hashPartnerKey('imi_pk_x'))
  })

  it('status interno → vocabulário público fechado', () => {
    expect(toPartnerLotStatus('DISPONIVEL')).toBe('disponivel')
    expect(toPartnerLotStatus('NEGOCIACAO')).toBe('em_negociacao')
    expect(toPartnerLotStatus('PROPRIETARIO')).toBe('bloqueado')
    expect(toPartnerLotStatus('qualquer-coisa')).toBe('bloqueado')
    expect(toPartnerLotStatus(null)).toBe('bloqueado')
  })

  it('lotCode segue o id canônico dos mapas (A-01)', () => {
    expect(lotCode('a', 1)).toBe('A-01')
    expect(lotCode('P', 12)).toBe('P-12')
  })

  it('toPartnerLot: preço só com escopo', () => {
    const row = {
      id: 'l1', development_id: 'dev-1', quadra: 'A', lot_number: 1,
      area_m2: '355.99', price: '55000.00', status: 'DISPONIVEL',
      special_type: null, updated_at: null,
    }
    expect(toPartnerLot(row).price).toBeUndefined()
    expect(toPartnerLot(row, { includePrices: true }).price).toBe(55000)
    expect(toPartnerLot(row).area_m2).toBeCloseTo(355.99)
  })
})
