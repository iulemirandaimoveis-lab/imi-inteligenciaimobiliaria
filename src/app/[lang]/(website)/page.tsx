import { getDictionary } from '@/lib/dictionaries'
import Hero from '@/components/home/Hero'
import Services from '@/components/home/Services'
import Method from '@/components/home/Method'
import CTA from '@/components/home/CTA'

export default async function HomePage({ params }: { params: { lang: 'pt' | 'en' | 'ja' | 'ar' | 'es' } }) {
    const dict = await getDictionary(params.lang)

    return (
        <div className="bg-white">
            <Hero dict={dict.Home} />
            <Services dict={dict.Home} />
            <Method dict={dict.Home} />
            <CTA dict={dict.Home} />
        </div>
    )
}

