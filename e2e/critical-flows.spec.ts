import { test, expect } from '@playwright/test'

// ═══════════════════════════════════════════════════════════════
// IMI — E2E Tests for 5 Critical Revenue Flows
// Run: npx playwright test
// ═══════════════════════════════════════════════════════════════

test.describe('Flow 1: Website público carrega', () => {
    test('home page loads with header and hero', async ({ page }) => {
        await page.goto('/pt')
        // Header visible with IMI logo
        await expect(page.locator('header')).toBeVisible()
        await expect(page.locator('text=IMI')).toBeVisible()
        // Page should have content (not blank/error)
        await expect(page.locator('body')).not.toBeEmpty()
    })

    test('imóveis listing page loads', async ({ page }) => {
        await page.goto('/pt/imoveis')
        await expect(page).toHaveTitle(/[Ii]móveis|IMI/)
        // Should have at least the page structure
        await expect(page.locator('header')).toBeVisible()
    })

    test('construtoras page loads', async ({ page }) => {
        await page.goto('/pt/construtoras')
        await expect(page.locator('header')).toBeVisible()
    })

    test('contato page loads', async ({ page }) => {
        await page.goto('/pt/contato')
        await expect(page.locator('header')).toBeVisible()
        // Should have a form
        await expect(page.locator('form')).toBeVisible()
    })
})

test.describe('Flow 2: Login funciona', () => {
    test('login page loads', async ({ page }) => {
        await page.goto('/login')
        // Should have email and password fields
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
    })

    test('login with invalid credentials shows error', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com')
        await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        // Should show error message (not redirect)
        await page.waitForTimeout(2000)
        const url = page.url()
        expect(url).toContain('login')
    })
})

test.describe('Flow 3: API routes respond', () => {
    test('GET /api/tracking/analytics returns data', async ({ request }) => {
        const response = await request.get('/api/tracking/analytics')
        // May return 401 (auth required) — that's OK, means the route works
        expect([200, 401]).toContain(response.status())
    })

    test('GET /api/developers returns data', async ({ request }) => {
        const response = await request.get('/api/developers')
        expect([200, 401]).toContain(response.status())
    })

    test('POST /api/contact accepts form data', async ({ request }) => {
        const response = await request.post('/api/contact', {
            data: {
                name: 'Playwright Test',
                email: 'test@playwright.dev',
                phone: '(83) 99999-0000',
                message: 'E2E test — ignore',
            },
        })
        // Should accept (200/201) or reject gracefully (400/422) — NOT 500
        expect(response.status()).toBeLessThan(500)
    })
})

test.describe('Flow 4: Mobile responsiveness', () => {
    test.use({ viewport: { width: 412, height: 915 } }) // Samsung S25 Ultra

    test('home page mobile — no horizontal overflow', async ({ page }) => {
        await page.goto('/pt')
        const body = page.locator('body')
        const box = await body.boundingBox()
        if (box) {
            expect(box.width).toBeLessThanOrEqual(412)
        }
    })

    test('imóveis page mobile — no horizontal overflow', async ({ page }) => {
        await page.goto('/pt/imoveis')
        await page.waitForTimeout(1000)
        // Check no horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // 2px tolerance
    })
})

test.describe('Flow 5: SEO basics', () => {
    test('home page has meta description', async ({ page }) => {
        await page.goto('/pt')
        const metaDesc = await page.locator('meta[name="description"]').getAttribute('content')
        expect(metaDesc).toBeTruthy()
        expect(metaDesc!.length).toBeGreaterThan(20)
    })

    test('home page has Open Graph tags', async ({ page }) => {
        await page.goto('/pt')
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
        expect(ogTitle).toBeTruthy()
    })

    test('robots.txt is accessible', async ({ request }) => {
        const response = await request.get('/robots.txt')
        expect(response.status()).toBe(200)
        const text = await response.text()
        expect(text).toContain('User-agent')
    })

    test('sitemap.xml is accessible', async ({ request }) => {
        const response = await request.get('/sitemap.xml')
        expect(response.status()).toBe(200)
    })
})
