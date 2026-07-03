import { test, expectNoHorizontalOverflow, VIEWPORTS } from './fixtures'

/**
 * Matriz responsiva (Responsive Supreme Mode).
 *
 * Para cada viewport canônico × página crítica: zero overflow horizontal.
 * Overflow é o sintoma nº 1 de layout quebrado (conteúdo cortado, gesto de
 * pan sequestrando o scroll, botões colidindo) — este gate pega tudo isso.
 *
 * Roda apenas no projeto `desktop` (gerencia os próprios viewports).
 */

const PAGES = [
    '/pt',
    '/pt/imoveis',
    '/pt/imoveis/alto-bellevue',
    '/pt/imoveis/jazz-boulevard-garanhuns',
    '/pt/imoveis/jazz-boulevard-garanhuns/lp',
    '/users/login',
]

test.describe('Matriz responsiva — zero overflow horizontal', () => {
    test.skip(({ isMobile }) => isMobile === true, 'gerencia os próprios viewports')

    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
        test(`viewport ${name} (${viewport.width}×${viewport.height})`, async ({ page }) => {
            await page.setViewportSize(viewport)
            for (const path of PAGES) {
                await page.goto(path, { waitUntil: 'domcontentloaded' })
                await page.waitForTimeout(1800)
                await expectNoHorizontalOverflow(page, `${path} @ ${name}`)
            }
        })
    }
})
