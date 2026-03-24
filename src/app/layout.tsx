import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Syne, Playfair_Display, JetBrains_Mono } from 'next/font/google';
// DEPLOY_VERSION: v6.0.0 - DS6 PRECISION DARK
import './globals.css';

// DS v6 display font (Syne) — loaded via Google Fonts
const syne = Syne({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-syne',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-playfair',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    variable: '--font-jetbrains',
    display: 'swap',
});

// Legacy fonts kept for compatibility (still referenced in some components)
const cormorant = localFont({
    src: [
        { path: '../../public/fonts/cormorant-garamond-latin-wght-normal.woff2', style: 'normal' },
        { path: '../../public/fonts/cormorant-garamond-latin-wght-italic.woff2', style: 'italic' },
    ],
    variable: '--font-cormorant',
    display: 'swap',
});

const outfit = localFont({
    src: '../../public/fonts/outfit-latin-wght-normal.woff2',
    variable: '--font-outfit',
    display: 'swap',
});

const dmMono = localFont({
    src: [
        { path: '../../public/fonts/dm-mono-latin-300-normal.woff2', weight: '300', style: 'normal' },
        { path: '../../public/fonts/dm-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
        { path: '../../public/fonts/dm-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    ],
    variable: '--font-dm-mono',
    display: 'swap',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,     // Prevent zoom that can cause layout issues
    userScalable: false, // Prevent user scaling (app-like behavior)
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
            { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: [
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
};

// Force all pages to be server-rendered (no SSG) — prevents build errors
// from Supabase calls that need runtime env vars not available at build time
export const dynamic = 'force-dynamic';

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
        <html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable} ${outfit.variable} ${dmMono.variable} ${syne.variable} ${playfair.variable} ${jetbrains.variable}`}>
            <body className="min-h-screen bg-[var(--bg-base,#080D18)] relative" style={{ fontFamily: "var(--fu, 'Outfit', system-ui, sans-serif)" }}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                    <CookieConsent />
                    <ServiceWorkerRegistration />
                </ThemeProvider>
                <InstallPrompt />
            </body>
        </html>
    )
}
