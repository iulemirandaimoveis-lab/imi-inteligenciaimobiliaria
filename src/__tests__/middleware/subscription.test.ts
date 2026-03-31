/**
 * @jest-environment node
 */

/**
 * Tests for auth enforcement logic in updateSession middleware
 * Verifies: unauthenticated redirect, authenticated access, login redirect
 *
 * Note: Subscription enforcement (trial expiration, billing redirect) is
 * currently DISABLED in the actual middleware for launch phase.
 * Those tests are skipped until the feature is re-enabled.
 */

import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(() => ({
        auth: {
            getUser: mockGetUser,
        },
    })),
}))

import { updateSession } from '@/lib/supabase/middleware'

function createRequest(path: string): NextRequest {
    return new NextRequest(new URL(path, 'http://localhost:3000'), {
        method: 'GET',
    })
}

describe('updateSession — auth enforcement', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('redirects to /login when accessing /backoffice without session', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const req = createRequest('/backoffice/dashboard')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        const location = res.headers.get('Location')
        expect(location).toContain('/login')
        expect(location).toContain('redirectedFrom=%2Fbackoffice%2Fdashboard')
    })

    it.skip('redirects to /backoffice/billing when trial has expired and tier is starter', async () => {
        // Subscription enforcement is DISABLED for launch phase
    })

    it.skip('redirects to /backoffice/billing when trial has expired and no tier is set', async () => {
        // Subscription enforcement is DISABLED for launch phase
    })

    it('allows access when user is authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: 'u1',
                    user_metadata: {
                        subscription_tier: 'starter',
                    },
                },
            },
        })

        const req = createRequest('/backoffice/leads')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('allows access when user has paid professional tier', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: 'u1',
                    user_metadata: {
                        subscription_tier: 'professional',
                    },
                },
            },
        })

        const req = createRequest('/backoffice/dashboard')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('allows access when user has enterprise tier', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: 'u1',
                    user_metadata: {
                        subscription_tier: 'enterprise',
                    },
                },
            },
        })

        const req = createRequest('/backoffice/financeiro')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it.skip('exempts /backoffice/billing from subscription enforcement', async () => {
        // Subscription enforcement is DISABLED for launch phase
    })

    it('redirects authenticated user from /login to /backoffice', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: 'u1',
                    user_metadata: {
                        subscription_tier: 'professional',
                    },
                },
            },
        })

        const req = createRequest('/login')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        expect(res.headers.get('Location')).toContain('/backoffice')
    })

    it('allows unauthenticated user to access /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const req = createRequest('/login')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })
})
