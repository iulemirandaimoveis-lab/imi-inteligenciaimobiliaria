/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/format.ts
 * Covers: formatCurrency, fmt, formatNumber, formatPercent, timeAgo, normalizeStatus
 */

import { formatCurrency, fmt, formatNumber, formatPercent, timeAgo, normalizeStatus } from '@/lib/format'

// ── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats BRL correctly for whole numbers', () => {
    const result = formatCurrency(500000)
    // pt-BR Intl formatting: "R$ 500.000" (no decimals by default)
    expect(result).toContain('R$')
    expect(result).toContain('500')
  })

  it('returns "—" for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })

  it('formats in compact mode with M suffix for millions', () => {
    const result = formatCurrency(1500000, { compact: true })
    expect(result).toContain('R$')
    expect(result).toContain('M')
  })

  it('formats in compact mode with K suffix for thousands', () => {
    const result = formatCurrency(5000, { compact: true })
    expect(result).toContain('R$')
    expect(result).toContain('K')
  })

  it('respects decimals option', () => {
    const result = formatCurrency(1234.56, { decimals: 2 })
    expect(result).toContain('R$')
    // Should have decimal part
    expect(result).toContain('1.234')
  })

  it('handles zero value', () => {
    const result = formatCurrency(0)
    expect(result).toContain('R$')
    expect(result).toContain('0')
  })
})

// ── fmt (alias) ─────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('is an alias for compact formatCurrency', () => {
    const result = fmt(2500000)
    expect(result).toContain('R$')
    expect(result).toContain('M')
  })

  it('returns "—" for null', () => {
    expect(fmt(null)).toBe('—')
  })

  it('formats thousands with K', () => {
    const result = fmt(75000)
    expect(result).toContain('R$')
    expect(result).toContain('K')
  })
})

// ── formatNumber ────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats number with default 1 decimal', () => {
    const result = formatNumber(1234.567)
    // pt-BR uses comma for decimal separator
    expect(result).toContain('1.234')
  })

  it('formats with custom decimals', () => {
    const result = formatNumber(99.999, 2)
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('returns "—" for null', () => {
    expect(formatNumber(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatNumber(undefined)).toBe('—')
  })
})

// ── formatPercent ───────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('formats positive percentage with + sign', () => {
    const result = formatPercent(12.5)
    expect(result).toBe('+12.5%')
  })

  it('formats negative percentage with - sign', () => {
    const result = formatPercent(-3.2)
    expect(result).toBe('-3.2%')
  })

  it('returns "—" for null', () => {
    expect(formatPercent(null)).toBe('—')
  })

  it('formats zero with + sign', () => {
    const result = formatPercent(0)
    expect(result).toBe('+0.0%')
  })
})

// ── timeAgo ─────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it('returns "agora" for dates less than 2 minutes ago', () => {
    const now = new Date()
    expect(timeAgo(now)).toBe('agora')
  })

  it('returns "agora" for 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000)
    expect(timeAgo(oneMinAgo)).toBe('agora')
  })

  it('returns minutes for 5 minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(timeAgo(fiveMinAgo)).toBe('5 min')
  })

  it('returns hours for 3 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const result = timeAgo(threeHoursAgo)
    expect(result).toContain('h atrás')
    expect(result).toContain('3')
  })

  it('returns days for 2 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const result = timeAgo(twoDaysAgo)
    expect(result).toContain('d atrás')
    expect(result).toContain('2')
  })

  it('returns formatted date for very old dates (30+ days)', () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const result = timeAgo(oldDate)
    // Should return something like "25 de jan." (localized short date)
    expect(result).not.toContain('atrás')
    expect(result).not.toBe('agora')
  })

  it('accepts string input', () => {
    const result = timeAgo(new Date().toISOString())
    expect(result).toBe('agora')
  })
})

// ── normalizeStatus ─────────────────────────────────────────────────────────

describe('normalizeStatus', () => {
  it('maps English "available" to Portuguese "disponivel"', () => {
    expect(normalizeStatus('available')).toBe('disponivel')
  })

  it('maps "sold" to "vendido"', () => {
    expect(normalizeStatus('sold')).toBe('vendido')
  })

  it('maps "launch" to "lancamento"', () => {
    expect(normalizeStatus('launch')).toBe('lancamento')
  })

  it('maps "under_construction" to "em_construcao"', () => {
    expect(normalizeStatus('under_construction')).toBe('em_construcao')
  })

  it('returns "disponivel" for null', () => {
    expect(normalizeStatus(null)).toBe('disponivel')
  })

  it('returns "disponivel" for undefined', () => {
    expect(normalizeStatus(undefined)).toBe('disponivel')
  })

  it('preserves already-normalized Portuguese status', () => {
    expect(normalizeStatus('vendido')).toBe('vendido')
    expect(normalizeStatus('lancamento')).toBe('lancamento')
  })

  it('handles case-insensitive input', () => {
    expect(normalizeStatus('AVAILABLE')).toBe('disponivel')
    expect(normalizeStatus('Sold')).toBe('vendido')
  })

  it('returns lowercased input for unknown statuses', () => {
    expect(normalizeStatus('custom_status')).toBe('custom_status')
  })
})
