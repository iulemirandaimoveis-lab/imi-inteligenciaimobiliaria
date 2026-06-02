import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import AnalyticsProvider from '@/components/website/AnalyticsProvider'
import { WhatsAppFAB } from '@/components/website/WhatsAppFAB'
import EngagementTracker from '@/components/EngagementTracker'
import { generateOrganizationSchema, generateWebSiteSchema, generateLocalBusinessSchema } from '@/lib/seo'
import { getGlobalSettings } from '@/lib/settings'

export const metadata: Metadata = {
    title: 'IMI – Inteligência Imobiliária',
    description: 'Avaliações imobiliárias técnicas, consultoria estratégica e corretagem com curadoria.',
    alternates: {
        languages: {
            'pt-BR': 'https://www.iulemirandaimoveis.com.br/pt',
            'en': 'https://www.iulemirandaimoveis.com.br/en',
            'es': 'https://www.iulemirandaimoveis.com.br/es',
            'ja': 'https://www.iulemirandaimoveis.com.br/ja',
            'ar': 'https://www.iulemirandaimoveis.com.br/ar',
        },
    },
}

export default async function WebsiteLayout({
    children,
    params: { lang },
}: {
    children: React.ReactNode
    params: { lang: string }
}) {
    const isRTL = lang === 'ar'
    const organizationSchema = generateOrganizationSchema()
    const webSiteSchema = generateWebSiteSchema()
    const localBusinessSchema = generateLocalBusinessSchema()
    const settings = await getGlobalSettings()

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden bg-[#0B1928]" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Performance: DNS prefetch & preconnect for external origins */}
            <link rel="dns-prefetch" href="https://zocffccwjjyelwrgunhu.supabase.co" />
            <link rel="preconnect" href="https://zocffccwjjyelwrgunhu.supabase.co" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {/* D3.6 — Preload hero LCP image */}
            <link rel="preload" as="image" href="/hero-bg.jpg" fetchPriority="high" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, webSiteSchema, localBusinessSchema]) }}
            />
            <Suspense fallback={null}>
                <AnalyticsProvider
                    googleAnalytics={settings.googleAnalytics}
                    facebookPixel={settings.facebookPixel}
                />
            </Suspense>
            <Header lang={lang} settings={settings} />
            <main id="main-content" className="flex-grow pt-[60px] lg:pt-[68px]">{children}</main>
            <Footer lang={lang} settings={settings} />
            <WhatsAppFAB />
            <EngagementTracker />
        </div>
    )
}
