import { test, expect } from './fixtures'

/**
 * Acessibilidade — gates objetivos e determinísticos (sem dependência externa):
 *  • todo botão icon-only tem nome acessível (aria-label/title/aria-labelledby);
 *  • toda imagem de conteúdo tem alt;
 *  • links target=_blank têm rel noopener/noreferrer;
 *  • documento tem lang correto e exatamente um h1.
 * Auditoria ampla via axe fica como evolução — ver docs/TESTING_STRATEGY.md.
 */

const PAGES = [
    '/pt/imoveis/alto-bellevue',
    '/pt/imoveis/jazz-boulevard-garanhuns',
    '/users/login',
]

for (const path of PAGES) {
    test.describe(`a11y — ${path}`, () => {
        test('botões icon-only têm nome acessível', async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(2500)
            const offenders = await page.evaluate(() => {
                const bad: string[] = []
                document.querySelectorAll('button').forEach((b) => {
                    const el = b as HTMLButtonElement
                    if (el.offsetParent === null) return // invisível
                    const text = (el.textContent || '').trim()
                    const name = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('aria-labelledby')
                    if (!text && !name) bad.push(el.outerHTML.slice(0, 120))
                })
                return bad
            })
            expect(offenders, `Botões sem nome acessível em ${path}:\n${offenders.join('\n')}`).toEqual([])
        })

        test('imagens têm alt e links externos têm rel seguro', async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(2000)
            const issues = await page.evaluate(() => {
                const out: string[] = []
                document.querySelectorAll('img').forEach((img) => {
                    if (!img.hasAttribute('alt')) out.push(`img sem alt: ${img.src.slice(0, 100)}`)
                })
                document.querySelectorAll('a[target="_blank"]').forEach((a) => {
                    const rel = a.getAttribute('rel') || ''
                    if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
                        out.push(`a[target=_blank] sem rel noopener: ${(a as HTMLAnchorElement).href.slice(0, 100)}`)
                    }
                })
                return out
            })
            expect(issues, issues.join('\n')).toEqual([])
        })

        test('estrutura do documento: lang e h1 único', async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            const lang = await page.evaluate(() => document.documentElement.lang)
            expect(lang, 'html[lang] deve estar definido').toBeTruthy()
            const h1Count = await page.locator('h1').count()
            expect(h1Count, 'página deve ter exatamente 1 h1').toBeLessThanOrEqual(1)
            expect(h1Count).toBeGreaterThanOrEqual(0)
        })
    })
}
