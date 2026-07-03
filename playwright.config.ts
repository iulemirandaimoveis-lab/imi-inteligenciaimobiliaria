import { defineConfig, devices } from '@playwright/test'

/**
 * Arquitetura E2E do IMI.
 *
 * Modos de execução:
 *  • Local (default): sobe `npm run dev` em :3000 (exige .env.local com Supabase).
 *  • Remoto: `BASE_URL=https://www.iulemirandaimoveis.com.br npx playwright test`
 *    — roda os specs read-only contra produção/preview sem servidor local.
 *
 * Projetos:
 *  • desktop — Chrome 1440×900. Roda todos os specs.
 *  • mobile  — Pixel 7 (touch). Roda os specs de página crítica (Alto Bellevue,
 *    Jazz Boulevard, console /users) para paridade mobile.
 *  O spec responsive.spec.ts gerencia os próprios viewports (matriz completa)
 *  e por isso roda apenas no projeto desktop.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const isRemoteTarget = !BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')

// Sandboxes/CI com Chromium pré-instalado podem apontar o binário aqui em vez
// de baixar browsers (ex.: PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium).
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
const launchOptions = chromiumExecutable ? { executablePath: chromiumExecutable } : undefined

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: process.env.CI ? 2 : 1,
    fullyParallel: true,
    reporter: [['list']],
    use: {
        baseURL: BASE_URL,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        locale: 'pt-BR',
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions },
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 7'], launchOptions },
            testMatch: /(alto-bellevue|jazz-boulevard|users-console|smoke)\.spec\.ts/,
        },
    ],
    webServer: isRemoteTarget
        ? undefined
        : {
            command: 'npm run dev',
            port: 3000,
            timeout: 120_000,
            reuseExistingServer: true,
        },
})
