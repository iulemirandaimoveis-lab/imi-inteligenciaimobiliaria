/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/auth/login
 * Verifies: validation, authentication, error handling
 */

const mockSignInWithPassword = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    })),
}))

import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

// IP único por teste: o rate limit da rota (5/min por IP) é real e o limiter
// in-memory do ambiente de teste acumula entre chamadas.
let ipCounter = 0
function makeRequest(body: object, ip?: string) {
    ipCounter += 1
    return new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip ?? `10.0.0.${ipCounter}`,
        },
    })
}

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns 400 when email is missing', async () => {
        const req = makeRequest({ password: 'secret123' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(400)
        expect(json.error).toBe('Dados inválidos')
    })

    it('returns 400 when password is missing', async () => {
        const req = makeRequest({ email: 'user@test.com' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(400)
        expect(json.error).toBe('Dados inválidos')
    })

    it('returns 400 when both email and password are missing', async () => {
        const req = makeRequest({})
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(400)
        expect(json.error).toBe('Dados inválidos')
    })

    it('returns 401 when credentials are invalid', async () => {
        mockSignInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        })

        const req = makeRequest({ email: 'user@test.com', password: 'wrongpass' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(401)
        expect(json.error).toBeTruthy()
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'wrongpass',
        })
    })

    it('returns user and session on successful login', async () => {
        const mockUser = { id: 'user-123', email: 'user@test.com' }
        const mockSession = { access_token: 'token-abc', refresh_token: 'refresh-xyz' }

        mockSignInWithPassword.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        })

        const req = makeRequest({ email: 'user@test.com', password: 'correct-password' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.user).toEqual(mockUser)
        expect(json.session).toEqual(mockSession)
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'correct-password',
        })
    })

    it('returns 500 on unexpected server error', async () => {
        mockSignInWithPassword.mockRejectedValue(new Error('Connection timeout'))

        const req = makeRequest({ email: 'user@test.com', password: 'pass' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(500)
        expect(json.error).toBe('Erro interno do servidor')
    })

    it('rate limits repeated attempts from the same IP (anti brute-force)', async () => {
        mockSignInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        })

        const attackerIp = '203.0.113.66'
        const statuses: number[] = []
        for (let i = 0; i < 6; i++) {
            const res = await POST(makeRequest({ email: 'user@test.com', password: `guess-${i}` }, attackerIp))
            statuses.push(res.status)
        }

        // 5 tentativas passam pelo limiter (401 credencial inválida), a 6ª leva 429
        expect(statuses.slice(0, 5).every(s => s === 401)).toBe(true)
        expect(statuses[5]).toBe(429)
    })
})
