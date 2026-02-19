import type { Metadata } from 'next'
import Header from '@/components/website/Header'
import Footer from '@/components/website/Footer'
import { generateOrganizationSchema } from '@/lib/seo'

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

    return (
        <div className="flex flex-col min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Header lang={lang} />
            <main className="flex-grow pt-[68px] lg:pt-[76px]">{children}</main>
            <Footer lang={lang} />
        </div>
    )
}
