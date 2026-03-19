/**
 * @jest-environment jsdom
 */

/**
 * Tests for FeatureGate component
 * Verifies: rendering children for authorized tiers, showing lock for unauthorized
 */

import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'

// Mock Supabase client
const mockGetUser = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: mockGetUser,
        },
    }),
}))

// Mock next/link
jest.mock('next/link', () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>
    }
})

import { FeatureGate } from '@/components/backoffice/FeatureGate'

describe('FeatureGate', () => {
    it('renders children when user has sufficient tier', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    user_metadata: { subscription_tier: 'professional' },
                },
            },
        })

        render(
            <FeatureGate tier="professional">
                <div data-testid="premium-content">Premium Content</div>
            </FeatureGate>
        )

        await waitFor(() => {
            expect(screen.getByTestId('premium-content')).toBeInTheDocument()
        })
    })

    it('renders children when user has higher tier than required', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    user_metadata: { subscription_tier: 'enterprise' },
                },
            },
        })

        render(
            <FeatureGate tier="professional">
                <div data-testid="premium-content">Premium Content</div>
            </FeatureGate>
        )

        await waitFor(() => {
            expect(screen.getByTestId('premium-content')).toBeInTheDocument()
        })
    })

    it('shows lock overlay for starter users accessing professional features', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    user_metadata: { subscription_tier: 'starter' },
                },
            },
        })

        render(
            <FeatureGate tier="professional" featureName="Relatórios Avançados">
                <div data-testid="premium-content">Premium Content</div>
            </FeatureGate>
        )

        await waitFor(() => {
            expect(screen.getByText('Relatórios Avançados')).toBeInTheDocument()
            expect(screen.getByText('Ver planos')).toBeInTheDocument()
        })
    })

    it('shows lock when user has no subscription_tier metadata', async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    user_metadata: {},
                },
            },
        })

        render(
            <FeatureGate tier="professional">
                <div>Content</div>
            </FeatureGate>
        )

        await waitFor(() => {
            expect(screen.getByText('Recurso Premium')).toBeInTheDocument()
        })
    })
})
