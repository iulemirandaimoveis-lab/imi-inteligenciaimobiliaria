/**
 * Schema validation tests — ensures Zod schemas reject bad input
 * and accept valid input correctly.
 */
import {
    leadSchema,
    campanhaUpdateSchema,
    transactionSchema,
    avaliacaoSchema,
    consultoriaSchema,
    conteudoSchema,
    playbookSchema,
} from '@/lib/schemas'

describe('leadSchema', () => {
    it('rejects empty object', () => {
        const result = leadSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('rejects name shorter than 2 chars', () => {
        const result = leadSchema.safeParse({ name: 'J' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
        const result = leadSchema.safeParse({ name: 'João', email: 'not-an-email' })
        expect(result.success).toBe(false)
    })

    it('accepts valid minimal lead', () => {
        const result = leadSchema.safeParse({ name: 'João Silva' })
        expect(result.success).toBe(true)
    })

    it('accepts lead with all optional fields', () => {
        const result = leadSchema.safeParse({
            name: 'Maria Santos',
            email: 'maria@email.com',
            phone: '11999999999',
            source: 'website',
            budget_min: 300000,
            budget_max: 500000,
        })
        expect(result.success).toBe(true)
    })

    it('coerces empty string email to undefined', () => {
        const result = leadSchema.safeParse({ name: 'João', email: '' })
        expect(result.success).toBe(true)
    })
})

describe('transactionSchema', () => {
    it('rejects empty object', () => {
        const result = transactionSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('rejects zero or negative amount', () => {
        const result = transactionSchema.safeParse({
            type: 'receita', category: 'Vendas',
            description: 'Test', amount: -100, date: '2026-03-01',
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid type', () => {
        const result = transactionSchema.safeParse({
            type: 'invalid', category: 'Vendas',
            description: 'Test', amount: 1000, date: '2026-03-01',
        })
        expect(result.success).toBe(false)
    })

    it('accepts valid receita', () => {
        const result = transactionSchema.safeParse({
            type: 'receita', category: 'Honorários',
            description: 'Avaliação imóvel', amount: 2500, date: '2026-03-01',
        })
        expect(result.success).toBe(true)
    })

    it('accepts valid despesa', () => {
        const result = transactionSchema.safeParse({
            type: 'despesa', category: 'Marketing',
            description: 'Google Ads', amount: 800, date: '2026-03-15',
        })
        expect(result.success).toBe(true)
    })
})

describe('campanhaUpdateSchema', () => {
    it('rejects missing id', () => {
        const result = campanhaUpdateSchema.safeParse({ name: 'Campanha' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid UUID id', () => {
        const result = campanhaUpdateSchema.safeParse({ id: 'not-a-uuid', name: 'Test' })
        expect(result.success).toBe(false)
    })

    it('accepts partial update with valid UUID', () => {
        const result = campanhaUpdateSchema.safeParse({
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Nova Campanha',
        })
        expect(result.success).toBe(true)
    })
})

describe('avaliacaoSchema', () => {
    it('rejects when required fields are missing', () => {
        const result = avaliacaoSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('accepts valid avaliacao', () => {
        const result = avaliacaoSchema.safeParse({
            tipo_imovel: 'Apartamento',
            endereco: 'Rua das Flores, 123',
            bairro: 'Boa Viagem',
            cliente_nome: 'Pedro Alves',
            finalidade: 'Venda',
        })
        expect(result.success).toBe(true)
    })
})

describe('consultoriaSchema', () => {
    it('rejects missing titulo', () => {
        const result = consultoriaSchema.safeParse({ tipo: 'Patrimonial' })
        expect(result.success).toBe(false)
    })

    it('accepts minimal consultoria', () => {
        const result = consultoriaSchema.safeParse({ titulo: 'Consultoria Patrimonial' })
        expect(result.success).toBe(true)
    })
})

describe('conteudoSchema', () => {
    it('rejects short titulo', () => {
        const result = conteudoSchema.safeParse({ titulo: 'A' })
        expect(result.success).toBe(false)
    })

    it('defaults status to rascunho', () => {
        const result = conteudoSchema.safeParse({ titulo: 'Post Instagram' })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.status).toBe('rascunho')
    })
})

describe('playbookSchema', () => {
    it('rejects empty name', () => {
        const result = playbookSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
    })

    it('defaults category to geral', () => {
        const result = playbookSchema.safeParse({ name: 'SOP Avaliação' })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.category).toBe('geral')
    })

    it('defaults steps to empty array', () => {
        const result = playbookSchema.safeParse({ name: 'SOP Avaliação' })
        expect(result.success).toBe(true)
        if (result.success) expect(Array.isArray(result.data.steps)).toBe(true)
    })
})
