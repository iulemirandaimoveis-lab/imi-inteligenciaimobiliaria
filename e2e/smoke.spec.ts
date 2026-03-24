import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('IMI Smoke Tests', () => {
    test('Home page loads', async ({ page }) => {
        await page.goto(`${BASE}/pt`)
        await expect(page).toHaveTitle(/IMI/)
        await expect(page.locator('text=IMI')).toBeVisible()
    })

    test('Imóveis listing loads', async ({ page }) => {
        await page.goto(`${BASE}/pt/imoveis`)
        await expect(page).toHaveTitle(/Imóveis/)
    })

    test('Login page renders', async ({ page }) => {
        await page.goto(`${BASE}/login`)
        await expect(page.locator('text=ENTRAR')).toBeVisible()
        await expect(page.locator('input[type="email"]')).toBeVisible()
    })

    test('Contact form exists', async ({ page }) => {
        await page.goto(`${BASE}/pt/contato`)
        await expect(page.locator('form')).toBeVisible()
    })

    test('No horizontal overflow on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 412, height: 915 })
        const pages = ['/pt', '/pt/imoveis', '/pt/credito', '/pt/sobre', '/pt/contato', '/login']
        for (const path of pages) {
            await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(2000)
            const overflow = await page.evaluate(() =>
                document.documentElement.scrollWidth > document.documentElement.clientWidth
            )
            expect(overflow, `Overflow on ${path}`).toBe(false)
        }
    })

    test('No gold-fill buttons on any page', async ({ page }) => {
        const pages = ['/pt', '/pt/imoveis', '/pt/credito', '/pt/sobre', '/pt/contato']
        for (const path of pages) {
            await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(2000)
            const goldButtons = await page.evaluate(() => {
                let count = 0
                document.querySelectorAll('button, a[role=button]').forEach(b => {
                    const bg = getComputedStyle(b).backgroundColor
                    if (bg.includes('200, 164, 74') || bg.includes('196, 157, 91')) count++
                })
                return count
            })
            expect(goldButtons, `Gold buttons on ${path}`).toBe(0)
        }
    })
})
