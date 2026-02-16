
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Header from './components/Header'
import Footer from './components/Footer'
import { generateOrganizationSchema } from '@/lib/seo'
import { getDictionary } from '@/lib/dictionaries'

export const metadata: Metadata = {
    title: 'IMI – Inteligência Imobiliária',
    description: 'Avaliações imobiliárias técnicas, consultoria estratégica e corretagem com curadoria.',
}

export default async function WebsiteLayout({
    children,
    params: { lang }
}: {
    children: React.ReactNode
    params: { lang: 'pt' | 'en' | 'ja' | 'ar' | 'es' }
}) {
    const isRTL = lang === 'ar';
    const organizationSchema = generateOrganizationSchema()

    return (
        <div className="flex flex-col min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <Header lang={lang} />
            <main className="flex-grow">{children}</main>
            <Footer lang={lang} />
        </div>
    )
}
