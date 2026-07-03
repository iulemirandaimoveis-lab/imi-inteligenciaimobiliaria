import { test as base, expect, type Page } from '@playwright/test'

/**
 * Fixtures compartilhadas dos testes E2E do IMI.
 *
 * `consoleErrors` — coleta erros de console e exceções de página durante o
 * teste, já filtrando ruído de terceiros (tiles de mapa, analytics, fontes).
 * Specs que querem o gate de "zero erros de console" chamam
 * `expectNoConsoleErrors(consoleErrors)` ao final.
 */

// Hosts/padrões de terceiros cujo erro não indica defeito nosso (tile pontual
// fora do ar, bloqueio de analytics, etc.). Erros de código próprio NUNCA
// entram aqui — se um erro primeiro-partido aparecer, o teste deve falhar.
const THIRD_PARTY_NOISE = [
    'server.arcgisonline.com',
    'fonts.openmaptiles.org',
    'sentry.io',
    'ingest.sentry',
    'google-analytics.com',
    'googletagmanager.com',
    'vercel-insights.com',
    'vitals.vercel-insights.com',
    'kuula.co',
    'youtube.com',
    'ERR_BLOCKED_BY_CLIENT',
]

export interface ConsoleErrorCollector {
    errors: string[]
}

type ImiFixtures = {
    consoleErrors: ConsoleErrorCollector
}

export const test = base.extend<ImiFixtures>({
    consoleErrors: async ({ page }, use) => {
        const collector: ConsoleErrorCollector = { errors: [] }
        page.on('console', (msg) => {
            if (msg.type() !== 'error') return
            const url = msg.location().url || ''
            const text = msg.text()
            if (THIRD_PARTY_NOISE.some((h) => url.includes(h) || text.includes(h))) return
            collector.errors.push(`${text}${url ? ` (${url})` : ''}`)
        })
        page.on('pageerror', (err) => {
            collector.errors.push(`pageerror: ${err.message}`)
        })
        await use(collector)
    },
})

export { expect }

export function expectNoConsoleErrors(collector: ConsoleErrorCollector) {
    expect(collector.errors, `Erros de console primeiro-partido:\n${collector.errors.join('\n')}`).toEqual([])
}

/** Falha se a página tem scroll horizontal (tolerância de 2px de subpixel). */
export async function expectNoHorizontalOverflow(page: Page, label = '') {
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, `Overflow horizontal ${label} (${overflow}px além do viewport)`).toBeLessThanOrEqual(2)
}

/** Viewports canônicos da matriz responsiva (Apple Experience Mode). */
export const VIEWPORTS = {
    phoneSmall: { width: 360, height: 740 },   // Android compacto
    phoneLarge: { width: 412, height: 915 },   // Pixel/Galaxy grandes
    phoneLandscape: { width: 915, height: 412 },
    tabletPortrait: { width: 768, height: 1024 },
    tabletLandscape: { width: 1024, height: 768 },
    laptop: { width: 1280, height: 800 },
    desktop: { width: 1440, height: 900 },
    ultrawide: { width: 2560, height: 1080 },
} as const
