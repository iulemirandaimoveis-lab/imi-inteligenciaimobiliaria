
import type { Metadata } from 'next'
import { getDictionary } from '@/lib/dictionaries'
import { PAGE_METADATA } from '@/lib/page-metadata'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.home(params.lang)
}

import Hero from '@/components/home/Hero'
import Services from '@/components/home/Services'
import FeaturedDevelopments from '@/components/home/FeaturedDevelopments'
import MarketNumbers from '@/components/home/MarketNumbers'
import Partners from '@/components/home/Partners'
import Method from '@/components/home/Method'
import GlobalPresence from '@/components/home/GlobalPresence'
import Testimonials from '@/components/home/Testimonials'
import MarketInsights from '@/components/home/MarketInsights'
import FAQ from '@/components/home/FAQ'
import Newsletter from '@/components/home/Newsletter'
import CTA from '@/components/home/CTA'

export default async function HomePage({ params }: { params: { lang: 'pt' | 'en' | 'ja' } }) {
    const dict = await getDictionary(params.lang)

    return (
        <div className="bg-[#0D1117]">
            {/* 1. Hero — full-screen com parallax e stats */}
            <Hero dict={dict.Home} />
            {/* 2. Serviços — cards com tilt effect */}
            <Services dict={dict.Home} />
            {/* 3. Imóveis em Destaque — bento grid */}
            <FeaturedDevelopments lang={params.lang} />
            {/* 4. Números — animated counters */}
            <MarketNumbers />
            {/* 5. Certificações e Parceiros */}
            <Partners />
            {/* 6. Metodologia — 3 steps */}
            <Method dict={dict.Home} />
            {/* 7. Presença Global — 4 mercados */}
            <GlobalPresence />
            {/* 8. Depoimentos — carousel animado */}
            <Testimonials />
            {/* 9. Inteligência de Mercado — insights cards */}
            <MarketInsights />
            {/* 10. FAQ — accordion premium */}
            <FAQ />
            {/* 11. Newsletter — email capture */}
            <Newsletter />
            {/* 12. CTA Final */}
            <CTA dict={dict.Home} />
        </div>
    )
}
