import { test, expect, expectNoConsoleErrors, expectNoHorizontalOverflow } from './fixtures'

/**
 * Jazz Boulevard — experiência da página e do seletor de unidades.
 * Testes read-only (nenhuma proposta/formulário é enviado).
 */

const PAGE = '/pt/imoveis/jazz-boulevard-garanhuns'
const LP = '/pt/imoveis/jazz-boulevard-garanhuns/lp'

test.describe('Jazz Boulevard — página do empreendimento', () => {
    test('carrega hero + viewer sem erros de console', async ({ page, consoleErrors }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: 'Jazz Boulevard' }).first()).toBeVisible()
        await expect(page.getByText('Unidades Disponíveis').first()).toBeVisible({ timeout: 30_000 })
        expectNoConsoleErrors(consoleErrors)
    })

    test('sem overflow horizontal', async ({ page }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)
        await expectNoHorizontalOverflow(page, PAGE)
    })

    test('link de retorno preserva o idioma (/pt/)', async ({ page }) => {
        // Regressão: o link "Investimento" apontava para /imoveis/... sem locale,
        // forçando um redirect do middleware e ignorando o idioma escolhido.
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const back = page.locator('a[href*="jazz-boulevard-garanhuns/lp"]').first()
        await expect(back).toBeAttached()
        const href = await back.getAttribute('href')
        expect(href, 'back-link deve manter o prefixo de idioma').toMatch(/^\/pt\//)
    })

    test('selecionar unidade abre painel de detalhes e Escape fecha', async ({ page }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const unitCard = page.locator('button', { hasText: /^Apto / }).first()
        await expect(unitCard).toBeVisible({ timeout: 30_000 })
        await unitCard.click()
        // Painel lateral abre com o mesmo código da unidade.
        await expect(page.getByText(/Área Privativa/).first()).toBeVisible({ timeout: 10_000 })
        // Escape fecha (paridade de interação com o mapa do Alto Bellevue).
        await page.keyboard.press('Escape')
        await expect(page.getByText(/Área Privativa/)).toHaveCount(0, { timeout: 10_000 })
    })

    test('alternar torre e andar atualiza o grid sem estado obsoleto', async ({ page }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const towerB = page.getByRole('button', { name: /^B$/ }).first()
        await expect(towerB).toBeVisible({ timeout: 30_000 })
        await towerB.click()
        await expect(page.getByText(/Torre B/).first()).toBeVisible()
        // Grid continua renderizando cards de unidade (ou empty state legítimo).
        const cards = page.locator('button', { hasText: /^Apto / })
        const empty = page.getByText(/Nenhuma unidade neste andar/)
        await expect(cards.first().or(empty)).toBeVisible({ timeout: 10_000 })
    })

    test('nenhum número de WhatsApp placeholder na página e na LP', async ({ page }) => {
        // Regressão: a LP usava wa.me/5581999999999 (número morto) — leads perdidos.
        for (const path of [PAGE, LP]) {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(1500)
            const placeholders = await page.locator('a[href*="5581999999999"]').count()
            expect(placeholders, `wa.me placeholder em ${path}`).toBe(0)
        }
    })

    test('LP de investimento carrega sem overflow', async ({ page, consoleErrors }) => {
        await page.goto(LP, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)
        await expectNoHorizontalOverflow(page, LP)
        expectNoConsoleErrors(consoleErrors)
    })
})
