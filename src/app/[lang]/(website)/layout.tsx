import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import ChatWidget from '@/components/website/ChatWidget'
import AnalyticsProvider from '@/components/website/AnalyticsProvider'
import { generateOrganizationSchema } from '@/lib/seo'
import { getGlobalSettings } from '@/lib/settings'

export const metadata: Metadata = {
    title: 'IMI – Inteligência Imobiliária',
    description: 'Avaliações imobiliárias técnicas, consultoria estratégica e corretagem com curadoria.',
}

export default async function WebsiteLayout({
    children,
    params: { lang },
}: {
    children: React.ReactNode
    params: { lang: 'pt' | 'en' | 'ja' | 'ar' | 'es' }
}) {
    const isRTL = lang === 'ar'
    const organizationSchema = generateOrganizationSchema()
    const settings = await getGlobalSettings()

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Suspense fallback={null}>
                <AnalyticsProvider
                    googleAnalytics={settings.googleAnalytics}
                    facebookPixel={settings.facebookPixel}
                />
            </Suspense>
            <Header lang={lang} settings={settings} />
            <main className="flex-grow pt-[60px] lg:pt-[68px]">{children}</main>
            <Footer lang={lang} settings={settings} />
            <ChatWidget />
        </div>
    )
}
