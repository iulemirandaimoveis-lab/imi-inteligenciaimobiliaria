import { test, expect, expectNoConsoleErrors, expectNoHorizontalOverflow } from './fixtures'

/**
 * Alto Bellevue — laboratório do engine de mapa.
 *
 * Cobertura: carregamento da página, alternador de vistas (Plano / Satélite +
 * Lotes / Satélite), invariantes imutáveis de localização
 * (.claude/ALTO_BELLEVUE_LOCATION.md), overflow e erros de console.
 * Todos os testes são read-only — seguros contra produção.
 */

const PAGE = '/pt/imoveis/alto-bellevue'

test.describe('Alto Bellevue — página do empreendimento', () => {
    test('carrega com título e sem erros de console', async ({ page, consoleErrors }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('h1').first()).toBeVisible()
        await expect(page).toHaveTitle(/Alto Bellevue|IMI|Imóveis/i)
        // Dá tempo para hidratação + montagem dos componentes dinâmicos.
        await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
        expectNoConsoleErrors(consoleErrors)
    })

    test('sem overflow horizontal', async ({ page }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2500)
        await expectNoHorizontalOverflow(page, PAGE)
    })

    test('INVARIANTE: link do Google Maps do cliente intacto', async ({ page }) => {
        // .claude/ALTO_BELLEVUE_LOCATION.md — o link confirmado pelo cliente
        // NUNCA pode mudar. Este teste transforma a regra em gate automático.
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const mapsLink = page.locator('a[href*="maps.app.goo.gl/mRgnY7oMYvxgiViV6"]').first()
        await expect(mapsLink).toBeAttached({ timeout: 20_000 })
    })

    test('alternador de vistas do mapa renderiza as 3 opções com alvo de toque adequado', async ({ page }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const tabPlano = page.getByRole('button', { name: /Plano/ }).first()
        await expect(tabPlano).toBeVisible({ timeout: 30_000 })
        const tabSatLotes = page.getByRole('button', { name: /Sat.*Lotes/ }).first()
        const tabSatelite = page.getByRole('button', { name: /^Satélite$/ }).first()
        await expect(tabSatLotes).toBeVisible()
        await expect(tabSatelite).toBeVisible()

        for (const tab of [tabPlano, tabSatLotes, tabSatelite]) {
            const box = await tab.boundingBox()
            expect(box, 'tab do alternador deve ter bounding box').toBeTruthy()
            expect(box!.height, 'alvo de toque ≥44px (Apple HIG)').toBeGreaterThanOrEqual(44)
        }
    })

    test('vista Satélite alterna sem quebrar a página', async ({ page, consoleErrors }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const tabSatelite = page.getByRole('button', { name: /^Satélite$/ }).first()
        await expect(tabSatelite).toBeVisible({ timeout: 30_000 })
        await tabSatelite.click()
        await expect(page.getByText(/Vista de satélite real/i).first()).toBeVisible({ timeout: 20_000 })
        await expectNoHorizontalOverflow(page, 'vista satélite')
        expectNoConsoleErrors(consoleErrors)
    })

    test('vista Satélite + Lotes monta o engine geoespacial', async ({ page, consoleErrors }) => {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
        const tab = page.getByRole('button', { name: /Sat.*Lotes/ }).first()
        await expect(tab).toBeVisible({ timeout: 30_000 })
        await tab.click()
        // O mapa WebGL monta com marca "Alto Bellevue" + contagem de disponíveis.
        await expect(page.getByText(/disponíveis/i).first()).toBeVisible({ timeout: 30_000 })
        expectNoConsoleErrors(consoleErrors)
    })
})
