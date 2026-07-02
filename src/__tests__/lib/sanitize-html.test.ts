/**
 * @jest-environment node
 */

/**
 * T-07/F-06 — Contrato do wrapper sanitizeHtml.
 * A sanitização real é do DOMPurify (battle-tested); aqui garantimos o contrato
 * do NOSSO wrapper: guarda de nulos e delegação com o perfil HTML correto.
 * (isomorphic-dompurify é mockado: sua build embute jsdom e não transpila sob jest.)
 */
const mockSanitize = jest.fn((s: string) => `CLEAN:${s}`)
jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: { sanitize: (...args: unknown[]) => mockSanitize(...(args as [string])) },
}))

import { sanitizeHtml } from '@/lib/sanitize-html'
import DOMPurify from 'isomorphic-dompurify'

beforeEach(() => jest.clearAllMocks())

describe('sanitizeHtml — contrato do wrapper', () => {
  it('retorna "" para null/undefined/vazio sem chamar DOMPurify', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
    expect(sanitizeHtml('')).toBe('')
    expect(mockSanitize).not.toHaveBeenCalled()
  })

  it('delega ao DOMPurify com o perfil HTML e retorna o resultado', () => {
    const out = sanitizeHtml('<p>oi</p>')
    expect(out).toBe('CLEAN:<p>oi</p>')
    expect(mockSanitize).toHaveBeenCalledWith('<p>oi</p>', { USE_PROFILES: { html: true } })
    // sanity: usa o default export
    expect((DOMPurify as unknown as { sanitize: unknown }).sanitize).toBeDefined()
  })
})
