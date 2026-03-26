/**
 * @jest-environment node
 */

/**
 * IMI Lead Schema Validation Tests
 * Tests for leadSchema from src/lib/schemas/index.ts
 */

import { leadSchema } from '@/lib/schemas'

describe('Lead Schema Validation', () => {
  it('accepts a valid lead with all fields', () => {
    const validLead = {
      name: 'Maria Silva',
      email: 'maria@email.com',
      phone: '81999998888',
      source: 'website',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'boa_viagem_2024',
      interest_type: 'compra',
      interest_location: 'Boa Viagem, Recife',
      budget_min: 300_000,
      budget_max: 600_000,
      notes: 'Interessada em apartamento 3 quartos',
      status: 'novo',
      ai_score: 85,
      ai_priority: 'high' as const,
    }

    const result = leadSchema.safeParse(validLead)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Maria Silva')
      expect(result.data.email).toBe('maria@email.com')
      expect(result.data.budget_min).toBe(300_000)
    }
  })

  it('rejects a lead with missing name', () => {
    const invalidLead = {
      email: 'teste@email.com',
      phone: '81999998888',
    }

    const result = leadSchema.safeParse(invalidLead)
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameErrors = result.error.issues.filter(i => i.path.includes('name'))
      expect(nameErrors.length).toBeGreaterThan(0)
    }
  })

  it('rejects a lead with invalid email', () => {
    const invalidLead = {
      name: 'Joao Santos',
      email: 'not-an-email',
    }

    const result = leadSchema.safeParse(invalidLead)
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailErrors = result.error.issues.filter(i => i.path.includes('email'))
      expect(emailErrors.length).toBeGreaterThan(0)
    }
  })

  it('rejects a lead with negative budget', () => {
    const invalidLead = {
      name: 'Carlos Souza',
      budget_min: -50_000,
    }

    const result = leadSchema.safeParse(invalidLead)
    expect(result.success).toBe(false)
    if (!result.success) {
      const budgetErrors = result.error.issues.filter(i => i.path.includes('budget_min'))
      expect(budgetErrors.length).toBeGreaterThan(0)
    }
  })

  it('accepts a minimal valid lead (name only with 2 chars)', () => {
    const minimalLead = {
      name: 'Li',
    }

    const result = leadSchema.safeParse(minimalLead)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Li')
      // Optional fields should be undefined
      expect(result.data.email).toBeUndefined()
      expect(result.data.budget_min).toBeUndefined()
    }
  })

  it('rejects a name with less than 2 characters', () => {
    const invalidLead = {
      name: 'A',
    }

    const result = leadSchema.safeParse(invalidLead)
    expect(result.success).toBe(false)
  })

  it('accepts empty string for email (optional)', () => {
    const lead = {
      name: 'Test Lead',
      email: '',
    }

    const result = leadSchema.safeParse(lead)
    expect(result.success).toBe(true)
  })
})
