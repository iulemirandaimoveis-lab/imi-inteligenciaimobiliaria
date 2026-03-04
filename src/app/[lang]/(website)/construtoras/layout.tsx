import type { Metadata } from 'next'
import { PAGE_METADATA } from '@/lib/page-metadata'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    return PAGE_METADATA.construtoras(params.lang)
}

export default function ConstrutorasLayout({ children }: { children: React.ReactNode }) {
    return children
}
