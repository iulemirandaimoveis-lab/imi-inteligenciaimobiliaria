/**
 * @jest-environment node
 */

/**
 * T-08 — Contrato do X-Frame-Options escopado (fonte única).
 * Prova que:
 *  - o middleware NÃO emite mais X-Frame-Options (evita header duplicado),
 *  - o next.config define DENY p/ áreas protegidas e SAMEORIGIN p/ públicas,
 *  - a CSP `frame-ancestors 'self'` permanece a autoridade,
 *  - não há X-Frame-Options no bloco global (sem duplicação).
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const middlewareSrc = readFileSync(join(process.cwd(), 'src/middleware.ts'), 'utf8')
const nextConfigSrc = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')

describe('T-08 — X-Frame-Options único e escopado', () => {
  it('middleware não define X-Frame-Options (fonte única = next.config)', () => {
    expect(middlewareSrc).not.toMatch(/set\(\s*['"]X-Frame-Options['"]/)
  })

  it('next.config define DENY para áreas protegidas', () => {
    expect(nextConfigSrc).toMatch(/backoffice\|users\|api\|auth\|login\|admin\|console/)
    expect(nextConfigSrc).toMatch(/X-Frame-Options['"],\s*value:\s*['"]DENY['"]/)
  })

  it('next.config define SAMEORIGIN para rotas públicas via negative-lookahead', () => {
    expect(nextConfigSrc).toMatch(/\(\?!backoffice\|users\|api\|auth\|login\|admin\|console\|_next\)/)
    expect(nextConfigSrc).toMatch(/X-Frame-Options['"],\s*value:\s*['"]SAMEORIGIN['"]/)
  })

  it('CSP frame-ancestors self permanece como autoridade', () => {
    expect(nextConfigSrc).toMatch(/frame-ancestors 'self'/)
  })

  it('bloco global (/(.*)) não contém X-Frame-Options (sem duplicação)', () => {
    // Isola o bloco que casa "source: '/(.*)'" e verifica ausência do header.
    const idx = nextConfigSrc.indexOf("source: '/(.*)'")
    expect(idx).toBeGreaterThan(-1)
    const globalBlock = nextConfigSrc.slice(idx, idx + 1200)
    expect(globalBlock).not.toMatch(/X-Frame-Options/)
  })
})
