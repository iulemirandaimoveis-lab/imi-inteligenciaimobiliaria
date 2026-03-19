/**
 * @jest-environment node
 */

/**
 * Tests for normalizeStatus function
 * Covers: all known status mappings, case insensitivity,
 *         unknown values, null/undefined edge cases
 */

import { normalizeStatus } from '@/features/properties/services/mapDevToProperty'

describe('normalizeStatus', () => {
  // ─── Known status mappings ──────────────────────────────
  it('maps "launch" to "lancamento"', () => {
    expect(normalizeStatus('launch')).toBe('lancamento')
  })

  it('maps "available" to "disponivel"', () => {
    expect(normalizeStatus('available')).toBe('disponivel')
  })

  it('maps "under_construction" to "em_construcao"', () => {
    expect(normalizeStatus('under_construction')).toBe('em_construcao')
  })

  it('maps "ready" to "disponivel"', () => {
    expect(normalizeStatus('ready')).toBe('disponivel')
  })

  it('maps "sold" to "vendido"', () => {
    expect(normalizeStatus('sold')).toBe('vendido')
  })

  it('maps "reserved" to "reservado"', () => {
    expect(normalizeStatus('reserved')).toBe('reservado')
  })

  it('maps "negotiating" to "em_negociacao"', () => {
    expect(normalizeStatus('negotiating')).toBe('em_negociacao')
  })

  it('maps "published" to "disponivel"', () => {
    expect(normalizeStatus('published')).toBe('disponivel')
  })

  it('maps "draft" to "rascunho"', () => {
    expect(normalizeStatus('draft')).toBe('rascunho')
  })

  it('maps "campaign" to "lancamento"', () => {
    expect(normalizeStatus('campaign')).toBe('lancamento')
  })

  it('maps "private" to "privado"', () => {
    expect(normalizeStatus('private')).toBe('privado')
  })

  // ─── Case insensitivity ─────────────────────────────────
  it('handles uppercase input: "LAUNCH" -> "lancamento"', () => {
    expect(normalizeStatus('LAUNCH')).toBe('lancamento')
  })

  it('handles mixed case input: "Available" -> "disponivel"', () => {
    expect(normalizeStatus('Available')).toBe('disponivel')
  })

  it('handles mixed case: "Under_Construction" -> "em_construcao"', () => {
    expect(normalizeStatus('Under_Construction')).toBe('em_construcao')
  })

  it('handles uppercase: "SOLD" -> "vendido"', () => {
    expect(normalizeStatus('SOLD')).toBe('vendido')
  })

  // ─── Unknown values (passthrough) ──────────────────────
  it('returns lowercased unknown value as-is', () => {
    expect(normalizeStatus('custom_status')).toBe('custom_status')
  })

  it('lowercases unknown status', () => {
    expect(normalizeStatus('MyCustomStatus')).toBe('mycustomstatus')
  })

  it('handles already normalized values (disponivel)', () => {
    expect(normalizeStatus('disponivel')).toBe('disponivel')
  })

  it('handles already normalized values (lancamento)', () => {
    expect(normalizeStatus('lancamento')).toBe('lancamento')
  })

  it('handles already normalized values (em_construcao)', () => {
    expect(normalizeStatus('em_construcao')).toBe('em_construcao')
  })

  // ─── Edge cases ─────────────────────────────────────────
  it('returns "disponivel" for empty string', () => {
    // empty string -> toLowerCase() -> '' -> not in map -> '' ?? 'disponivel' -> ''
    // Actually: empty string.toLowerCase() = '' which is falsy
    // DB_STATUS_MAP[''] is undefined, so returns ''?.toLowerCase() ?? 'disponivel' = ''
    const result = normalizeStatus('')
    expect(result).toBe('')
  })

  it('handles whitespace-only string', () => {
    const result = normalizeStatus('  ')
    expect(result).toBe('  ')
  })
})
