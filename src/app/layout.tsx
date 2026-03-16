import type { Metadata, Viewport } from 'next';
import { Libre_Baskerville, Figtree, JetBrains_Mono, Inter } from 'next/font/google';
// DEPLOY_VERSION: v2.0.0 - DS3 NAVY×GOLD
import './globals.css';

const libreBaskerville = Libre_Baskerville({
    subsets: ['latin'],
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    variable: '--font-libre-baskerville',
    display: 'swap',
});

const figtree = Figtree({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600'],
    variable: '--font-figtree',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['300', '400', '500'],
    variable: '--font-jetbrains-mono',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-inter',
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning className={`${libreBaskerville.variable} ${figtree.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
            <body className={`${figtree.className} min-h-screen bg-[var(--bo-bg,#0B1120)] relative`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                    <CookieConsent />
                </ThemeProvider>
            </body>
        </html>
    )
}
