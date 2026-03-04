
import { getDictionary } from '@/lib/dictionaries'
import Hero from '@/components/home/Hero'
import Services from '@/components/home/Services'
import FeaturedDevelopments from '@/components/home/FeaturedDevelopments'
import Method from '@/components/home/Method'
import CTA from '@/components/home/CTA'

export default async function HomePage({ params }: { params: { lang: 'pt' | 'en' | 'ja' } }) {
    const dict = await getDictionary(params.lang)

    return (
        <div className="bg-[#0D1117]">
            <Hero dict={dict.Home} />
            <Services dict={dict.Home} />
            <FeaturedDevelopments lang={params.lang} />
            <Method dict={dict.Home} />
            <CTA dict={dict.Home} />
        </div>
    )
}
