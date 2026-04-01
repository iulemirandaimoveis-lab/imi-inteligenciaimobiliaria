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

function makeRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
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
})
