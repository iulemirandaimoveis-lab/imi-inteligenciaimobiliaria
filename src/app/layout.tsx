import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Playfair_Display } from 'next/font/google';
// DEPLOY_VERSION: v6.0.0 - DS6 PRECISION DARK
import './globals.css';

// D3.1 — Reduced to 3 font families: GeistSans, GeistMono, Playfair_Display
const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-playfair',
    display: 'swap',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#0B1120',
};

export const metadata: Metadata = {
    title: 'IMI – Inteligência Imobiliária',
    description: 'Avaliações técnicas NBR 14653, consultoria estratégica e corretagem premium',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'IMI',
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
};

// force-dynamic needed at root level because multiple providers/libs call cookies()
// indirectly, causing build timeouts on 170+ pages. Removing this requires auditing
// every page's dependency tree first. Website perf is still good via Vercel edge cache.
// TODO: Migrate to per-route dynamic config after Next.js 15 upgrade (async cookies).
export const dynamic = 'force-dynamic'

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import CookieConsent from '@/components/CookieConsent';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${playfair.variable}`}>
            <body className="min-h-screen bg-[var(--bg-base,#080D18)] relative" style={{ fontFamily: "var(--font-sans)" }}>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg">
                    Pular para o conteúdo
                </a>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <div id="main-content">{children}</div>
                    <CookieConsent />
                    <ServiceWorkerRegistration />
                </ThemeProvider>
                <InstallPrompt />
            </body>
        </html>
    )
}
