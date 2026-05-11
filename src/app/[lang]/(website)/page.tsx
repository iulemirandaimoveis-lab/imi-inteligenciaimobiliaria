
import type { Metadata } from 'next'
import { getDictionary } from '@/lib/dictionaries'
import { PAGE_METADATA } from '@/lib/page-metadata'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.home(params.lang)
}

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Hero from '@/components/home/Hero'
import FeaturedDevelopments from '@/components/home/FeaturedDevelopments'

// Below-the-fold client components — lazy loaded for faster LCP
const Services = dynamic(() => import('@/components/home/Services'))
const Method = dynamic(() => import('@/components/home/Method'))
const CTA = dynamic(() => import('@/components/home/CTA'))

export default async function HomePage({ params }: { params: { lang: 'pt' | 'en' | 'ja' } }) {
    const dict = await getDictionary(params.lang)

    return (
        <div style={{ background: '#0B1928' }}>
            <Hero dict={dict.Home} />
            <Services dict={dict.Home} />
            <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                <FeaturedDevelopments lang={params.lang} />
            </Suspense>
            <Method dict={dict.Home} />
            <CTA dict={dict.Home} />
        </div>
    )
}
