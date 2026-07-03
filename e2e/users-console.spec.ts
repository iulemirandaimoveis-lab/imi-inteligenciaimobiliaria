import { test, expect, expectNoConsoleErrors, expectNoHorizontalOverflow } from './fixtures'

/**
 * Console IMI (/users) — autenticação, fronteiras de acesso e consistência de
 * navegação. Todos os testes rodam SEM credenciais: validam o comportamento
 * não-autenticado (redirects do middleware) e a superfície pública (login).
 * Fluxos autenticados/RBAC por papel exigem seeds dedicados — ver
 * docs/TESTING_STRATEGY.md.
 */

test.describe('Console /users — fronteiras de autenticação', () => {
    test('rota protegida redireciona para login com retorno (next=)', async ({ page }) => {
        await page.goto('/users/dashboard', { waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(/\/users\/login/)
        expect(page.url()).toContain('next=')
    })

    test('/users (índice) exige sessão', async ({ page }) => {
        await page.goto('/users', { waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(/\/users\/(login|dashboard)/)
    })

    test('login renderiza formulário completo sem erros de console', async ({ page, consoleErrors }) => {
        await page.goto('/users/login', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 20_000 })
        await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible()
        await expect(page.locator('button[type="submit"]').first()).toBeVisible()
        expectNoConsoleErrors(consoleErrors)
    })

    test('prefixo de idioma em /users é tolerado (PWA/bookmark antigo)', async ({ page }) => {
        // O middleware reescreve /pt/users/* para o console sem loop de redirect.
        await page.goto('/pt/users/login', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 20_000 })
    })

    test('headers de segurança presentes nas rotas do console', async ({ request }) => {
        const res = await request.get('/users/login', { maxRedirects: 0 })
        expect(res.headers()['x-content-type-options']).toBe('nosniff')
        expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })

    test('login sem overflow horizontal (mobile e desktop)', async ({ page }) => {
        await page.goto('/users/login', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1500)
        await expectNoHorizontalOverflow(page, '/users/login')
    })

    test('rota de API protegida não vaza dados sem sessão', async ({ request }) => {
        const res = await request.get('/api/tracking/analytics', { maxRedirects: 0 })
        expect([401, 403, 307, 308]).toContain(res.status())
    })
})
