import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
// DEPLOY_VERSION: v3.1.0 - DS3.1 DESIGN SYSTEM UPGRADE
import './globals.css';

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

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import CookieConsent from '@/components/CookieConsent';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning className={`${cormorant.variable} ${outfit.variable} ${dmMono.variable}`}>
            <body className={`${outfit.className} min-h-screen bg-[var(--bg-base,#0B1120)] relative`}>
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
            </body>
        </html>
    )
}
